import type { FeedResolver } from "#src/resolvers/feed-resolver/mod.ts";
import { contentType } from "@std/media-types";
import { DOMParser, type Element } from "deno-dom";

export class JSONFeedResolver implements FeedResolver {
  resolveHomePageUrl(feed: Record<string, unknown>) {
    return feed?.home_page_url as string;
  }

  toObject(data: unknown) {
    if (!data) return;

    return JSON.parse(data as string);
  }

  resolveFeed(data: Record<string, unknown>) {
    return data;
  }

  resolveFeedTitle(data: Record<string, unknown>) {
    return data?.title as string;
  }

  resolveFeedItems(data: Record<string, unknown>) {
    return data?.items as Record<string, unknown>[];
  }

  resolveFeedItemGuid(feedItem: Record<string, unknown>) {
    return feedItem?.id as string;
  }

  resolveFeedItemLink(feedItem: Record<string, unknown>) {
    return (feedItem?.url ?? feedItem?.external_url) as string;
  }

  resolveFeedItemTitle(feedItem: Record<string, unknown>) {
    return feedItem?.title as string;
  }

  resolveFeedItemEnclosures(feedItem: Record<string, unknown>) {
    return (
      feedItem?.attachments as { url?: string; mime_type?: string }[] ??
        []
    )
      .filter(({ url }) => url !== null && url !== undefined)
      .map(({ mime_type, url }) => ({ url: url!, type: mime_type }));
  }

  resolveFeedItemImage(feedItem: Record<string, unknown>) {
    const image = feedItem?.image as string;

    if (image) return image;

    const enclosures = this.resolveFeedItemEnclosures(feedItem);

    const found = enclosures.find(({ type, url }) => {
      const hasUrl = typeof url === "string" && url.trim().length > 0;
      const isImgByType = ["image", "img"].some((fragment) =>
        type?.includes(fragment)
      );
      const ext = url?.split(".")?.at(-1);
      const mt = contentType(ext ?? "");
      const isImageByUrl = mt &&
        ["image", "img"].some((fragmet) => mt.includes(fragmet));

      return hasUrl && (isImgByType || isImageByUrl);
    });

    if (found) return found.url;

    const content = this.resolveFeedItemContent(feedItem);

    if (content) {
      const r = /<img[^>]+src="([^"]+)"/im;
      const match = r.exec(content);

      if (match?.[1]) {
        return match?.[1];
      }
    }

    const imgFromLink = this.resolveFeedItemLink(feedItem);

    if (
      ["jpeg", "jpg", "gif", "png", "webp"].includes(
        imgFromLink?.split(".")?.at(-1) ?? "",
      )
    ) {
      return imgFromLink;
    }

    const banner = feedItem?.banner_image as string;

    if (banner) return banner;
  }

  resolveFeedItemContent(feedItem: Record<string, unknown>) {
    return (this.#formatFeedItemContent(feedItem?.content_html as string) ??
      feedItem?.content_text ?? feedItem?.summary) as string;
  }

  resolveFeedItemPubDate(feedItem: Record<string, unknown>) {
    if (
      typeof feedItem?.date_published !== "string" ||
      Number.isNaN(new Date(feedItem?.date_published).valueOf())
    ) return;

    return new Date(feedItem.date_published);
  }
  resolveUpdatedAt(feedItem: Record<string, unknown>) {
    if (
      typeof feedItem?.date_modified !== "string" ||
      Number.isNaN(new Date(feedItem?.date_modified).valueOf())
    ) return;

    return new Date(feedItem.date_modified);
  }

  #formatFeedItemContent(content?: string) {
    if (!content) return content;

    const dom = new DOMParser().parseFromString(content, "text/html");

    if (!dom) {
      return content;
    }

    for (const element of dom.querySelectorAll("iframe")) {
      const wrapper = new DOMParser().parseFromString(
        `<div class="iframe-container">${(element as Element).outerHTML}</div>`,
        "text/html",
      )?.querySelector("div.iframe-container") as Element | undefined;

      if (!wrapper) continue;

      element.parentNode?.insertBefore(wrapper, element);
      (element as Element).remove();
    }

    for (const element of dom.querySelectorAll("a")) {
      (element as Element).setAttribute("target", "_blank");
    }

    for (const element of dom.querySelectorAll("script")) {
      (element as Element).remove();
    }

    return dom.body.innerHTML;
  }
}

import type { FeedResolver } from "#src/resolvers/feed-resolver/interfaces.ts";
import type { XMLBuilder, XMLParser } from "fast-xml-parser";
import { contentType } from "@std/media-types";
import { DOMParser, type Element } from "deno-dom";
import * as _ from "lodash-es";

export class XMLFeedResolver implements FeedResolver {
  #builder: XMLBuilder;
  #parser: XMLParser;

  constructor({ builder, parser }: { builder: XMLBuilder; parser: XMLParser }) {
    this.#builder = builder;
    this.#parser = parser;
  }

  resolveHomePageUrl(feed: Record<string, unknown>) {
    const searchKeys = [
      "link",
      "channel.link",
      "atom:link",
    ];

    return _.chain(searchKeys)
      .map((k) => _.get(feed, k))
      .flatMap((v) => Array.isArray(v) ? v : [v])
      .filter((v) => typeof v === "object" ? !v?.["@_rel"] : v)
      .map((v) => typeof v === "object" ? v?.["@_href"] : v)
      .find((v) => typeof v === "string" && v.trim().length > 0)
      .value() as string;
  }

  toObject(data: unknown) {
    if (!data) return;

    return this.#parser.parse(data as string) as Record<string, unknown>;
  }

  resolveFeed(data: Record<string, unknown>) {
    const searchKeys = ["rss", "rdf:RDF", "feed"];

    return _.chain(searchKeys)
      .map((k) => _.get(data, k))
      .find((v) => _.isPlainObject(v))
      .value() as Record<string, unknown> | undefined;
  }

  resolveFeedTitle(feed: Record<string, unknown>) {
    const searchKeys = [
      "channel.title",
      "title",
      "title.#text",
      "atom:title",
      "a10:title",
    ];

    return _.chain(searchKeys)
      .map((k) => _.get(feed, k))
      .find((v) => typeof v === "string" && v.trim().length > 0)
      .value() as string;
  }

  resolveFeedItems(feed: Record<string, unknown>) {
    const searchKeys = [
      "channel.item",
      "channel.items",
      "item",
      "items",
      "entry",
    ];

    return (_.chain(searchKeys)
      .map((k) =>
        Array.isArray(_.get(feed, k)) ? _.get(feed, k) : [_.get(feed, k)]
      )
      .map((v) =>
        (v as unknown[]).filter((item) => item !== null && item !== undefined)
      )
      .find((v) => !_.isEmpty(v))
      .value() ?? []) as Array<Record<string, unknown>>;
  }

  resolveFeedItemGuid(feedItem: Record<string, unknown>) {
    const searchKeys = [
      "guid",
      "guid.#text",
      "id",
      "id.#text",
      "newsid",
      "atom:id",
      "a10:id",
      "atom:guid",
      "a10:guid",
    ];

    const value = _.chain(searchKeys)
      .map((k) => _.get(feedItem, k))
      .find(
        (v) =>
          (typeof v === "string" && v.trim().length > 0) ||
          typeof v === "number",
      )
      .value() as string | number | undefined;

    if (!value) return;

    return String(value);
  }

  resolveFeedItemLink(feedItem: Record<string, unknown>) {
    const searchKeys = ["id", "link", "link.@_href", "atom:link", "a10:link"];

    return _.chain(searchKeys)
      .map((k) => _.get(feedItem, k))
      .filter((v) => typeof v === "string" && v.trim().length > 0)
      .map((v) => (v as string).trim())
      .filter((v) => v.startsWith("http") || v.startsWith("https"))
      .first()
      .value() as string | undefined;
  }

  resolveFeedItemTitle(feedItem: Record<string, unknown>) {
    const searchKeys = ["title", "title.#text", "atom:title", "a10:title"];

    return (
      _.chain(searchKeys)
        .map((k) => _.get(feedItem, k))
        .find((v) => typeof v === "string" && v.trim().length > 0)
        .value() as string | undefined
    )?.replace(/&\S*;/g, "");
  }

  resolveFeedItemEnclosures(feedItem: Record<string, unknown>) {
    const searchKeys = ["enclosure"];

    return _.chain(searchKeys)
      .map((k) => _.get(feedItem, k) as Record<string, unknown>)
      .filter((v) => _.isPlainObject(v))
      .map((v) => ({
        url: _.get(v, "@_url") as string,
        type: _.get(v, "@_type") as string,
      }))
      .filter(
        (v) =>
          _.has(v, "url") && typeof v.url === "string" &&
          v.url.trim().length > 0,
      )
      .value() as Array<{ url: string; type?: string }>;
  }

  resolveFeedItemImage(
    feedItem: Record<string, unknown>,
  ) {
    const enclosures = this.resolveFeedItemEnclosures(feedItem);

    const found = enclosures.find(({ type, url }) => {
      const isTypeImg = _.includes(type, "image") || _.includes(type, "img");
      const hasUrl = typeof url === "string" && url.trim().length > 0;
      const ext = url?.split(".")?.at(-1);
      const mt = contentType(ext ?? "");
      const hasImgUrl = mt && (mt.startsWith("image") || mt.startsWith("img"));

      return (isTypeImg && hasUrl) || hasImgUrl;
    });

    if (found) return found.url;

    if (
      _.has(feedItem, "media:content") &&
      _.has(feedItem, "media:content.@_url") &&
      (_.get(feedItem, "media:content.@_medium") === "image" ||
        _.includes(
          _.get(feedItem, "media:content.@_type") as string,
          "image",
        ) ||
        _.includes(_.get(feedItem, "media:content.@_type") as string, "img") ||
        ["jpeg", "jpg", "gif", "png", "webp"].includes(
          _.get(feedItem, "media:content.@_url") as string,
        ))
    ) {
      return _.get(feedItem, "media:content.@_url") as string;
    }

    const searchKeys = [
      "description.img",
      "description.img.@_src",
      "media:thumbnail",
      "media:thumbnail.@_url",
      "media:group.media:thumbnail",
      "media:group.media:thumbnail.@_url",
      "logo",
      "atom:logo",
      "a10:logo",
    ];

    const result = _.chain(searchKeys)
      .map((k) => _.get(feedItem, k) as unknown)
      .find((v) => typeof v === "string" && v.trim().length > 0)
      .value() as string | undefined;

    if (result) return result;

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
  }

  resolveFeedItemContent(feed: Record<string, unknown>) {
    const searchKeys = [
      "content",
      "content.#text",
      "content:encoded",
      "description",
      "description.#text",
      "summary",
      "summary.#text",
      "atom:content",
      "a10:content",
      "atom:sumary",
      "a10:sumary",
      "media:group.media:description",
    ];

    const xhtmlContent = _.get(feed, "content.@_type") === "xhtml";
    const contentObject = _.isPlainObject(_.get(feed, "content"));
    const parsedXhtml = contentObject && xhtmlContent
      ? (this.#builder.build(_.pick(feed, "content")) as string)
      : undefined;

    return this.#formatFeedItemContent(
      _.chain(searchKeys)
        .map((k) => _.get(feed, k) as unknown)
        .unshift(parsedXhtml)
        .map((v) =>
          Array.isArray(v)
            ? v
              .filter((x) => typeof x === "string" && x.trim().length > 0)
              .join("\n")
            : v
        )
        .find((v) => typeof v === "string" && v.trim().length > 0)
        .value() as string | undefined,
    );
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

  resolveFeedItemPubDate(feed: Record<string, unknown>) {
    const searchKeys = [
      "pubDate",
      "published",
      "atom:pubDate",
      "a10:pubDate",
      "atom:published",
      "a10:published",
    ];

    return _.chain(searchKeys)
      .map((k) => _.get(feed, k))
      .find((v) => typeof v === "string" && v.trim().length > 0)
      .thru((v) => {
        const d = new Date(v as string);
        return Number.isNaN(d.valueOf()) ? undefined : d;
      })
      .value() as Date | undefined;
  }

  resolveUpdatedAt(feed: Record<string, unknown>) {
    const searchKeys = ["updated", "atom:updated", "a10:updated"];

    return _.chain(searchKeys)
      .map((k) => _.get(feed, k))
      .find((v) => typeof v === "string" && v.trim().length > 0)
      .thru((v) => {
        const d = new Date(v as string);
        return Number.isNaN(d.valueOf()) ? undefined : d;
      })
      .value() as Date | undefined;
  }
}

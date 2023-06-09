import * as _ from "lodash-es";
import { parse } from "node-html-parser";
import { type XMLBuilder } from "fast-xml-parser";

/**
 * Feed resolvers.
 */

export const resolveFeed = (feed: Record<string, unknown>) => {
  const searchKeys = ["rss", "rdf:RDF", "feed"];

  return _.chain(searchKeys)
    .map((k) => _.get(feed, k))
    .find((v) => _.isPlainObject(v))
    .value() as Record<string, unknown> | undefined;
};

export const resolveFeedTitle = (feed: Record<string, unknown>) => {
  const searchKeys = ["channel.title", "title", "title.#text"];

  return _.chain(searchKeys)
    .map((k) => _.get(feed, k))
    .find((v) => typeof v === "string" && v.trim().length > 0)
    .value() as string;
};

export const resolveFeedItems = (feed: Record<string, unknown>) => {
  const searchKeys = ["channel.item", "channel.items", "item", "items", "entry"];

  return _.chain(searchKeys)
    .map((k) => (Array.isArray(_.get(feed, k)) ? _.get(feed, k) : [_.get(feed, k)]))
    .map((v) => (v as unknown[]).filter((item) => item !== null && item !== undefined))
    .find((v) => !_.isEmpty(v))
    .value() as Array<Record<string, unknown>> | undefined;
};

/**
 * Feed item resolvers.
 */

export const resolveFeedItemGuid = (feed: Record<string, unknown>) => {
  const searchKeys = ["guid", "guid.#text", "id", "id.#text", "newsid"];

  const value = _.chain(searchKeys)
    .map((k) => _.get(feed, k))
    .find((v) => (typeof v === "string" && v.trim().length > 0) || typeof v === "number")
    .value() as string | number | undefined;

  if (!value) return;

  return String(value);
};

export const resolveFeedItemLink = (feed: Record<string, unknown>) => {
  const searchKeys = ["link", "link.@_href"];

  return _.chain(searchKeys)
    .map((k) => _.get(feed, k))
    .find((v) => typeof v === "string" && v.trim().length > 0)
    .value() as string | undefined;
};

export const resolveFeedItemTitle = (feed: Record<string, unknown>) => {
  const searchKeys = ["title", "title.#text"];

  return (
    _.chain(searchKeys)
      .map((k) => _.get(feed, k))
      .find((v) => typeof v === "string" && v.trim().length > 0)
      .value() as string | undefined
  )?.replace(/&\S*;/g, "");
};

export const resolveFeedItemEnclosures = (feed: Record<string, any>) => {
  const searchKeys = ["enclosure", "media:content"];

  return _.chain(searchKeys)
    .map((k) => _.get(feed, k) as Record<string, unknown>)
    .filter((v) => _.isPlainObject(v))
    .map((v) => ({ url: _.get(v, "@_url") as string, type: _.get(v, "@_type") as string }))
    .filter((v) => _.has(v, "url") && typeof v.url === "string" && v.url.trim().length > 0)
    .value() as Array<{ url: string; type?: string }>;
};

export const resolveFeedItemImage = (
  resolveFeedItemContent: (arg: Record<string, unknown>) => string | undefined,
  feed: Record<string, any>,
) => {
  const searchKeys = ["description.img.@_src"];

  const result = _.chain(searchKeys)
    .map((k) => _.get(feed, k) as unknown)
    .find((v) => typeof v === "string" && v.trim().length > 0)
    .value() as string | undefined;

  if (result) return result;

  const enclosures = resolveFeedItemEnclosures(feed);

  const found = enclosures.find(({ type, url }) => {
    const isTypeImg = _.includes(type, "image") || _.includes(type, "img");
    const hasUrl = typeof url === "string" && url.trim().length > 0;
    const hasImgUrl =
      _.endsWith(url, ".png") ||
      _.endsWith(url, ".jpg") ||
      _.endsWith(url, ".jpeg") ||
      _.endsWith(url, ".gif");

    return (isTypeImg && hasUrl) || hasImgUrl;
  });

  if (found) return found.url;

  const content = resolveFeedItemContent(feed);

  if (content) {
    const r = /<img[^>]+src="([^"]+)"/im;
    const match = r.exec(content);

    return match?.[1];
  }
};

export const resolveFeedItemContent = (builder: XMLBuilder, feed: Record<string, any>) => {
  const searchKeys = [
    "content",
    "content.#text",
    "content:encoded",
    "description",
    "description.#text",
    "summary",
    "summary.#text",
  ];

  const xhtmlContent = _.get(feed, "content.@_type") === "xhtml";
  const contentObject = _.isPlainObject(_.get(feed, "content"));
  const parsedXhtml =
    contentObject && xhtmlContent ? (builder.build(_.pick(feed, "content")) as string) : undefined;

  return _.chain(searchKeys)
    .map((k) => _.get(feed, k) as unknown)
    .unshift(parsedXhtml)
    .find((v) => typeof v === "string" && v.trim().length > 0)
    .value() as string | undefined;
};

export const formatFeedItemContent = (content?: string) => {
  if (!content) return content;

  const dom = parse(content);

  for (const element of dom.querySelectorAll("iframe")) {
    const wrapper = parse(`<div class="iframe-container">${element.toString()}</div>`)
      .childNodes[0];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    element.insertAdjacentHTML("beforebegin", wrapper.outerHTML);
    element.remove();
  }

  for (const element of dom.querySelectorAll("a")) {
    element.setAttribute("target", "_blank");
  }

  for (const element of dom.querySelectorAll("script")) element.remove();

  return dom.toString();
};

export const resolveFeedItemPubDate = (feed: Record<string, unknown>) => {
  const searchKeys = ["pubDate", "published"];

  return _.chain(searchKeys)
    .map((k) => _.get(feed, k))
    .find((v) => typeof v === "string" && v.trim().length > 0)
    .thru((v) => {
      const d = new Date(v as string);
      return Number.isNaN(d.valueOf()) ? undefined : d;
    })
    .value() as Date | undefined;
};

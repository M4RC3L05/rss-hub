import { xmlBuilder, xmlParser } from "#src/common/utils/xml-utils.ts";
import { XMLFeedResolver } from "#src/resolvers/feed-resolver/xml-feed-resolver.ts";
import { JSONFeedResolver } from "#src/resolvers/feed-resolver/json-feed-resolver.ts";

export type { FeedResolver } from "#src/resolvers/feed-resolver/interfaces.ts";
export const xmlFeedResolver = new XMLFeedResolver({
  builder: xmlBuilder,
  parser: xmlParser,
});
export const jsonFeedResolver = new JSONFeedResolver();

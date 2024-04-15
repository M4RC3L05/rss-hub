import { xmlBuilder } from "#src/common/utils/xml-utils.ts";
import { XMLFeedResolver } from "#src/resolvers/feed-resolver/xml-feed-resolver.ts";

export type { FeedResolver } from "#src/resolvers/feed-resolver/interfaces.ts";
export const xmlFeedResolver = new XMLFeedResolver({ builder: xmlBuilder });

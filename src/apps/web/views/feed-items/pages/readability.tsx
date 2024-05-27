import type { FC } from "@hono/hono/jsx";
import type { FeedItemsTable } from "#src/database/types/mod.ts";

type FeedItemsReadabilityPageProps = {
  feedItem: FeedItemsTable;
};

export const FeedItemsReadabilityPage: FC<FeedItemsReadabilityPageProps> = (
  { feedItem },
) => (
  <>
    <header>
      <h1>{feedItem.title}</h1>
    </header>

    <main
      id="feed-item-content"
      dangerouslySetInnerHTML={{ __html: feedItem.content }}
    />
  </>
);

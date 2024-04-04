import { html, raw } from "hono/html";
import type { FeedItemsTable } from "#src/database/types/mod.ts";
import { layouts } from "#src/apps/web/views/common/mod.ts";

type FeedItemsReadabilityPageProps = {
  feedItem: FeedItemsTable;
};

const FeedsReadabilityPage = (
  { feedItem }: FeedItemsReadabilityPageProps,
) =>
  html`
  <header>
    <h1>${feedItem.title}</h1>
  </header>

  <main id="feed-item-content">
    ${raw(feedItem.content)}
  </main>
`;

export default layouts.MainLayout({
  Csss: [() =>
    html`
     <style>
        #header-actions button,
        #header-actions .button,
        main button,
        main .button {
          font-size: .8rem;
          font-weight: bold;
          padding: .5rem .7rem;
        }
      </style>
  `],
  Body: FeedsReadabilityPage,
});

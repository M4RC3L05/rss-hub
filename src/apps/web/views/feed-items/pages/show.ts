import { html, raw } from "hono/html";
import type { FeedItemsTable } from "#src/database/types/mod.ts";
import { layouts } from "#src/apps/web/views/common/mod.ts";

type FeedItemsShowPageProps = {
  feedItem: FeedItemsTable;
};

const FeedsShowPage = (
  { feedItem }: FeedItemsShowPageProps,
) =>
  html`
  <header>
    <nav>
      <a href="/">Home</a>
    </nav>

    <h1>${feedItem.title}</h1>
  </header>

  <header id="header-actions" style="position: sticky; top: 0; padding: 8px 0px; display: flex; justify-content: center; z-index:2">
    <form
      style="margin-right: 4px"
      action="/feed-items/state"
      method="POST"
    >
      <input type="hidden" name="id" value=${feedItem.id} />
      <input type="hidden" name="feedId" value=${feedItem.feedId} />
      <input type="hidden" name="state" value=${
    feedItem.readedAt ? "unread" : "read"
  } />
      <button type="submit">
        Read ${feedItem.readedAt ? "☑" : "☐"}
      </button>
    </form>

    <form
      style="margin-right: 4px"
      action="/feed-items/state"
      method="POST"
    >
      <input type="hidden" name="id" value=${feedItem.id} />
      <input type="hidden" name="feedId" value=${feedItem.feedId} />
      <input type="hidden" name="state" value=${
    feedItem.bookmarkedAt ? "unbookmark" : "bookmark"
  } />
      <button type="submit">
        Bookmark ${feedItem.bookmarkedAt ? "☑" : "☐"}
      </button>
    </form>

    <a style="margin-right: 4px" class="button" href="/feed-items/${
    encodeURIComponent(feedItem.id)
  }/${feedItem.feedId}/readability">
      Readability
    </a>
  ${
    feedItem.link
      ? html`
          <a
            target="_blank"
            class="button"
            href=${feedItem.link}
          >
            Open ⇗
          </a>
        `
      : html``
  }
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
  Body: FeedsShowPage,
});

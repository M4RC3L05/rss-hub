import { html } from "hono/html";
import type { FeedItemsTable, FeedsTable } from "#src/database/types/mod.ts";
import { layouts } from "#src/apps/web/views/common/mod.ts";
import { encodeBase64Url } from "@std/encoding/base64url";

type FeedItemsIndexPageProps = {
  feed: FeedsTable;
  feedItems: FeedItemsTable[];
  feedItemsPagination: {
    previousLink: string;
    startLink: string;
    endLink: string;
    nextLink: string;
  };
  filters: {
    unreaded: { state: boolean; onLink: string; offLink: string };
    bookmarked: { state: boolean; onLink: string; offLink: string };
  };
};

const FeedsIndexPage = ({
  feed,
  feedItems,
  feedItemsPagination,
  filters,
}: FeedItemsIndexPageProps) =>
  html`
  <header>
    <nav>
      <a href="/">Home</a>
    </nav>

    <h1>${feed.name}</h1>
  </header>

  <header id="header-actions" style="position: sticky; top: 0; padding: 8px 0px; z-index: 2">
    <form
      style="display: inline;"
      action="/feed-items/state"
      method="post"
    >
      <input type="hidden" name="feedId" value=${feed.id} />
      <input type="hidden" name="state" value="read" />
      ${
    feedItems.map(
      (feedItem) =>
        html`<input type="hidden" name="id[]" value=${feedItem.id} />`,
    )
  }
      ${
    feedItems.length <= 0
      ? html`<input type="hidden" name="id[]" value="" />`
      : html``
  }
      <button type="submit">
        Read page ✓
      </button>
    </form>

    <form
      style="display: inline;"
      action="/feed-items/state"
      method="post"
    >
      <input type="hidden" name="feedId" value=${feed.id} />
      <input type="hidden" name="state" value="read" />
      <button type="submit">
        Read all ✓✓
      </button>
    </form>

    <a class="button" href=${`/feeds/${feed.id}/edit`}>Edit feed ✏</a>


    <dialog id="dialog-${feed.id}">
      <p>Are you sure you want to delete feed "${feed.name}"?</p>

      <form
        style="display: inline;"
        action="/feeds/${feed.id}/delete"
        method="post"
      >
        <button type="submit">
          Yes
        </button>
      </form>

      <form method="dialog" style="display: inline; margin-right: 8px">
        <button>No</button>
      </form>
    </dialog>

    <button
      style="display: inline; margin-right: 8px"
      onclick="getElementById('dialog-${feed.id}').show()"
    >
      Delete ⨯?
    </button>

    <br />

    <a
      class="button"
      href=${
    filters.unreaded.state ? filters.unreaded.offLink : filters.unreaded.onLink
  }
    >
      Unreaded ${filters.unreaded.state ? "☑" : "☐"}
    </a>
    <a
      class="button"
      href=${
    filters.bookmarked.state
      ? filters.bookmarked.offLink
      : filters.bookmarked.onLink
  }
    >
      Bookmarked ${filters.bookmarked.state ? "☑" : "☐"}
    </a>

    <br />

    <a class="button" href=${feedItemsPagination.startLink}>« Start</a>
    <a class="button" href=${feedItemsPagination.previousLink}>← Previous</a>
    <a class="button" href=${feedItemsPagination.nextLink}>Next →</a>
    <a class="button" href=${feedItemsPagination.endLink}>End »</a>
  </header>

  <main>
    ${
    feedItems.map(
      (feedItem) =>
        html`
        <section style="overflow: auto;">
          ${
          feedItem.img
            ? html`<aside><img src=${feedItem.img} /></aside>`
            : html``
        }

          <h3 style="margin-top: 0px">${feedItem.title}</h3>
          <p>${new Date(feedItem.createdAt).toLocaleString()}</p>

          <form
            style="display: inline; margin-right: 4px"
            action="/feed-items/state?redirect=${
          encodeBase64Url(
            `/feed-items/${encodeURIComponent(feedItem.id)}/${feedItem.feedId}`,
          )
        }"
            method="post"
          >
            <input type="hidden" name="feedId" value=${feed.id} />
            <input type="hidden" name="state" value="read" />
            <input type="hidden" name="id[]" value=${feedItem.id} />

            <button type="submit">
              More
            </button>
          </form>
          ${
          feedItem.link
            ? html`
                  <a
                    class="button"
                    target="_blank"
                    href=${feedItem.link}
                  >
                    Open ⇗
                  </a>
                `
            : html``
        }
        </section>
      `,
    )
  }
    ${feedItems.length <= 0 ? html`<p>No items to display</p>` : html``}
  </main>
`;

export default layouts.MainLayout({
  Csss: [
    () =>
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
    `,
  ],
  Body: FeedsIndexPage,
});

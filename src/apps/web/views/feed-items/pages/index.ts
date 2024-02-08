import { html } from "hono/html";
import { FeedItemsTable, FeedsTable } from "#src/database/types/mod.js";
import { layouts } from "../../common/mod.js";

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
}: FeedItemsIndexPageProps) => html`
  <header>
    <nav>
      <a href="/">Home</a>
    </nav>

    <h1>${feed.name}</h1>
  </header>

  <header id="header-actions" style="position: sticky; top: 0; padding: 8px 0px; z-index: 2">
    <form
      style="display: inline;"
      hx-patch="/feed-items/state"
      hx-swap="none"
      hx-on::after-on-load="window.location.reload()"
    >
      <input type="hidden" name="feedId" value=${feed.id} />
      <input type="hidden" name="state" value="read" />
      ${feedItems.map(
        (feedItem) =>
          html`<input type="hidden" name="id[]" value=${feedItem.id} />`,
      )}
      <button type="submit">
        Read page ✓
      </button>
    </form>

    <form
      style="display: inline;"
      hx-patch="/feed-items/state"
      hx-swap="none"
      hx-on::after-on-load="window.location.reload()"
    >
      <input type="hidden" name="feedId" value=${feed.id} />
      <input type="hidden" name="state" value="read" />
      <button type="submit">
        Read all ✓✓
      </button>
    </form>

    <a class="button" href=${`/feeds/edit?feedId=${feed.id}`}>Edit feed ✏</a>

    <form
      style="display: inline;"
      hx-post="/feeds/delete"
      hx-swap="none"
      hx-on::after-on-load="history.back()"
    >
      <input type="hidden" name="id" value=${feed.id} />
      <button type="submit">
        Delete feed ⨯
      </button>
    </form>

    <br />

    <a
      class="button"
      href=${
        filters.unreaded.state
          ? filters.unreaded.offLink
          : filters.unreaded.onLink
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
    ${feedItems.map(
      (feedItem) => html`
        <section style="overflow: auto;">
          ${
            feedItem.img
              ? html`<aside><img src=${feedItem.img} /></aside>`
              : html``
          }

          <h3 style="margin-top: 0px">${feedItem.title}</h3>
          <p>${new Date(feedItem.createdAt).toLocaleString()}</p>

          <a
            style="margin-right: 8px"
            href=${`/feed-items/show?feedId=${feed.id}&id=${decodeURIComponent(
              feedItem.id,
            )}`}
          >
            More
          </a>
          ${
            feedItem.link
              ? html`
                  <a
                    target="__blank"
                    href=${feedItem.link}
                  >
                    Open ⇗
                  </a>
                `
              : html``
          }
        </section>
      `,
    )}
    ${feedItems.length <= 0 ? html`<p>No items to display</p>` : html``}
  </main>
`;

export default layouts.MainLayout({
  Csss: [
    () => html`
      <style>
        #header-actions button,.button {
          font-size: .8rem;
          font-weight: bold;
          padding: .5rem .7rem;
        }
      </style>
    `,
  ],
  Body: FeedsIndexPage,
  Scripts: [
    () =>
      html`<script type="module">window.scrollTo({ top: 0, left: 0, behavior: "instant" })</script>`,
    () => html`<script src="/deps/htmx.org/dist/htmx.min.js"></script>`,
  ],
});

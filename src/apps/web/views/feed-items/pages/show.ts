import { html, raw } from "hono/html";
import { FeedItemsTable } from "#src/database/types/mod.js";
import { layouts } from "../../common/mod.js";

type FeedItemsShowPageProps = {
  feedItem: FeedItemsTable;
};

const FeedsShowPage = ({ feedItem }: FeedItemsShowPageProps) => html`
  <header>
    <nav>
      <a href="/">Home</a>
    </nav>

    <h1>${feedItem.title}</h1>
  </header>

  <header style="position: sticky; top: 0; padding: 8px 0px; display: flex; justify-content: center; z-index:2">
    <form
      style="margin-right: 4px"
      hx-patch="/feed-items/state"
      hx-trigger=${feedItem.readedAt ? "submit" : "load,submit"}
      hx-on::after-on-load="onOkReadStatePatch(this)"
      hx-swap="none"
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
      hx-patch="/feed-items/state"
      hx-on::after-on-load="onOkBookmarkStatePatch(this)"
      hx-swap="none"
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

    <form
      style="margin-right: 4px"
      hx-get="/feed-items/readability"
      hx-on::after-on-load="onOkReadabilityGet(this)"
      hx-target="#feed-item-content"
    >
      <input type="hidden" name="id" value=${feedItem.id} />
      <input type="hidden" name="feedId" value=${feedItem.feedId} />
      <input type="hidden" name="readability" value="true" />
      <button type="submit">
        Readability ☐
      </button>
    </form>
  </header>

  <main id="feed-item-content">
    ${raw(feedItem.content)}
  </main>
`;

export default layouts.MainLayout({
  Body: FeedsShowPage,
  Scripts: [
    () => html`
      <script type="module">
        const onOkReadStatePatch = (form) => {
          const state = form.querySelector("input[name='state']").value;
          form.querySelector("input[name='state']").value = state === "read" ? "unread" : "read";
          form.querySelector("button[type='submit']").textContent = state === "read" ? "Read ☑" : "Read ☐";
        }

        const onOkBookmarkStatePatch = (form) => {
          const state = form.querySelector("input[name='state']").value;
          form.querySelector("input[name='state']").value = state === "bookmark" ? "unbookmark" : "bookmark";
          form.querySelector("button[type='submit']").textContent = state === "bookmark" ? "Bookmark ☑" : "Bookmark ☐";
        }

        const onOkReadabilityGet = (form) => {
          const state = form.querySelector("input[name='readability']").value;
          form.querySelector("input[name='readability']").value = state === "true" ? "false" : "true";
          form.querySelector("button[type='submit']").textContent = state === "true" ? "Readability ☑" : "Readability ☐";
        }

        window.onOkReadStatePatch = onOkReadStatePatch;
        window.onOkBookmarkStatePatch = onOkBookmarkStatePatch;
        window.onOkReadabilityGet = onOkReadabilityGet;
      </script>
    `,
    () => html`<script src="/deps/htmx.org/dist/htmx.min.js"></script>`,
  ],
});

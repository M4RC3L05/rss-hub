import type { FC } from "@hono/hono/jsx";
import type { FeedItemsTable, FeedsTable } from "#src/database/types/mod.ts";
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

export const FeedItemsIndexPage: FC<FeedItemsIndexPageProps> = ({
  feed,
  feedItems,
  feedItemsPagination,
  filters,
}) => (
  <>
    <header>
      <nav>
        <a href="/">Home</a>
      </nav>

      <h1>{feed.name}</h1>
    </header>

    <header
      id="header-actions"
      style="position: sticky; top: 0; padding: 8px 0px; z-index: 3"
    >
      <form
        style="display: inline; margin-right: 8px"
        action="/feed-items/state"
        method="post"
      >
        <input type="hidden" name="feedId" value={feed.id} />
        <input type="hidden" name="state" value="read" />
        {feedItems.map(
          (feedItem) => (
            <input
              key={feedItem.id}
              type="hidden"
              name="id[]"
              value={feedItem.id}
            />
          ),
        )}
        {feedItems.length <= 0
          ? <input type="hidden" name="id[]" value="" />
          : undefined}
        <button type="submit">
          Read page ✓
        </button>
      </form>

      <form
        style="display: inline; margin-right: 8px"
        action="/feed-items/state"
        method="post"
      >
        <input type="hidden" name="feedId" value={feed.id} />
        <input type="hidden" name="state" value="read" />
        <button type="submit">
          Read all ✓✓
        </button>
      </form>

      <a
        class="button"
        style="margin-right: 8px"
        href={`/feeds/${feed.id}/edit`}
      >
        Edit feed ✏
      </a>

      <dialog id={`dialog-${feed.id}`}>
        <p>Are you sure you want to delete feed "{feed.name}"?</p>

        <form
          style="display: inline;"
          action={`/feeds/${feed.id}/delete`}
          method="post"
        >
          <button type="submit">
            Yes
          </button>
        </form>

        <form method="dialog" style="display: inline; margin-right: 8px">
          <button type="submit">No</button>
        </form>
      </dialog>

      <button
        type="button"
        style="display: inline; margin-right: 8px"
        onclick={`getElementById("dialog-${feed.id}").show()`}
      >
        Delete ⨯?
      </button>

      <br />

      <a
        class="button"
        style="margin-right: 8px"
        href={filters.unreaded.state
          ? filters.unreaded.offLink
          : filters.unreaded.onLink}
      >
        Unreaded {filters.unreaded.state ? "☑" : "☐"}
      </a>
      <a
        class="button"
        href={filters.bookmarked.state
          ? filters.bookmarked.offLink
          : filters.bookmarked.onLink}
      >
        Bookmarked {filters.bookmarked.state ? "☑" : "☐"}
      </a>

      <br />

      <a
        class="button"
        style="margin-right: 8px"
        href={feedItemsPagination.startLink}
      >
        « Start
      </a>
      <a
        class="button"
        style="margin-right: 8px"
        href={feedItemsPagination.previousLink}
      >
        ← Previous
      </a>
      <a
        class="button"
        style="margin-right: 8px"
        href={feedItemsPagination.nextLink}
      >
        Next →
      </a>
      <a class="button" href={feedItemsPagination.endLink}>End »</a>
    </header>

    <main>
      {feedItems.map(
        (feedItem) => (
          <section style="position: relative" class="clearfix">
            {feedItem.img
              ? (
                <>
                  <aside
                    onclick={`getElementById("dialog-feeditem-img-${feedItem.id}").show()`}
                  >
                    <img src={feedItem.img} />
                  </aside>
                  <dialog
                    id={`dialog-feeditem-img-${feedItem.id}`}
                    style="position: absolute; top: 0; z-index: 2; width: 100%"
                  >
                    <form
                      method="dialog"
                      style="display: inline; margin-right: 8px"
                    >
                      <button type="submit">⨯</button>
                    </form>

                    <img src={feedItem.img} style="width: 100%; height: auto" />
                  </dialog>
                </>
              )
              : undefined}

            <h3 style="margin-top: 0px">{feedItem.title}</h3>
            <p>{new Date(feedItem.createdAt).toLocaleString()}</p>

            <form
              style="display: inline; margin-right: 4px"
              action={`/feed-items/state?redirect=${
                encodeBase64Url(
                  `/feed-items/${
                    encodeURIComponent(feedItem.id)
                  }/${feedItem.feedId}`,
                )
              }`}
              method="post"
            >
              <input type="hidden" name="feedId" value={feed.id} />
              <input type="hidden" name="state" value="read" />
              <input type="hidden" name="id[]" value={feedItem.id} />

              <button type="submit">
                More
              </button>
            </form>
            {feedItem.link
              ? (
                <a class="button" target="_blank" href={feedItem.link}>
                  Open ⇗
                </a>
              )
              : undefined}
          </section>
        ),
      )}
      {feedItems.length <= 0 ? <p>No items to display</p> : undefined}
    </main>
  </>
);

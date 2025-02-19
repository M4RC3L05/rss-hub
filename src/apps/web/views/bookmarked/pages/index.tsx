import type { FC } from "@hono/hono/jsx";
import type { FeedItemsTable } from "#src/database/types/mod.ts";

type BookmarkedFeedItemsPageProps = {
  feedItems: FeedItemsTable[];
  feedItemsPagination: {
    previousLink: string;
    startLink: string;
    endLink: string;
    nextLink: string;
  };
};

export const BookmarkedFeedItemsPage: FC<BookmarkedFeedItemsPageProps> = ({
  feedItems,
  feedItemsPagination,
}) => (
  <>
    <header>
      <nav>
        <a href="/">Home</a>
      </nav>

      <h1>Bookmarked</h1>
    </header>

    <header
      id="header-actions"
      style="position: sticky; top: 0; padding: 8px 0px; z-index: 3"
    >
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

            <a
              class="button"
              style="margin-right: 8px"
              href={`/feed-items/${
                encodeURIComponent(feedItem.id)
              }/${feedItem.feedId}`}
            >
              More
            </a>

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

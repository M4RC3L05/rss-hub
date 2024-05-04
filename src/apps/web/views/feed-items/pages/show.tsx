import type { FC } from "hono/jsx";
import type { FeedItemsTable } from "#src/database/types/mod.ts";

type FeedItemsShowPageProps = {
  feedItem: FeedItemsTable;
};

export const FeedItemsShowPage: FC<FeedItemsShowPageProps> = (
  { feedItem },
) => (
  <>
    <header>
      <nav>
        <a href="/">Home</a>
      </nav>

      <h1>{feedItem.title}</h1>
    </header>

    <header
      id="header-actions"
      style="position: sticky; top: 0; padding: 8px 0px; display: flex; justify-content: center; z-index:2"
    >
      <form
        style="margin-right: 4px"
        action="/feed-items/state"
        method="post"
      >
        <input type="hidden" name="id" value={feedItem.id} />
        <input type="hidden" name="feedId" value={feedItem.feedId} />
        <input
          type="hidden"
          name="state"
          value={feedItem.readedAt ? "unread" : "read"}
        />
        <button type="submit">
          Read {feedItem.readedAt ? "☑" : "☐"}
        </button>
      </form>

      <form
        style="margin-right: 4px"
        action="/feed-items/state"
        method="post"
      >
        <input type="hidden" name="id" value={feedItem.id} />
        <input type="hidden" name="feedId" value={feedItem.feedId} />
        <input
          type="hidden"
          name="state"
          value={feedItem.bookmarkedAt ? "unbookmark" : "bookmark"}
        />
        <button type="submit">
          Bookmark {feedItem.bookmarkedAt ? "☑" : "☐"}
        </button>
      </form>

      <a
        style="margin-right: 4px"
        class="button"
        href={`/feed-items/${
          encodeURIComponent(feedItem.id)
        }/${feedItem.feedId}/readability`}
      >
        Readability
      </a>
      {feedItem.link
        ? (
          <a target="_blank" class="button" href={feedItem.link}>
            Open ⇗
          </a>
        )
        : undefined}
    </header>

    <main id="feed-item-content">
      {feedItem.enclosure && JSON.parse(feedItem.enclosure).length > 0
        ? (
          <>
            {JSON.parse(feedItem.enclosure).map(
              (enclosure: { url: string; type?: string }) => {
                if (
                  enclosure.type?.includes("image") ??
                    enclosure.type?.includes("img") ??
                    [".png", ".jpg", ".jpeg", ".gif"].some((end) =>
                      enclosure.url.endsWith(end)
                    )
                ) {
                  return <img src={enclosure.url} />;
                }

                if (enclosure.type?.includes("video")) {
                  return (
                    <video controls>
                      <source src={enclosure.url} type={enclosure.type} />
                    </video>
                  );
                }

                if (enclosure.type?.includes("audio")) {
                  return (
                    <audio controls>
                      <source src={enclosure.url} type={enclosure.type} />
                    </audio>
                  );
                }

                return "";
              },
            )}
            <hr />
          </>
        )
        : undefined}
      <div dangerouslySetInnerHTML={{ __html: feedItem.content }} />
    </main>
  </>
);

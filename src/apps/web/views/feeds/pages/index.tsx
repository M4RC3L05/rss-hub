import type { FC } from "@hono/hono/jsx";
import type { CategoriesTable, FeedsTable } from "#src/database/types/mod.ts";

type FeedsIndexPageProps = {
  categories: CategoriesTable[];
  feeds: (FeedsTable & { unreadCount: number; bookmarkedCount: number })[];
};

export const FeedsIndexPage: FC<FeedsIndexPageProps> = (
  { categories, feeds },
) => (
  <>
    <header>
      <h1>RSS Hub</h1>
      <p>Track and get the latests news</p>
    </header>

    <header
      id="header-actions"
      style="position: sticky; top: 0; z-index: 2; padding: 8px 0px;"
    >
      <a
        href="/categories/create"
        style="display: inline; margin-right: 8px"
        class="button"
      >
        Add category +
      </a>
      <a
        href="/feeds/create"
        style="display: inline; margin-right: 8px"
        class="button"
      >
        Add Feed +
      </a>
      <a
        href="/opml/import"
        style="display: inline; margin-right: 8px"
        class="button"
      >
        Import ↥
      </a>
      <a href="/opml/export" target="_blank" class="button">Export ↧</a>
    </header>

    <main>
      {categories.map(
        (category) => (
          <details>
            <summary>{category.name}</summary>

            {feeds
              .filter((feed) => feed.categoryId === category.id)
              .map(
                (feed) => (
                  <div>
                    <a href={`/feed-items?feedId=${feed.id}&unread=true`}>
                      {feed.name} ({feed.unreadCount} | {feed.bookmarkedCount})
                    </a>
                  </div>
                ),
              )}

            <hr />

            <div class="feed-actions">
              <a
                class="button"
                style="margin-right: 8px"
                href={`/categories/${category.id}/edit`}
              >
                Edit ✏
              </a>

              <dialog id={`dialog-${category.id}`}>
                <p>
                  Are you sure you want to delete category "{category.name}"?
                </p>

                <form
                  style="display: inline; margin-right: 8px"
                  action={`/categories/${category.id}/delete`}
                  method="post"
                >
                  <button type="submit">
                    Yes
                  </button>
                </form>

                <form
                  method="dialog"
                  style="display: inline; margin-right: 8px"
                >
                  <button>No</button>
                </form>
              </dialog>

              <button
                style="display: inline; margin-right: 8px"
                onclick={`getElementById("dialog-${category.id}").show()`}
              >
                Delete ⨯?
              </button>
            </div>
          </details>
        ),
      )}
    </main>
  </>
);

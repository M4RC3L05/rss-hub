import { html } from "hono/html";
import { CategoriesTable, FeedsTable } from "#src/database/types/mod.js";
import { layouts } from "../../common/mod.js";

type FeedsIndexPageProps = {
  categories: CategoriesTable[];
  feeds: (FeedsTable & { unreadCount: number; bookmarkedCount: number })[];
};

const FeedsIndexPage = ({ categories, feeds }: FeedsIndexPageProps) => html`
  <header>
    <h1>RSS Hub</h1>
    <p>Track and get the latests new</p>
  </header>

  <header style="position: sticky; top: 0; z-index: 2; padding: 8px 0px;">
    <a href="/categories/create" class="button">Add category +</a>
    <a href="/feeds/create" class="button">Add Feed +</a>
    <a href="/opml/import" class="button">Import ↥</a>
    <a href="/opml/export" target="__blank" class="button">Export ↧</a>
  </header>

  <main>
    ${categories.map(
      (category) => html`
        <details>
          <summary>${category.name}</summary>

          ${feeds
            .filter((feed) => feed.categoryId === category.id)
            .map(
              (feed) =>
                html`
                  <div>
                    <a href=${`/feed-items?feedId=${feed.id}&unread=true`}>
                      ${feed.name} (${feed.unreadCount} | ${
                        feed.bookmarkedCount
                      })
                    </a>
                  </div>
                `,
            )}

            <hr />

            <div>
              <a class="button" href=${`/categories/edit?id=${category.id}`}>Edit ✏</a>

              <form
                style="display: inline; margin-right: 8px"
                hx-post="/categories/delete"
                hx-on::after-on-load="window.location.reload()"
                hx-swap="none"
              >
                <input type="hidden" name="id" value=${category.id} />
                <button type="submit">
                  Delete ⨯
                </button>
              </form>
            </div>
        </details>
      `,
    )}
  </main>
`;

export default layouts.MainLayout({
  Body: FeedsIndexPage,
  Scripts: [
    () => html`<script src="/deps/htmx.org/dist/htmx.min.js"></script>`,
  ],
});

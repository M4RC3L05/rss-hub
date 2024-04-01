import { html } from "hono/html";
import type { CategoriesTable, FeedsTable } from "#src/database/types/mod.ts";
import { layouts } from "../../common/mod.ts";

type FeedsIndexPageProps = {
  categories: CategoriesTable[];
  feeds: (FeedsTable & { unreadCount: number; bookmarkedCount: number })[];
};

const FeedsIndexPage = ({ categories, feeds }: FeedsIndexPageProps) =>
  html`
  <header>
    <h1>RSS Hub</h1>
    <p>Track and get the latests new</p>
  </header>

  <header id="header-actions" style="position: sticky; top: 0; z-index: 2; padding: 8px 0px;">
    <a href="/categories/create" class="button">Add category +</a>
    <a href="/feeds/create" class="button">Add Feed +</a>
    <a href="/opml/import" class="button">Import ↥</a>
    <a href="/opml/export" target="_blank" class="button">Export ↧</a>
  </header>

  <main>
    ${
    categories.map(
      (category) =>
        html`
        <details>
          <summary>${category.name}</summary>

          ${
          feeds
            .filter((feed) => feed.categoryId === category.id)
            .map(
              (feed) =>
                html`
                  <div>
                    <a href=${`/feed-items?feedId=${feed.id}&unread=true`}>
                      ${feed.name} (${feed.unreadCount} | ${feed.bookmarkedCount})
                    </a>
                  </div>
                `,
            )
        }

            <hr />

            <div class="feed-actions">
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
    )
  }
  </main>
`;

export default layouts.MainLayout({
  Csss: [
    () =>
      html`
      <style>
        #header-actions .button,
        .feed-actions .button,
        .feed-actions button {
          font-size: .8rem;
          font-weight: bold;
          padding: .5rem .7rem;
        }
      </style>
    `,
  ],
  Body: FeedsIndexPage,
  Scripts: [
    () => html`<script src="https://unpkg.com/htmx.org@1.9.11"></script>`,
  ],
});

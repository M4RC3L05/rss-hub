import { html } from "hono/html";
import type { CategoriesTable, FeedsTable } from "#src/database/types/mod.ts";
import { layouts } from "#src/apps/web/views/common/mod.ts";

type FeedsEditPageProps = {
  categories: CategoriesTable[];
  feed: FeedsTable;
};

const FeedsEditPage = ({ categories, feed }: FeedsEditPageProps) =>
  html`
  <header>
    <nav>
      <a href="/">Home</a>
    </nav>

    <h1>Edit feed ${feed.name}</h1>
  </header>

  <main>
    <div id="form-error"></div>

    <form action="/feeds/${feed.id}/edit" method="POST" class="text-align: center">
      <div>
        <label for="name">Feed name</label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Name of the feed"
          value=${feed.name}
        />
      </div>

      <div>
        <label for="url">Feed url</label>
        <input
          type="text"
          id="url"
          name="url"
          placeholder="Feed url"
          value=${feed.url}
          required
          valid
        />
      </div>

      <div>
        <label for="categoryId">Category</label>
        <select name="categoryId" id="categoryId" required>
          ${
    categories.map(
      (category) =>
        html`
              <option
                value=${category.id}
                ${feed.categoryId === category.id ? "selected" : ""}
              >
                ${category.name}
              </option>
            `,
    )
  }
        </select>
      </div>

      <button type="submit">
        Edit
      </button>
    </form>
  </main>
`;

export default layouts.MainLayout({ Body: FeedsEditPage });

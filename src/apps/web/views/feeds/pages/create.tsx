import type { FC } from "@hono/hono/jsx";
import type { CategoriesTable } from "#src/database/types/mod.ts";

type FeedsCreatePageProps = {
  categories: CategoriesTable[];
};

export const FeedsCreatePage: FC<FeedsCreatePageProps> = ({ categories }) => (
  <>
    <header>
      <nav>
        <a href="/">Home</a>
      </nav>

      <h1>Create feed</h1>
    </header>

    <main>
      <div id="form-error"></div>

      <form action="/feeds/create" method="post" class="text-align: center">
        <div>
          <label for="name">Feed name</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Name of the feed"
          />
        </div>

        <div>
          <label for="url">Feed url</label>
          <input
            type="text"
            id="url"
            name="url"
            placeholder="Feed url"
            required
          />
        </div>

        <div>
          <label for="categoryId">Category</label>
          <select name="categoryId" id="categoryId" required>
            {categories.map(
              (category) => (
                <option value={category.id}>
                  {category.name}
                </option>
              ),
            )}
          </select>
        </div>

        <button type="submit">
          Create
        </button>
      </form>
    </main>
  </>
);

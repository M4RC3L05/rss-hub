import type { FC } from "@hono/hono/jsx";
import type { CategoriesTable } from "#src/database/types/mod.ts";

type CategoriesEditPageProps = {
  category: CategoriesTable;
};

export const CategoriesEditPage: FC<CategoriesEditPageProps> = (
  { category },
) => (
  <>
    <header>
      <nav>
        <a href="/">Home</a>
      </nav>

      <h1>Edit category {category.name}</h1>
    </header>

    <main>
      <form
        action={`/categories/${category.id}/edit`}
        method="post"
        class="text-align: center"
      >
        <div>
          <label for="name">Category name</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Name of the category"
            value={category.name}
            required
          />
        </div>

        <button type="submit">
          Edit
        </button>
      </form>
    </main>
  </>
);

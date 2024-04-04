import { html } from "hono/html";
import type { CategoriesTable } from "#src/database/types/mod.ts";
import { layouts } from "#src/apps/web/views/common/mod.ts";

type CategoriesEditPageProps = {
  category: CategoriesTable;
};

const CategoriesEditPage = ({ category }: CategoriesEditPageProps) =>
  html`
  <header>
    <nav>
      <a href="/">Home</a>
    </nav>

    <h1>Edit category ${category.name}</h1>
  </header>

  <main>
    <form action="/categories/${category.id}/edit" method="POST" class="text-align: center">
      <div>
        <label for="name">Category name</label>
        <input type="text" id="name" name="name" placeholder="Name of the category" value=${category.name} required />
      </div>

      <button type="submit">
        Edit
      </button>
    </form>
  </main>
`;

export default layouts.MainLayout({ Body: CategoriesEditPage });

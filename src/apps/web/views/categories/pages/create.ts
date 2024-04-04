import { html } from "hono/html";
import { layouts } from "#src/apps/web/views/common/mod.ts";

const CategoriesCreatePage = () =>
  html`
  <header>
    <nav>
      <a href="/">Home</a>
    </nav>

    <h1>Create category</h1>
  </header>

  <main>
    <form action="/categories/create" method="POST" class="text-align: center">
      <div>
        <label for="name">Category name</label>
        <input type="text" id="name" name="name" placeholder="Name of the category" required />
      </div>

      <button type="submit">
        Create
      </button>
    </form>
  </main>
`;

export default layouts.MainLayout({ Body: CategoriesCreatePage });

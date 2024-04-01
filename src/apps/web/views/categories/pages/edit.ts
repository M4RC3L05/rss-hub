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
    <div id="form-error"></div>
    <form action="/categories/edit" method="POST" class="text-align: center">
      <input type="hidden" name="id" value=${category.id} />

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

export default layouts.MainLayout({
  Body: CategoriesEditPage,
  Scripts: [
    () =>
      html`
      <script type="module">
        const form = document.querySelector("form");
        const nameInput = form.querySelector("input#name");
        const formError = document.querySelector("#form-error")

        let abort;

        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          abort?.abort();
          abort = new AbortController();

          const data = new FormData(form);

          formError.innerHTML = '<p class="notice">Updating category...</p>'

          await fetch(form.action, { signal: abort.signal, method: "post", body: data })
            .then((response) => {
              if (response.status !== 200) {
                throw new Error("Could update category")
              }

              history.back();
            })
            .catch(e => {
              formError.innerHTML = '<p class="notice">Could not update category</p>';
            });
        })
      </script>
    `,
  ],
});

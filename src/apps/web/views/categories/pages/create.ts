import { html } from "hono/html";
import { layouts } from "../../common/mod.js";

const CategoriesCreatePage = () => html`
  <header>
    <nav>
      <a href="/">Home</a>
    </nav>

    <h1>Create category</h1>
  </header>

  <main>
    <div id="form-error"></div>
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

export default layouts.MainLayout({
  Body: CategoriesCreatePage,
  Scripts: [
    () => html`
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

          formError.innerHTML = '<p class="notice">Creating category...</p>'

          await fetch(form.action, { signal: abort.signal, method: "post", body: data })
            .then((response) => {
              if (response.status !== 200) {
                throw new Error("Could create category")
              }

              history.back();
            })
            .catch(e => {
              formError.innerHTML = '<p class="notice">Could not create category</p>';
            });
        })
      </script>
    `,
  ],
});

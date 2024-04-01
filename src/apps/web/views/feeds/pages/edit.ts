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

    <form action="/feeds/edit" method="POST" class="text-align: center">
      <input type="hidden" name="id" value=${feed.id} />
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

export default layouts.MainLayout({
  Body: FeedsEditPage,
  Scripts: [
    ({ feed }: FeedsEditPageProps) =>
      html`
      <script type="module">
        const form = document.querySelector("form");
        const urlInput = form.querySelector("input#url");
        const nameInput = form.querySelector("input#name");
        const formError = document.querySelector("#form-error");

        nameInput.value = "${feed.name}"

        let abort;

        urlInput.addEventListener("input", (e) => {
          if (e.target.value !== "${feed.url}") {
            urlInput.removeAttribute("valid")
          } else {
            urlInput.setAttribute("valid", "undefined")
          }
        })

        form.addEventListener("submit", async (e) => {
          e.preventDefault();

          abort?.abort();
          abort = new AbortController();
          const data = new FormData(form);

          if (urlInput.hasAttribute("valid")) {
            if (data.get("name") === "${feed.name}") data.delete("name")
            if (data.get("url") === "${feed.url}") data.delete("url")
            if (data.get("categoryId") === "${feed.categoryId}") data.delete("categoryId")

            if (Array.from(data.entries()).length <= 1) {
              return history.back();
            }

            formError.innerHTML = '<p class="notice">Updating feed...</p>'

            return await fetch(form.action, { signal: abort.signal, method: "post", body: data })
              .then((response) => {
                if (response.status !== 200) {
                  throw new Error("Could not update feed")
                }

                history.back();
              })
              .catch(e => {
                formError.innerHTML = '<p class="notice">Could not update feed</p>';
              });
          }

          formError.innerHTML = '<p class="notice">Validating feed url...</p>'

          await fetch("/feeds/verify-url?url=" + data.get("url"), { signal: abort.signal })
            .then((response) => {
              if (response.status !== 200) {
                throw new Error("Feed url is not valid")
              }

              return response.text()
            })
            .then((title) => {
              nameInput.value = title;
              formError.innerHTML = '<p class="notice">Feed url is valid</p>';
              urlInput.setAttribute("valid", null);
            })
            .catch(e => {
              formError.innerHTML = '<p class="notice">Feed url is not valid or already exists</p>';
            });
        })
      </script>
    `,
  ],
});

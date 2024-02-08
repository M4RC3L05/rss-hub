import { html } from "hono/html";
import { CategoriesTable, FeedsTable } from "#src/database/types/mod.js";
import { layouts } from "../../common/mod.js";

type FeedsEditPageProps = {
  categories: CategoriesTable[];
  feed: FeedsTable;
};

const FeedsEditPage = ({ categories, feed }: FeedsEditPageProps) => html`
  <header>
    <nav>
      <a href="/">Home</a>
    </nav>

    <h1>Edit feed ${feed.name}</h1>
  </header>

  <main>
    <div id="form-error"></div>

    <form action="/feeds/edit" method="post" class="text-align: center">
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
        />
      </div>

      <div>
        <label for="categoryId">Category</label>
        <select name="categoryId" id="categoryId" required>
          ${categories.map(
            (category) => html`
              <option
                value=${category.id}
                ${feed.categoryId === category.id ? "selected" : ""}
              >
                ${category.name}
              </option>
            `,
          )}
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
    () => html`
      <script type="module">
        const form = document.querySelector("form");
        const urlInput = form.querySelector("input#url");
        const nameInput = form.querySelector("input#name");
        const formError = document.querySelector("#form-error")

        let abort;

        form.addEventListener("submit", async (e) => {
          e.preventDefault();

          abort?.abort();
          abort = new AbortController();
          const data = new FormData(form);

          if (urlInput.hasAttribute("valid")) {
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

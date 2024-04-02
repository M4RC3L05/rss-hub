import { html } from "hono/html";
import { layouts } from "#src/apps/web/views/common/mod.ts";

const OpmlImportPage = () =>
  html`
  <header>
    <nav>
      <a href="/">Home</a>
    </nav>

    <h1>Import</h1>
  </header>

  <main>
    <div id="form-error"></div>

    <form action="/opml/import" method="POST" class="text-align: center">
      <div>
        <label for="file">Opml file</label>
        <input type="file" id="file" name="file" placeholder="Opml file" required />
      </div>

      <button type="submit">
        Import
      </button>
    </form>
  </main>
`;

export default layouts.MainLayout({
  Body: OpmlImportPage,
  Scripts: [
    () =>
      html`
      <script type="module">
        const form = document.querySelector("form");
        const formError = document.querySelector("#form-error")

        let abort;

        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          abort?.abort();
          abort = new AbortController();

          const data = new FormData(form);

          formError.innerHTML = '<p class="notice">Importing...</p>'

          await fetch(form.action, { signal: abort.signal, method: "post", body: data })
            .then((response) => {
              if (response.status !== 200) {
                throw new Error("Could not import")
              }

              history.back();
            })
            .catch(e => {
              formError.innerHTML = '<p class="notice">Could not import</p>';
            });
        })
      </script>
    `,
  ],
});

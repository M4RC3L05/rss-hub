import type { FC } from "hono/jsx";

export const OpmlImportPage: FC = () => (
  <>
    <header>
      <nav>
        <a href="/">Home</a>
      </nav>

      <h1>Import</h1>
    </header>

    <main>
      <div id="form-error"></div>

      <form
        action="/opml/import"
        method="post"
        class="text-align: center"
        enctype="multipart/form-data"
      >
        <div>
          <label for="file">Opml file</label>
          <input
            type="file"
            id="file"
            name="file"
            placeholder="Opml file"
            required
          />
        </div>

        <button type="submit">
          Import
        </button>
      </form>
    </main>
  </>
);

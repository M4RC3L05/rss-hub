import type { FC } from "hono/jsx";

export const CategoriesCreatePage: FC = () => (
  <>
    <header>
      <nav>
        <a href="/">Home</a>
      </nav>

      <h1>Create category</h1>
    </header>

    <main>
      <form
        action="/categories/create"
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
            required
          />
        </div>

        <button type="submit">
          Create
        </button>
      </form>
    </main>
  </>
);

import type { FC } from "@hono/hono/jsx";

type FeedLinksPageProps = {
  links?: string[];
  url?: string;
};

export const FeedLinksPage: FC<FeedLinksPageProps> = ({ links, url }) => (
  <>
    <header>
      <nav>
        <a href="/">Home</a>
      </nav>

      <h1>Search feed links</h1>
    </header>

    <main>
      {Array.isArray(links) && url
        ? (
          <>
            {links.length <= 0 ? <p>No links found for "{url}"</p> : (
              <>
                <h3>Links found for "{url}"</h3>
                {links.map((link) => <p key={link}>{link}</p>)}
              </>
            )}
          </>
        )
        : (
          <>
            <form
              action="/feeds/feed-links"
              method="get"
              class="text-align: center"
            >
              <div>
                <input
                  type="text"
                  id="url"
                  name="url"
                  placeholder="Url to search links for"
                  required
                />
              </div>

              <button type="submit">
                Search
              </button>
            </form>
          </>
        )}
    </main>
  </>
);

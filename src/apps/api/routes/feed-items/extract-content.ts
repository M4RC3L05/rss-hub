import { Readability } from "@mozilla/readability";
import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import { DOMParser, type Element } from "@b-fuze/deno-dom/native";
import vine from "@vinejs/vine";
import type { FeedItemsTable } from "#src/database/types/mod.ts";

const requestParamsSchema = vine.object({
  id: vine.string(),
  feedId: vine.string().uuid(),
});
const requestParametersValidator = vine.compile(requestParamsSchema);

export const extractContent = (router: Hono) => {
  router.get(
    "/:id/:feedId/extract-content",
    async (c) => {
      const data = await requestParametersValidator.validate(c.req.param());
      const [feedItem] = c.get("database").sql<
        Pick<FeedItemsTable, "id" | "link">
      >`
        select id, link
        from feed_items
        where id = ${data.id}
        and   feed_id = ${data.feedId}
      `;

      if (!feedItem) {
        throw new HTTPException(404, { message: "Feed item not found" });
      }

      if (!feedItem.link) {
        return c.json({ data: "" });
      }

      const pageContentResponse = await fetch(feedItem.link, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.3",
        },
        signal: AbortSignal.any([
          c.req.raw.signal,
          c.get("shutdown"),
          AbortSignal.timeout(10_000),
        ]),
      }).catch((error) => {
        throw new HTTPException(400, {
          message: `Could not fetch "${feedItem.link}"`,
          cause: error,
        });
      });

      if (!pageContentResponse.ok) {
        throw new HTTPException(400, {
          message: `Request to "${feedItem.link}" failed`,
          cause: pageContentResponse,
        });
      }

      const url = new URL(feedItem.link);
      const pageContent = await pageContentResponse.text();

      const dom = new DOMParser().parseFromString(pageContent, "text/html");

      // deno-lint-ignore no-explicit-any
      for (const element of dom.querySelectorAll("a") as any as Element[]) {
        const href = ((element as Element).getAttribute("href") ?? "").trim();

        if (!href.startsWith("#")) {
          (element as Element).setAttribute("target", "_blank");
        }
      }

      for (
        const eleWithExternalResources of dom.querySelectorAll(
          "[src], [href], [srcset]",
          // deno-lint-ignore no-explicit-any
        ) as any as Element[]
      ) {
        const href = (eleWithExternalResources.getAttribute("href") ?? "")
          .trim();
        const src = (eleWithExternalResources.getAttribute("src") ?? "")
          .trim();
        const srcset = (eleWithExternalResources.getAttribute("srcset") ?? "")
          .trim();

        if (href.startsWith("/") || href.startsWith(".")) {
          eleWithExternalResources.setAttribute(
            "href",
            new URL(href, url).toString(),
          );
        }

        if (src.startsWith("/") || src.startsWith(".")) {
          eleWithExternalResources.setAttribute(
            "src",
            new URL(src, url).toString(),
          );
        }

        if (srcset.startsWith("/") || srcset.startsWith(".")) {
          eleWithExternalResources.setAttribute(
            "srcset",
            new URL(srcset, url).toString(),
          );
        }
      }

      const parsed = new Readability(dom).parse();

      return c.json({ data: parsed?.content ?? "" });
    },
  );
};

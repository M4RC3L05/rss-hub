import { sql } from "@m4rc3l05/sqlite-tag";
import { Readability } from "@mozilla/readability";
import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import { DOMParser, type Element } from "@b-fuze/deno-dom/native";
import vine from "@vinejs/vine";
import { makeLogger } from "#src/common/logger/mod.ts";
import type { FeedItemsTable } from "#src/database/types/mod.ts";
import { Requester } from "@m4rc3l05/requester";
import * as requesterComposers from "@m4rc3l05/requester/composers";

const requestParamsSchema = vine.object({
  id: vine.string(),
  feedId: vine.string(),
});
const requestParametersValidator = vine.compile(requestParamsSchema);

const log = makeLogger("extract-feed-item-contents");
const requester = new Requester().with(
  requesterComposers.timeout({ ms: 10_000 }),
);

export const extractContent = (router: Hono) => {
  router.get(
    "/:id/:feedId/extract-content",
    async (c) => {
      const data = await requestParametersValidator.validate(c.req.param());
      const result = c.get("database").get<FeedItemsTable>(
        sql`
          select *
          from feed_items
          where id = ${data.id}
          and   feed_id = ${data.feedId}
        `,
      );

      if (!result || !result?.link) {
        return c.json({ data: "" }, 200);
      }

      try {
        const pageContent = await requester.fetch(result?.link, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.3",
          },
          signal: c.req.raw.signal,
        }).then((response) => response.text());

        const url = new URL(result?.link);

        const dom = new DOMParser().parseFromString(pageContent, "text/html");

        if (!dom) {
          throw new Error(`Could not parse page from "${result?.link}"`);
        }

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

          if (href.startsWith("/")) {
            eleWithExternalResources.setAttribute(
              "href",
              new URL(href, url.origin).toString(),
            );
          }

          if (src.startsWith("/")) {
            eleWithExternalResources.setAttribute(
              "src",
              new URL(src, url.origin).toString(),
            );
          }

          if (srcset.startsWith("/")) {
            eleWithExternalResources.setAttribute(
              "srcset",
              new URL(srcset, url.origin).toString(),
            );
          }
        }

        const parsed = new Readability(dom).parse();

        return c.json({ data: parsed?.content ?? "" }, 200);
      } catch (error) {
        log.error("Unable to extract feed item content", { error });

        if (!result || !result?.link) {
          throw new HTTPException(400, {
            message: "Could not extract feed item content",
          });
        }
      }
    },
  );
};

import { sql } from "@m4rc3l05/sqlite-tag";
import { Readability } from "@mozilla/readability";
import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { JSDOM } from "jsdom";
import vine from "@vinejs/vine";
import { makeLogger } from "#src/common/logger/mod.ts";
import type { FeedItemsTable } from "#src/database/types/mod.ts";

const requestParamsSchema = vine.object({
  id: vine.string(),
  feedId: vine.string(),
});
const requestParametersValidator = vine.compile(requestParamsSchema);

const log = makeLogger("extract-feed-item-contents");

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
        const pageContent = await fetch(result?.link, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.3",
          },
          signal: AbortSignal.any([
            AbortSignal.timeout(10_000),
            c.req.raw.signal,
          ]),
        }).then((response) => response.text());

        const url = new URL(result?.link);

        const dom = new JSDOM(pageContent);

        for (const element of dom.window.document.querySelectorAll("a")) {
          const href = (element.getAttribute("href") ?? "").trim();

          if (!href.startsWith("#")) {
            element.setAttribute("target", "_blank");
          }
        }

        for (
          const eleWithExternalResources of dom.window.document
            .querySelectorAll("[src], [href], [srcset]")
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

        const parsed = new Readability(dom.window.document).parse();

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

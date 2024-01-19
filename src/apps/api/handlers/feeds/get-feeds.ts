import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import { type Hono } from "hono";
import { groupBy } from "lodash-es";
import { z } from "zod";
import { type FeedsTable } from "#src/database/types/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestQuerySchema = z
  .object({
    categoryId: z.union([
      z.string().uuid(),
      z.array(z.string().uuid()).optional(),
    ]),
  })
  .strict();

export const handler = (router: Hono) => {
  router.get(
    "/api/feeds",
    zValidator("query", requestQuerySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { query: result.error } });
    }),
    (c) => {
      const query = c.req.valid("query");
      const feeds = c.get("database").all<FeedsTable>(sql`
        select
          f.*,
          count(case when fi.readed_at is null then 1 end) as unread_count,
          count(case when fi.bookmarked_at is not null then 1 end) as bookmarked_count
        from feeds f
        left join feed_items fi on f.id = fi.feed_id
        $${
          query.categoryId
            ? sql`where f.category_id in ($${(Array.isArray(query.categoryId)
                ? query.categoryId
                : [query.categoryId]
              ).reduce(
                (acc, cid, index) =>
                  sql`$${acc}$${index <= 0 ? sql`` : sql`,`}${cid}`,
                sql``,
              )})`
            : sql``
        }
        group by f.id
        order by f.name collate nocase asc
      `);

      return c.json({ data: groupBy(feeds, "categoryId") });
    },
  );
};

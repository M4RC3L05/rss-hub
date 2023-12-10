import sql from "@leafac/sqlite";
import { groupBy } from "lodash-es";
import { type Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { type FeedsTable } from "../../../../database/types/mod.js";
import { RequestValidationError } from "../../../../errors/mod.js";

const requestQuerySchema = z.object({ categoryId: z.array(z.string().uuid()).optional() }).strict();

export const handler = (router: Hono) => {
  router.get(
    "/api/feeds",
    zValidator("queries", requestQuerySchema, (result) => {
      if (!result.success) throw new RequestValidationError({ request: { query: result.error } });
    }),
    (c) => {
      const query = c.req.valid("queries");
      const feeds = c.get("database").all<FeedsTable>(sql`
        select f.*, count(fi.id) as "unreadCount"
        from feeds f
        left join feed_items fi on f.id = fi.feed_id and fi.readed_at is null
        $${
          query.categoryId
            ? // eslint-disable-next-line unicorn/no-array-reduce
              sql`where f.category_id in ($${query.categoryId.reduce(
                (acc, cid, index) => sql`$${acc}$${index <= 0 ? sql`` : sql`,`}${cid}`,
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

import type { Hono } from "hono";
import { handler } from "#src/apps/web/handlers/mod.ts";

export const router = (app: Hono) => {
  handler(app);
};

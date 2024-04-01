import type { Hono } from "hono";
import { handler } from "./handlers/mod.ts";

export const router = (app: Hono) => {
  handler(app);
};

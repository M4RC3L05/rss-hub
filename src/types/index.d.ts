import { type CustomDatabase } from "../database/mod.ts";

declare module "hono" {
  interface ContextVariableMap {
    database: CustomDatabase;
  }
}

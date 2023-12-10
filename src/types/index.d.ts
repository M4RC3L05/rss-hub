import { type CustomDatabase } from "../database/mod.ts";

declare module "hono" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ContextVariableMap {
    database: CustomDatabase;
  }
}

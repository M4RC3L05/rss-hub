import { randomUUID } from "node:crypto";
import sql, { Database, type Options, type Query } from "@leafac/sqlite";
import { camelCase, isObject, mapKeys } from "lodash-es";
import config from "config";
import { makeLogger } from "../common/logger/mod.js";

const log = makeLogger("database");

const toCamelCase = <T>(data: unknown) => {
  if (Array.isArray(data))
    return data.map((item) => mapKeys(item, (_, key) => camelCase(key))) as T;

  if (isObject(data)) return mapKeys(data, (_, key) => camelCase(key)) as T;

  return data as T;
};

export class CustomDatabase extends Database {
  override get<T>(query: Query, options: Options = {}): T | undefined {
    if (!this.open) return;

    return toCamelCase<T>(super.get<T>(query, options));
  }

  override all<T>(query: Query, options: Options = {}): T[] {
    if (!this.open) return [];

    return toCamelCase<T[]>(super.all<T>(query, options));
  }
}

export const makeDatabase = () =>
  new CustomDatabase(config.get("database.path"), {
    verbose(message, ...args) {
      log.debug({ sql: message, args }, "Running sql");
    },
  })
    .execute(sql`pragma journal_mode = WAL`)
    .execute(sql`pragma busy_timeout = 5000`)
    .execute(sql`pragma foreign_keys = ON`)
    .function("uuid_v4", () => randomUUID());

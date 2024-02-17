import { randomUUID } from "node:crypto";
import { type TSqlFragment, sql } from "@m4rc3l05/sqlite-tag";
import Database, { type Statement } from "better-sqlite3";
import config from "config";
import { camelCase, isObject, mapKeys } from "lodash-es";
import { makeLogger } from "../common/logger/mod.js";

const log = makeLogger("database");

const toCamelCase = <T>(data: unknown) => {
  if (Array.isArray(data))
    return data.map((item) => mapKeys(item, (_, key) => camelCase(key))) as T;

  if (isObject(data)) return mapKeys(data, (_, key) => camelCase(key)) as T;

  return data as T;
};

export class CustomDatabase extends Database {
  #cache = new Map<string, Statement>();

  #ensureInCache(query: string) {
    const key = query.trim();

    if (!this.#cache.has(key)) {
      this.#cache.set(key, this.prepare(key));
    }

    return this.#cache.get(key) as Statement;
  }

  get<T>(query: TSqlFragment): T | undefined {
    const prepared = this.#ensureInCache(query.query);

    return toCamelCase<T>(prepared.get(query.params));
  }

  all<T>(query: TSqlFragment): T[] {
    const prepared = this.#ensureInCache(query.query);

    return toCamelCase<T[]>(prepared.all(query.params));
  }

  execute(query: TSqlFragment) {
    return this.exec(query.query);
  }

  run(query: TSqlFragment) {
    const prepared = this.#ensureInCache(query.query);

    return prepared.run(query.params);
  }

  iterate<T>(query: TSqlFragment): IterableIterator<T> {
    const prepared = this.#ensureInCache(query.query);

    return prepared.iterate(query.params) as IterableIterator<T>;
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

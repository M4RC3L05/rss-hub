import sql, { Database, type Options, type Query } from "@leafac/sqlite";
import { camelCase, isObject, mapKeys } from "lodash-es";

type MakeDbClientDeps = {
  path: string;
  randomUuid: () => string;
};

const toCamelCase = <T>(data: unknown) => {
  if (Array.isArray(data))
    return data.map((item) => mapKeys(item, (_, key) => camelCase(key))) as T;

  if (isObject(data)) return mapKeys(data, (_, key) => camelCase(key)) as T;

  return data as T;
};

class CustomDatabase extends Database {
  override get<T>(query: Query, options: Options = {}): T | undefined {
    return toCamelCase<T>(super.get<T>(query, options));
  }

  override all<T>(query: Query, options: Options = {}): T[] {
    return toCamelCase<T[]>(super.all<T>(query, options));
  }
}

const makeDbClient = (deps: MakeDbClientDeps) => {
  return new CustomDatabase(deps.path)
    .execute(sql`pragma journal_mode = WAL`)
    .execute(sql`pragma busy_timeout = 5000`)
    .execute(sql`pragma foreign_keys = ON`)
    .function("uuid_v4", () => deps.randomUuid());
};

export default makeDbClient;

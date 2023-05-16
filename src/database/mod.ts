import { Kysely, SqliteDialect, CamelCasePlugin } from "kysely";
import { type DB } from "kysely-codegen";
import sqlite from "better-sqlite3";

type MakeDbClientDeps = {
  path: string;
  randomUuid: () => string;
};

const makeDbClient = (deps: MakeDbClientDeps) => {
  const client = new Kysely<DB>({
    plugins: [new CamelCasePlugin()],
    dialect: new SqliteDialect({
      async database() {
        const c = sqlite(deps.path);

        c.pragma("journal_mode = WAL");
        c.pragma("foreign_keys = ON");
        c.pragma("busy_timeout = 5000");

        c.function("uuid_v4", () => deps.randomUuid());

        return c;
      },
    }),
  });

  return client;
};

export default makeDbClient;

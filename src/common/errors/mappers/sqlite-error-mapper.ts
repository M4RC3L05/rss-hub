import createHttpError from "http-errors";
import { SqliteError } from "better-sqlite3";

const sqliteErrorMapper = (error: unknown) => {
  if (!(error instanceof SqliteError)) return;

  switch (error.code) {
    case "SQLITE_CONSTRAINT_UNIQUE": {
      return createHttpError(409, "Entity already exists");
    }

    default:
  }
};

export default sqliteErrorMapper;

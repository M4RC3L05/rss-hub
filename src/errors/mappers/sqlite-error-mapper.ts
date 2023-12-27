import { HTTPException } from "hono/http-exception";

const sqliteErrorMapper = (error: unknown) => {
  if ((error as Record<string, unknown>)?.name !== "SqliteError") return;

  switch ((error as Record<string, unknown>).code) {
    case "SQLITE_CONSTRAINT_UNIQUE": {
      return Object.assign(
        new HTTPException(409, { message: "Entity already exists" }),
        {
          cause: error,
        },
      );
    }

    default:
  }
};

export default sqliteErrorMapper;

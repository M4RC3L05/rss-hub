import { type IncomingMessage, type ServerResponse } from "node:http";
import { type HttpError, isHttpError } from "http-errors";
import { type ErrorHandler } from "@m4rc3l05/sss";
import { camelCase } from "lodash-es";
import { makeLogger } from "../common/logger/mod.js";

type ErrorMapperDeps = {
  mappers: Array<(error: unknown) => HttpError | undefined>;
  defaultMapper: (error: unknown) => HttpError;
};

const log = makeLogger("error-mapper-middleware");

const respond = (error: HttpError, _: IncomingMessage, response: ServerResponse) => {
  response.statusCode = error.statusCode;

  if (error.headers) {
    for (const [key, value] of Object.entries(error.headers)) {
      response.setHeader(key, value);
    }
  }

  response.end(
    JSON.stringify({
      error: {
        code: camelCase(error.name),
        message: error.message,
      },
    }),
  );
};

const errorMapper = (deps: ErrorMapperDeps): ErrorHandler => {
  return (error, request, response) => {
    log.error(
      !(error instanceof Error) && !(typeof error === "object") ? { error } : error,
      "Caught request error",
    );

    if (isHttpError(error)) {
      respond(error, request, response);

      return;
    }

    let mapped: HttpError | undefined;

    for (const mapper of deps.mappers) {
      mapped = mapper(error);

      if (mapped) break;
    }

    if (!mapped) {
      mapped = deps.defaultMapper(error);
    }

    respond(mapped, request, response);
  };
};

export default errorMapper;

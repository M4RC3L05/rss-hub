import config from "config";
import { HTTPException } from "hono/http-exception";
import type { Response } from "node-fetch";
import { request } from "#src/common/utils/fetch-utils.js";

type ApiResponse<D> = {
  data: D;
  pagination: {
    previous: number;
    next: number;
    total: number;
    limit: number;
  };
};

const { url, basicAuth } = config.get<{
  url: string;
  basicAuth: { name: string; pass: string };
}>("apps.web.services.api");

export const serviceRequester = <R>(
  path: string,
  init?: Parameters<typeof request>[1],
): Promise<
  R extends undefined ? undefined : R extends Response ? R : ApiResponse<R>
> =>
  request(
    `${url}${path}`,
    {
      ...(init ?? {}),
      headers: {
        authorization: `Basic ${Buffer.from(
          `${basicAuth.name}:${basicAuth.pass}`,
        ).toString("base64")}`,
        ...(init?.headers ?? {}),
      },
    },
    { maxRetries: 0 },
  ).then((response) => {
    if (response.status === 204) return;

    if (response.headers.get("content-type")?.includes("application/json")) {
      return response.json().then((data) => {
        if (response.status >= 400) {
          throw new HTTPException(response.status, {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            message: (data as any).error.message ?? "Something went wrong",
          });
        }

        return data;
      });
    }

    if (response.status >= 400) {
      throw new HTTPException(response.status, {
        message: "Something went wrong",
      });
    }

    return response;
  }) as Promise<
    R extends undefined ? undefined : R extends Response ? R : ApiResponse<R>
  >;

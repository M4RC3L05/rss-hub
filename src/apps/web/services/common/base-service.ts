import { deepMerge } from "@std/collections";
import { encodeBase64 } from "@std/encoding/base64";

export abstract class BaseService {
  #baseUrl: string;
  #auth: { username: string; password: string };

  constructor(baseUrl: string, auth: { username: string; password: string }) {
    this.#baseUrl = baseUrl;
    this.#auth = auth;
  }

  request(
    { path, init, sendResponse }: {
      path: string;
      init?: Parameters<typeof fetch>[1];
      sendResponse?: boolean;
    },
  ) {
    return fetch(
      `${this.#baseUrl}${path}`,
      // deno-lint-ignore no-explicit-any
      deepMerge((init ?? {}) as any, {
        headers: {
          "authorization": `Basic ${
            encodeBase64(`${this.#auth.username}:${this.#auth.password}`)
          }`,
        },
        // deno-lint-ignore ban-ts-comment
        // @ts-ignore
        // see: https://github.com/denoland/deno/issues/27150
        signal: init?.signal
          // deno-lint-ignore ban-ts-comment
          // @ts-ignore
          // see: https://github.com/denoland/deno/issues/27150
          ? AbortSignal.any([init.signal, AbortSignal.timeout(10_000)])
          : AbortSignal.timeout(10_000),
      }),
    ).then((response) => {
      if (sendResponse) return response;
      if (response.status === 204) return;

      if (!response.headers.get("content-type")?.includes("application/json")) {
        if (!response.ok) {
          throw new Error("Request not ok", { cause: response });
        }

        return;
      }

      return response.json();
    }).then((data) => {
      if (sendResponse) return data;
      if (!data) return;

      if (data.error) throw new Error("Bad request", { cause: data.error });

      return data;
    }).catch((error) => {
      throw new Error("Request error", { cause: error });
    });
  }
}

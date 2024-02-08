import { setTimeout } from "node:timers/promises";
import fetch, { type Response } from "node-fetch";
import { makeLogger } from "../logger/mod.js";

const log = makeLogger("fetch-utils");

export const request = async (
  url: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1],
  options: { retryN: number },
): Promise<Response> => {
  try {
    const result = await Promise.race([
      setTimeout(8000, new Error(`Request timeout exceeded for "${url}"`), {
        ref: false,
      }),
      fetch(url, init),
    ]);

    if (result instanceof Error) {
      throw result;
    }

    return result;
  } catch (error: unknown) {
    if ((error as { name: string })?.name === "AbortError") {
      throw error;
    }

    if (options.retryN <= 3) {
      log.error(error, "Could not fetch, proceed to retry");
      log.info(`Retry Nº ${options.retryN}, retrying in 2 seconds`);

      await setTimeout(2000, undefined, {
        signal: init?.signal as AbortSignal,
      });

      return request(url, init, { ...options, retryN: options.retryN + 1 });
    }

    throw new Error("Retries exhausted", { cause: error });
  }
};

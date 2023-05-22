/* eslint-disable no-await-in-loop */
import { setTimeout } from "node:timers/promises";
import * as cronMatch from "@datasert/cronjs-matcher";
import { type CronExprs, parse } from "@datasert/cronjs-parser";

export class Cron {
  #when: Date | CronExprs;
  #abortController: AbortController;
  #working: boolean;
  #worker!: AsyncGenerator<AbortSignal, void>;
  #lastProcessAt?: number;
  #timezone?: string;

  constructor(when: Date | string, timezone?: string) {
    this.#when = typeof when === "string" ? parse(when, { hasSeconds: true }) : when;
    this.#working = false;

    this.#abortController = new AbortController();
    this.#timezone = timezone;
  }

  start() {
    if (this.#working) return this.#worker;

    this.#working = true;
    this.#worker = this.#work();

    return this.#worker;
  }

  async stop() {
    this.#abortController.abort();

    await this.#worker.return();

    this.#working = false;
  }

  nextTime() {
    return this.#when instanceof Date
      ? this.#when
      : new Date(
          cronMatch
            .getFutureMatches(this.#when, {
              hasSeconds: true,
              timezone: this.#timezone,
              matchValidator: (date) =>
                Math.floor(this.#lastProcessAt ?? Date.now() / 1000) !==
                Math.floor(new Date(date).getTime() / 1000),
            })
            .at(0)!,
        );
  }

  #checkTime(at: number | string) {
    if (this.#when instanceof Date) {
      return Math.floor(Date.now() / 1000) === Math.floor(this.#when.getTime() / 1000);
    }

    return cronMatch.isTimeMatches(this.#when, new Date(at).toISOString(), this.#timezone);
  }

  async *#ticker() {
    while (true) {
      try {
        await setTimeout(16, undefined, {
          signal: this.#abortController.signal,
        });

        yield Date.now();
      } catch {
        return;
      }
    }
  }

  async *#work() {
    for await (const at of this.#ticker()) {
      if (
        this.#checkTime(at) &&
        (!this.#lastProcessAt || Math.floor(at / 1000) !== Math.floor(this.#lastProcessAt / 1000))
      ) {
        this.#lastProcessAt = at;

        yield this.#abortController.signal;
      }

      if (this.#abortController.signal.aborted) {
        return;
      }
    }
  }
}

import { pino } from "pino";

export const makeLogger = (namespace: string) =>
  pino({
    name: namespace,
    formatters: { level: (level) => ({ level }) },
    enabled: true,
  });

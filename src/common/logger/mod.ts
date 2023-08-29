import { pino } from "pino";

const makeLogger = (namespace: string) =>
  pino({ name: namespace, formatters: { level: (level) => ({ level }) } });

export default makeLogger;

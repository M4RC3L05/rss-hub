import { pino } from "pino";

const makeLogger = (namespace: string) => pino({ name: namespace });

export default makeLogger;

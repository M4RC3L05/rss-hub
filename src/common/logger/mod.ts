import { pino } from "pino";

export const destination = pino.destination({ sync: false });
export const logger = pino(destination);

const makeLogger = (namespace: string) => logger.child({ name: namespace });

export default makeLogger;

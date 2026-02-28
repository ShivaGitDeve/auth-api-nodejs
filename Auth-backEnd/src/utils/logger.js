import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "src/logs/error.log", level: "error" }),
    new transports.File({ filename: "src/logs/combined.log" }),
  ],
});

export default logger;

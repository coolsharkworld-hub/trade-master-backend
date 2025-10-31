import winston from 'winston';

const { combine, colorize, timestamp, json, simple, printf } = winston.format;

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL,
  levels,
  format: combine(
    colorize({ all: true }),
    simple(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json(),
    printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level} ${message}`;
    }),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/all.log' }),
  ],
});

logger.on('error', (error) => {
  console.error(error.message);
});

export default logger;

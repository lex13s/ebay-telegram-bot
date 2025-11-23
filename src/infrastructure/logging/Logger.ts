import winston from 'winston';
import { EnvConfig } from '../config/EnvConfig';

export interface ILogger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
}

export function createLogger(env: EnvConfig): ILogger {
  const isDevelopment = env.NODE_ENV === 'development';
  const isTest = env.NODE_ENV === 'test';

  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  );

  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let metaStr = '';
      if (Object.keys(meta).length > 0) {
        metaStr = ` ${JSON.stringify(meta)}`;
      }
      return `[${timestamp}] [${level}]: ${message}${metaStr}`;
    })
  );

  const transports: winston.transport[] = [];

  // Console transport
  if (!isTest) {
    transports.push(
      new winston.transports.Console({
        format: isDevelopment ? consoleFormat : logFormat,
        level: isDevelopment ? 'debug' : 'info',
      })
    );
  }

  // File transports for production
  if (!isDevelopment && !isTest) {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
      })
    );
  }

  const winstonLogger = winston.createLogger({
    level: isDevelopment ? 'debug' : 'info',
    format: logFormat,
    transports,
    exitOnError: false,
  });

  // Wrapper to match ILogger interface
  return {
    debug: (message: string, meta?: any) => {
      winstonLogger.debug(message, meta);
    },
    info: (message: string, meta?: any) => {
      winstonLogger.info(message, meta);
    },
    warn: (message: string, meta?: any) => {
      winstonLogger.warn(message, meta);
    },
    error: (message: string, error?: Error, meta?: any) => {
      winstonLogger.error(message, { error: error?.stack || error, ...meta });
    },
  };
}


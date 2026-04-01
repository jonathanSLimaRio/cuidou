type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function formatMessage(level: LogLevel, message: string, context?: LogContext) {
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    });
  }

  const prefix = `[${level.toUpperCase()}]`;
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `${prefix} ${message}${contextStr}`;
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatMessage("debug", message, context));
    }
  },

  info(message: string, context?: LogContext) {
    console.info(formatMessage("info", message, context));
  },

  warn(message: string, context?: LogContext) {
    console.warn(formatMessage("warn", message, context));
  },

  error(message: string, error?: unknown, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
      ...(error instanceof Error
        ? { errorMessage: error.message, errorName: error.name, stack: error.stack }
        : error !== undefined
          ? { errorRaw: String(error) }
          : {}),
    };
    console.error(formatMessage("error", message, errorContext));
  },
};

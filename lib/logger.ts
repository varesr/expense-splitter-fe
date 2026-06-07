/**
 * Minimal server-side logger.
 *
 * Level is resolved from `LOG_LEVEL`, or derived from `APP_ENV`
 * (`homelab` → `info`, otherwise `debug`). Calls below the active level are
 * suppressed. Output goes to stdout/stderr via `console`; in homelab the
 * backend owns rolling log files, so the frontend logs to stdout only.
 *
 * Server-side only: `APP_ENV` / `LOG_LEVEL` are runtime server env vars (no
 * `NEXT_PUBLIC_` prefix), so this must not be imported into client components.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLevel(): LogLevel {
  const explicit = process.env.LOG_LEVEL?.trim().toLowerCase();
  if (explicit && explicit in LEVEL_ORDER) {
    return explicit as LogLevel;
  }
  const env = process.env.APP_ENV?.trim().toLowerCase();
  return env === 'homelab' ? 'info' : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[resolveLevel()];
}

export const logger = {
  debug(...args: unknown[]): void {
    if (shouldLog('debug')) console.debug(...args);
  },
  info(...args: unknown[]): void {
    if (shouldLog('info')) console.info(...args);
  },
  warn(...args: unknown[]): void {
    if (shouldLog('warn')) console.warn(...args);
  },
  error(...args: unknown[]): void {
    if (shouldLog('error')) console.error(...args);
  },
};

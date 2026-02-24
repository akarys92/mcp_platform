/**
 * Simple in-memory per-user rate limiter using a sliding window.
 * Limits:
 *   - General MCP requests: 100/min per user
 *   - QBO report tools: 200/min aggregate (QBO API limit)
 *   - QBO standard tools: 500/min aggregate (QBO API limit)
 */

interface WindowEntry {
  timestamps: number[];
}

const userWindows = new Map<string, WindowEntry>();
const qboStandardWindow: WindowEntry = { timestamps: [] };
const qboReportWindow: WindowEntry = { timestamps: [] };

const WINDOW_MS = 60_000; // 1 minute
const USER_LIMIT = 100;
const QBO_STANDARD_LIMIT = 500;
const QBO_REPORT_LIMIT = 200;

function pruneWindow(entry: WindowEntry, now: number) {
  const cutoff = now - WINDOW_MS;
  while (entry.timestamps.length > 0 && entry.timestamps[0] < cutoff) {
    entry.timestamps.shift();
  }
}

/**
 * Check if a user request is within rate limits.
 * Returns true if allowed, false if rate-limited.
 */
export function checkUserRateLimit(userId: string): boolean {
  const now = Date.now();

  if (!userWindows.has(userId)) {
    userWindows.set(userId, { timestamps: [] });
  }

  const entry = userWindows.get(userId)!;
  pruneWindow(entry, now);

  if (entry.timestamps.length >= USER_LIMIT) {
    return false;
  }

  entry.timestamps.push(now);
  return true;
}

/**
 * Check QBO API rate limit for standard (non-report) endpoints.
 */
export function checkQBOStandardRateLimit(): boolean {
  const now = Date.now();
  pruneWindow(qboStandardWindow, now);

  if (qboStandardWindow.timestamps.length >= QBO_STANDARD_LIMIT) {
    return false;
  }

  qboStandardWindow.timestamps.push(now);
  return true;
}

/**
 * Check QBO API rate limit for report endpoints.
 */
export function checkQBOReportRateLimit(): boolean {
  const now = Date.now();
  pruneWindow(qboReportWindow, now);

  if (qboReportWindow.timestamps.length >= QBO_REPORT_LIMIT) {
    return false;
  }

  qboReportWindow.timestamps.push(now);
  return true;
}

// Periodic cleanup of stale user entries (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const cutoff = now - WINDOW_MS * 2;
    for (const [userId, entry] of userWindows) {
      if (
        entry.timestamps.length === 0 ||
        entry.timestamps[entry.timestamps.length - 1] < cutoff
      ) {
        userWindows.delete(userId);
      }
    }
  }, 5 * 60_000);
}

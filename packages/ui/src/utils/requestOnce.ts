type RequestOnceEntry<T> = {
  promise: Promise<T>;
  createdAt: number;
};

const requestOnceMap = new Map<string, RequestOnceEntry<unknown>>();

/**
 * Dedupes identical requests for a short window (default 2s).
 *
 * This is primarily to prevent React.StrictMode dev remounts from firing the same
 * HTTP request twice concurrently (or back-to-back).
 */
export const requestOnce = async <T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs = 2000
): Promise<T> => {
  const now = Date.now();
  const existing = requestOnceMap.get(key) as RequestOnceEntry<T> | undefined;

  if (existing && now - existing.createdAt < ttlMs) {
    return existing.promise;
  }

  const entry: RequestOnceEntry<T> = {
    createdAt: now,
    promise: fn(),
  };

  requestOnceMap.set(key, entry as RequestOnceEntry<unknown>);

  // Keep it for a short TTL even after it resolves, to avoid immediate re-runs.
  setTimeout(() => {
    const current = requestOnceMap.get(key);
    if (current === (entry as RequestOnceEntry<unknown>)) {
      requestOnceMap.delete(key);
    }
  }, ttlMs);

  return entry.promise;
};

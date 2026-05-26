export async function runWithRetriesAsync<T>(fn: () => T, maxRetries = 5, backoffMs = 100): Promise<T> {
  let attempts = 0;
  while (true) {
    try {
      return fn();
    } catch (err: any) {
      attempts++;
      if (err.code === "SQLITE_BUSY" && attempts < maxRetries) {
        await new Promise((res) => setTimeout(res, backoffMs * attempts));
        continue;
      }
      throw err;
    }
  }
}

const RETRYABLE = ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "rate_limit", "timeout"];

function isRetryable(err: any): boolean {
  const msg = (err?.message ?? err?.code ?? "").toLowerCase();
  return RETRYABLE.some((k) => msg.includes(k)) || err?.status === 429 || err?.status === 503;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, label = "op" }: { attempts?: number; label?: string } = {}
): Promise<T> {
  const delays = [500, 1500, 3000];
  let lastErr: any;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (!isRetryable(err) || i === attempts - 1) break;
      console.warn(`[retry] ${label} attempt ${i + 1} failed, retrying in ${delays[i]}ms`);
      await new Promise((r) => setTimeout(r, delays[i]));
    }
  }

  console.error(`[retry] ${label} failed after ${attempts} attempts:`, lastErr?.message);
  throw lastErr;
}

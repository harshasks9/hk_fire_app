/*
  fetch with retry for the Gemini REST API. 429 (rate limit) and 5xx (overloaded)
  are transient: wait for the server's suggested delay (Retry-After header or the
  "retryDelay" in the error body), else back off, and try again within a time
  budget. Returns the final response; when it is not ok the body text is
  already read into `errorText` so callers can log it.
*/
const RETRYABLE = new Set([429, 500, 502, 503, 504])
const BACKOFF_MS = [1500, 4000, 10_000, 20_000]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function suggestedDelayMs(res: Response, body: string, attempt: number): number {
  const ra = res.headers.get('retry-after')
  if (ra && /^\d+$/.test(ra)) return Number(ra) * 1000
  const m = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(body)
  if (m) return Math.ceil(parseFloat(m[1]!) * 1000) + 500
  return BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]!
}

export async function geminiFetch(url: string, init: RequestInit, opts: { maxWaitMs?: number; maxAttempts?: number } = {}): Promise<{ res: Response; errorText: string; attempts: number }> {
  const maxWait = opts.maxWaitMs ?? 45_000
  const maxAttempts = opts.maxAttempts ?? 4
  let waited = 0
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init)
    if (res.ok) return { res, errorText: '', attempts: attempt + 1 }
    const errorText = await res.text().catch(() => '')
    if (!RETRYABLE.has(res.status) || attempt + 1 >= maxAttempts) return { res, errorText, attempts: attempt + 1 }
    const delay = Math.min(suggestedDelayMs(res, errorText, attempt), 30_000)
    if (waited + delay > maxWait) return { res, errorText, attempts: attempt + 1 }
    await sleep(delay)
    waited += delay
  }
}

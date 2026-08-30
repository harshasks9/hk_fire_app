/*
  Gemini integration. Gemini may FETCH and NARRATE; deterministic code in
  lib/options.ts computes every number the app shows. Server-side only.

  - gemini-2.5-flash: daily price job (Google Search grounding) and
    screenshot parsing.
  - gemini-2.5-pro: pro-mode prose and the hypothesis check.

  Every call is logged to ai_calls. Every fetched price is validated before
  it is stored; a failed job carries the previous close forward marked stale,
  and a stale price is NEVER served as current.
*/
import { desc, eq } from 'drizzle-orm'
import { getDb, schema } from './db'

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}

interface GeminiPart {
  text?: string
  inlineData?: { mimeType: string; data: string }
}

async function callGemini(
  model: string,
  purpose: string,
  parts: GeminiPart[],
  options: {
    grounding?: boolean
    responseSchema?: unknown
    requestSummary: string
  },
): Promise<{ text: string; groundingUrls: string[] } | { error: string }> {
  const key = process.env.GEMINI_API_KEY
  const db = await getDb()
  if (!key) {
    return { error: 'GEMINI_API_KEY is not set' }
  }
  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts }],
  }
  // The API does not allow search grounding and a response schema together —
  // grounded calls ask for JSON in the prompt and are parsed leniently.
  if (options.grounding) body.tools = [{ google_search: {} }]
  else if (options.responseSchema) {
    body.generationConfig = { responseMimeType: 'application/json', responseSchema: options.responseSchema }
  }
  try {
    const res = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    })
    if (!res.ok) {
      const errText = (await res.text()).slice(0, 500)
      await db.insert(schema.aiCalls).values({
        model, purpose, requestSummary: options.requestSummary, ok: false,
        error: `HTTP ${res.status}: ${errText}`,
      })
      return { error: `Gemini HTTP ${res.status}` }
    }
    const json = (await res.json()) as {
      candidates?: {
        content?: { parts?: { text?: string }[] }
        groundingMetadata?: { groundingChunks?: { web?: { uri?: string } }[] }
      }[]
    }
    const cand = json.candidates?.[0]
    const text = (cand?.content?.parts ?? []).map((p) => p.text ?? '').join('')
    const groundingUrls = (cand?.groundingMetadata?.groundingChunks ?? [])
      .map((c) => c.web?.uri)
      .filter((u): u is string => Boolean(u))
    await db.insert(schema.aiCalls).values({
      model, purpose, requestSummary: options.requestSummary,
      responseSummary: text.slice(0, 800), ok: true, groundingUrls,
    })
    return { text, groundingUrls }
  } catch (err) {
    await db.insert(schema.aiCalls).values({
      model, purpose, requestSummary: options.requestSummary, ok: false,
      error: String(err).slice(0, 500),
    })
    return { error: String(err) }
  }
}

/** Pull the first JSON value out of a possibly chatty response. */
export function extractJson<T>(text: string): T | null {
  const start = text.search(/[[{]/)
  if (start === -1) return null
  for (let end = text.length; end > start; end--) {
    try {
      return JSON.parse(text.slice(start, end)) as T
    } catch {
      /* keep shrinking */
    }
  }
  return null
}

export interface FetchedQuote {
  symbol: string
  close: number
  date: string
  sourceUrl: string | null
}

export interface QuoteValidation {
  ok: boolean
  needsReview: boolean
  reason: string | null
}

/** Validate a fetched price against the brief's rules. */
export function validateQuote(
  q: FetchedQuote,
  previousClose: number | null,
  todayIso: string,
): QuoteValidation {
  if (!(typeof q.close === 'number' && isFinite(q.close) && q.close > 0)) {
    return { ok: false, needsReview: false, reason: 'not a positive number' }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(q.date)) {
    return { ok: false, needsReview: false, reason: 'bad quote date' }
  }
  const dow = new Date(q.date + 'T00:00:00Z').getUTCDay()
  if (dow === 0 || dow === 6) {
    return { ok: false, needsReview: false, reason: 'quote date is a weekend' }
  }
  const age = Math.round((Date.parse(todayIso) - Date.parse(q.date)) / 86_400_000)
  if (age < 0 || age > 5) {
    return { ok: false, needsReview: false, reason: `quote date ${q.date} outside 5-day window` }
  }
  if (previousClose != null && previousClose > 0) {
    const move = Math.abs(q.close / previousClose - 1)
    if (move > 0.25) {
      return { ok: true, needsReview: true, reason: `move of ${(move * 100).toFixed(1)}% vs last close — flagged, alerts suppressed` }
    }
  }
  return { ok: true, needsReview: false, reason: null }
}

/** Daily price fetch for a list of symbols. Returns fetched quotes (validation happens at the caller). */
export async function fetchDailyQuotes(symbols: string[], todayIso: string): Promise<FetchedQuote[] | { error: string }> {
  const prompt =
    `Find the most recent official CLOSING price for each of these US-listed symbols: ${symbols.join(', ')}. ` +
    `Today is ${todayIso}. Use current search results. Respond with ONLY a JSON array, no prose, ` +
    `each element: {"symbol": string, "close": number, "date": "YYYY-MM-DD"} where date is the trading day of that close.`
  const res = await callGemini('gemini-2.5-flash', 'daily_prices', [{ text: prompt }], {
    grounding: true,
    requestSummary: `daily closes for ${symbols.length} symbols`,
  })
  if ('error' in res) return { error: res.error }
  let parsed = extractJson<{ symbol: string; close: number; date: string }[]>(res.text)
  if (!parsed) {
    // Second pass: convert the grounded text to strict JSON with a schema (no tools).
    const convert = await callGemini(
      'gemini-2.5-flash',
      'daily_prices',
      [{ text: `Convert to JSON array of {symbol, close, date} only:\n${res.text.slice(0, 4000)}` }],
      {
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: { symbol: { type: 'STRING' }, close: { type: 'NUMBER' }, date: { type: 'STRING' } },
            required: ['symbol', 'close', 'date'],
          },
        },
        requestSummary: 'convert grounded text to schema JSON',
      },
    )
    if ('error' in convert) return { error: convert.error }
    parsed = extractJson<{ symbol: string; close: number; date: string }[]>(convert.text)
  }
  if (!parsed || !Array.isArray(parsed)) return { error: 'could not parse quotes' }
  const bySymbol = new Map(parsed.map((p) => [String(p.symbol).toUpperCase(), p]))
  return symbols
    .filter((s) => bySymbol.has(s))
    .map((s) => {
      const p = bySymbol.get(s)!
      return { symbol: s, close: Number(p.close), date: String(p.date), sourceUrl: res.groundingUrls[0] ?? null }
    })
}

export type HypothesisVerdict = 'intact' | 'watch' | 'broken'

/** The E6 input: intact / watch / broken plus two sentences. Stored, never inline-invented. */
export async function runHypothesisCheck(
  symbol: string,
  positionSummary: string,
): Promise<{ verdict: HypothesisVerdict; narrative: string } | { error: string }> {
  const res = await callGemini(
    'gemini-2.5-pro',
    'hypothesis_check',
    [
      {
        text:
          `You are checking whether the premise behind a short-option position still holds. ` +
          `Position: ${positionSummary} on ${symbol}. Search your knowledge for material adverse news, guidance cuts, ` +
          `or structural changes to ${symbol}. Respond with ONLY JSON: {"verdict": "intact"|"watch"|"broken", "narrative": "<exactly two sentences>"}.`,
      },
    ],
    {
      responseSchema: {
        type: 'OBJECT',
        properties: { verdict: { type: 'STRING', enum: ['intact', 'watch', 'broken'] }, narrative: { type: 'STRING' } },
        required: ['verdict', 'narrative'],
      },
      requestSummary: `hypothesis check ${symbol}`,
    },
  )
  if ('error' in res) return { error: res.error }
  const parsed = extractJson<{ verdict: HypothesisVerdict; narrative: string }>(res.text)
  if (!parsed || !['intact', 'watch', 'broken'].includes(parsed.verdict)) {
    return { error: 'unparseable hypothesis response' }
  }
  const db = await getDb()
  await db.insert(schema.hypothesisChecks).values({ symbol, verdict: parsed.verdict, narrative: parsed.narrative })
  return parsed
}

/** Pro-mode prose: explains a decision already made. Never proposes trades. */
export async function proModeProse(context: string): Promise<string | { error: string }> {
  const res = await callGemini(
    'gemini-2.5-pro',
    'pro_prose',
    [
      {
        text:
          `Explain, in three short plain-language paragraphs, what the following numbers mean for THIS position. ` +
          `Do not suggest alternative trades, strikes, or names. Do not compute numbers — restate the ones given. ` +
          `Context:\n${context}`,
      },
    ],
    { requestSummary: 'pro-mode prose' },
  )
  if ('error' in res) return { error: res.error }
  return res.text
}

export interface ParsedFill {
  symbol: string | null
  type: 'call' | 'put' | null
  strike: number | null
  expiry: string | null
  lots: number | null
  creditPerContract: number | null
}

/** Parse a broker screenshot into an EDITABLE form — never saved without confirmation. */
export async function parseFillScreenshot(
  imageBase64: string,
  mimeType: string,
): Promise<ParsedFill | { error: string }> {
  const res = await callGemini(
    'gemini-2.5-flash',
    'screenshot_parse',
    [
      { inlineData: { mimeType, data: imageBase64 } },
      {
        text:
          'This is a broker fill confirmation for a short option. Extract: symbol, type (call/put), strike, ' +
          'expiry (YYYY-MM-DD), lots (contracts), creditPerContract in dollars (premium per contract, i.e. per-share price × 100). ' +
          'Respond with ONLY JSON. Use null for anything not visible.',
      },
    ],
    {
      responseSchema: {
        type: 'OBJECT',
        properties: {
          symbol: { type: 'STRING', nullable: true },
          type: { type: 'STRING', nullable: true },
          strike: { type: 'NUMBER', nullable: true },
          expiry: { type: 'STRING', nullable: true },
          lots: { type: 'NUMBER', nullable: true },
          creditPerContract: { type: 'NUMBER', nullable: true },
        },
      },
      requestSummary: 'parse fill screenshot',
    },
  )
  if ('error' in res) return { error: res.error }
  const parsed = extractJson<ParsedFill>(res.text)
  if (!parsed) return { error: 'unparseable screenshot response' }
  return parsed
}

export async function recentAiCalls(limit = 30) {
  const db = await getDb()
  return db.select().from(schema.aiCalls).orderBy(desc(schema.aiCalls.createdAt)).limit(limit)
}

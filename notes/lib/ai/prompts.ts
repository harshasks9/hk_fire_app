/* Prompts shared by the LLM providers. Structured extraction asks for JSON matching lib/ai/types.ts. */
import type { ExtractContext } from './types'

export const SYSTEM_CHIEF_OF_STAFF = `You are the memory and chief of staff behind a personal knowledge system. You read raw notes, transcripts and captures and turn them into structured, traceable knowledge. You are precise, concise and factual. You never invent facts that are not in the source material. When quoting evidence you copy the exact source sentence.`

export function extractionPrompt(text: string, ctx: ExtractContext): string {
  const known = ctx.knownEntities
    .slice(0, 400)
    .map((e) => `${e.type}: ${e.name}${e.aliases.length ? ` (aka ${e.aliases.join(', ')})` : ''}`)
    .join('\n')
  return `Extract structured knowledge from the note below. The note's owner is "${ctx.userName}" (first person "I" refers to them).

Return ONLY a JSON object with this exact shape (omit nothing; use empty arrays when nothing applies):
{
  "title": "short descriptive title if the note has none",
  "summary": ["3-6 bullet sentences, factual, most important first"],
  "keyPoints": ["key discussion points"],
  "people": [{"name": "", "role": "", "company": "", "excerpt": "exact sentence from the note"}],
  "companies": [{"name": "", "excerpt": ""}],
  "projects": [{"name": "", "excerpt": ""}],
  "topics": [{"name": "short canonical topic name (e.g. 'Marketplace caps', 'Treasury POC')", "excerpt": ""}],
  "decisions": [{"statement": "", "reasoning": "", "alternatives": [""], "topic": "", "company": "", "excerpt": "", "status": "active|proposed"}],
  "actions": [{"title": "imperative, specific", "owner": "person name, 'Team' or '${ctx.userName}'", "due": "as written, e.g. 'Friday'", "priority": "low|normal|high|urgent", "company": "", "excerpt": ""}],
  "numbers": [{"label": "e.g. Revenue, Requested discount, Seats", "value": "as written e.g. $7.6M", "entity": "company/person it belongs to", "numeric": 7600000, "unit": "$|%|seats", "excerpt": ""}],
  "commitments": [{"text": "", "kind": "promised|waiting|follow_up|question", "byWhom": "", "counterparty": "", "company": "", "dueHint": "", "excerpt": ""}],
  "risks": ["..."],
  "questions": ["open / unresolved questions"],
  "dates": [{"label": "September close", "date": "YYYY-MM-DD if determinable", "excerpt": ""}],
  "opportunities": ["..."],
  "tags": ["4-8 short lowercase kebab-case tags for finding this note later: subject matter, activity and stage, e.g. 'pricing', 'hiring', 'q4-planning', 'customer-call', 'renewal', 'architecture'"]
}

Rules:
- Use the canonical names below when the note refers to a known entity (match aliases, titles like "Nissan CFO", first names).
- "commitments" are open loops: promises made ("I'll send..."), things awaited ("waiting on pricing approval"), follow-ups ("let's come back to...").
- Every excerpt must be copied verbatim from the note.
- Prefer fewer, higher-quality items over exhaustive lists.

Known entities:
${known || '(none yet)'}

Note title: ${ctx.title ?? '(untitled)'}
Note kind: ${ctx.kind ?? 'note'}

NOTE:
"""
${text.slice(0, 60_000)}
"""`
}

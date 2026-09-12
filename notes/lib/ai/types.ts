/* Shared AI types: what the extraction pipeline produces from a raw note. */

export interface ExtractedPerson { name: string; role?: string; company?: string; excerpt?: string }
export interface ExtractedCompany { name: string; excerpt?: string }
export interface ExtractedNamed { name: string; excerpt?: string }
export interface ExtractedDecision { statement: string; reasoning?: string; alternatives?: string[]; topic?: string; company?: string; excerpt?: string; status?: 'active' | 'proposed' }
export interface ExtractedAction { title: string; owner?: string; due?: string; priority?: 'low' | 'normal' | 'high' | 'urgent'; company?: string; excerpt?: string }
export interface ExtractedNumber { label: string; value: string; entity?: string; numeric?: number; unit?: string; excerpt?: string }
export interface ExtractedCommitment { text: string; kind: 'promised' | 'waiting' | 'follow_up' | 'question'; byWhom?: string; counterparty?: string; company?: string; dueHint?: string; excerpt?: string }
export interface ExtractedDate { label: string; date?: string; excerpt?: string }

export interface Extraction {
  title?: string
  summary: string[]
  keyPoints: string[]
  people: ExtractedPerson[]
  companies: ExtractedCompany[]
  projects: ExtractedNamed[]
  topics: ExtractedNamed[]
  decisions: ExtractedDecision[]
  actions: ExtractedAction[]
  numbers: ExtractedNumber[]
  commitments: ExtractedCommitment[]
  risks: string[]
  questions: string[]
  dates: ExtractedDate[]
  opportunities: string[]
  /** 4-8 lowercase kebab-case topical tags, e.g. pricing, hiring, q4-planning. */
  tags: string[]
}

export const emptyExtraction = (): Extraction => ({
  summary: [], keyPoints: [], people: [], companies: [], projects: [], topics: [], decisions: [], actions: [], numbers: [], commitments: [], risks: [], questions: [], dates: [], opportunities: [], tags: [],
})

export interface KnownEntity { id: string; name: string; type: 'person' | 'company' | 'project' | 'topic'; aliases: string[]; attributes?: Record<string, string | undefined> }

export interface ExtractContext {
  title?: string
  kind?: string
  knownEntities: KnownEntity[]
  userName: string
}

export interface CompleteOptions {
  system?: string
  json?: boolean
  maxTokens?: number
  purpose: string
}

export interface AIProvider {
  readonly name: 'local' | 'gemini' | 'anthropic'
  readonly model: string
  readonly isLLM: boolean
  extract(text: string, ctx: ExtractContext): Promise<Extraction>
  complete(prompt: string, opts: CompleteOptions): Promise<string>
  stream(prompt: string, opts: CompleteOptions): AsyncIterable<string>
}

export interface EmbeddingProvider {
  readonly name: string
  readonly dimensions: number
  embed(texts: string[]): Promise<number[][]>
}

export type OutputType =
  | 'executive_summary'
  | 'email'
  | 'slack'
  | 'customer_follow_up'
  | 'meeting_brief'
  | 'weekly_update'
  | 'account_summary'
  | 'decision_memo'
  | 'talking_points'
  | 'action_list'

export const OUTPUT_TYPES: { id: OutputType; label: string; hint: string }[] = [
  { id: 'executive_summary', label: 'Executive summary', hint: 'Five lines for someone with no context' },
  { id: 'email', label: 'Email', hint: 'A concise email you can send as-is' },
  { id: 'slack', label: 'Slack message', hint: 'Short, scannable, for a channel' },
  { id: 'customer_follow_up', label: 'Customer follow-up', hint: 'Recap, commitments, next steps' },
  { id: 'meeting_brief', label: 'Meeting brief', hint: 'What to know before walking in' },
  { id: 'weekly_update', label: 'Weekly update', hint: 'Progress, risks, asks' },
  { id: 'account_summary', label: 'Account summary', hint: 'Status, numbers, people, open items' },
  { id: 'decision_memo', label: 'Decision memo', hint: 'Decision, context, reasoning, alternatives' },
  { id: 'talking_points', label: 'Talking points', hint: 'What to say, in order' },
  { id: 'action_list', label: 'Action list', hint: 'Owner, task, due' },
]

export type RewriteMode = 'rewrite' | 'shorten' | 'clearer' | 'summarize' | 'extract_tasks' | 'extract_decisions' | 'ask'

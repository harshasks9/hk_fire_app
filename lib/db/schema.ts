/*
  Data model. Every first-class object keeps a link back to the raw source it
  came from (sourceNoteId + sourceExcerpt). AI-derived interpretation lives in
  its own columns/tables and never overwrites the raw note.
*/
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
  index,
  uniqueIndex,
  vector,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

const id = () => text('id').primaryKey()
const now = (name: string) => timestamp(name, { withTimezone: true }).notNull().defaultNow()

/* --------------------------------- users --------------------------------- */

/* ------------------------------- notebooks ------------------------------- */

export type NotebookStatus = 'active' | 'disabled'
export type AiMode = 'shared' | 'own' | 'local'

export interface NotebookSettings {
  /** shared = the deployment's keys; own = keys stored (encrypted) on the notebook; local = never call a model. */
  aiMode?: AiMode
  aiPreference?: 'auto' | 'anthropic' | 'gemini'
  anthropicKeyEnc?: string
  geminiKeyEnc?: string
  allowShareLinks?: boolean
  sampleData?: boolean
}

/** The unit of tenancy: every context (and everything under it) belongs to exactly one notebook. */
export const notebooks = pgTable('notebooks', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  ownerUserId: text('owner_user_id'),
  status: text('status').$type<NotebookStatus>().notNull().default('active'),
  settings: jsonb('settings').$type<NotebookSettings>().notNull().default({}),
  createdAt: now('created_at'),
  updatedAt: now('updated_at'),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
})

export type UserRole = 'admin' | 'owner' | 'member'
export type UserStatus = 'active' | 'disabled'

export const users = pgTable('users', {
  id: id(),
  name: text('name').notNull(),
  email: text('email'),
  settings: jsonb('settings').$type<UserSettings>().notNull().default({}),
  createdAt: now('created_at'),
  notebookId: text('notebook_id'),
  passwordHash: text('password_hash'),
  role: text('role').$type<UserRole>().notNull().default('owner'),
  status: text('status').$type<UserStatus>().notNull().default('active'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
}, (t) => [index('users_notebook_idx').on(t.notebookId), uniqueIndex('users_email_lower_idx').on(sql`lower(${t.email})`)])

export interface UserSettings {
  theme?: 'system' | 'light' | 'dark'
  aiProvider?: 'auto' | 'anthropic' | 'gemini' | 'local'
  aiEnabled?: boolean
  proactiveInsights?: boolean
  dailyBriefHour?: number
  defaultContext?: string
}

/* -------------------------------- contexts ------------------------------- */

export type ContextKind = 'work' | 'personal' | 'finance' | 'family' | 'research'

export const contexts = pgTable('contexts', {
  id: id(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  kind: text('kind').$type<ContextKind>().notNull(),
  description: text('description'),
  aiScope: text('ai_scope').$type<'isolated' | 'shared'>().notNull().default('isolated'),
  position: integer('position').notNull().default(0),
  createdAt: now('created_at'),
  notebookId: text('notebook_id').notNull().default('nb_default'),
}, (t) => [uniqueIndex('contexts_notebook_slug_idx').on(t.notebookId, t.slug)])

/* ---------------------------------- notes -------------------------------- */

export type NoteKind = 'note' | 'meeting' | 'voice' | 'capture' | 'link' | 'document' | 'screenshot' | 'email' | 'transcript'
export type NoteStatus = 'inbox' | 'processing' | 'processed' | 'archived'
export type Privacy = 'normal' | 'private' | 'ai_excluded'

export interface NoteSummary {
  summary: string[]
  decisions: string[]
  actions: string[]
  risks: string[]
  numbers: string[]
  questions?: string[]
  keyPoints?: string[]
  generatedAt: string
  provider: string
}

export const notes = pgTable(
  'notes',
  {
    id: id(),
    contextId: text('context_id').notNull(),
    title: text('title').notNull().default(''),
    kind: text('kind').$type<NoteKind>().notNull().default('note'),
    status: text('status').$type<NoteStatus>().notNull().default('processed'),
    privacy: text('privacy').$type<Privacy>().notNull().default('normal'),
    /** TipTap document JSON. The raw source — never edited by AI. */
    contentJson: jsonb('content_json').$type<unknown>(),
    /** Plain-text projection of contentJson, used for search, chunking and extraction. */
    contentText: text('content_text').notNull().default(''),
    /** AI interpretation, kept apart from the raw note. */
    summary: jsonb('summary').$type<NoteSummary | null>(),
    meetingId: text('meeting_id'),
    researchProjectId: text('research_project_id'),
    favorite: boolean('favorite').notNull().default(false),
    /** Where this came from: 'editor' | 'quick-capture' | 'voice' | 'upload' | 'share' | 'email' | 'transcript' | 'seed' */
    source: text('source').notNull().default('editor'),
    sourceUrl: text('source_url'),
    wordCount: integer('word_count').notNull().default(0),
    /** Tags derived from the content by the pipeline (lowercase, kebab-case). */
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    /** Tags the owner added by hand; kept across reprocessing. */
    manualTags: jsonb('manual_tags').$type<string[]>().notNull().default([]),
    aiProcessedAt: timestamp('ai_processed_at', { withTimezone: true }),
    processingError: text('processing_error'),
    createdAt: now('created_at'),
    updatedAt: now('updated_at'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('notes_context').on(t.contextId), index('notes_updated').on(t.updatedAt), index('notes_meeting').on(t.meetingId)],
)

/* -------------------------------- meetings ------------------------------- */

export type MeetingStatus = 'upcoming' | 'live' | 'completed'

export const meetings = pgTable(
  'meetings',
  {
    id: id(),
    contextId: text('context_id').notNull(),
    title: text('title').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    status: text('status').$type<MeetingStatus>().notNull().default('upcoming'),
    location: text('location'),
    /** The note that holds the meeting's manual notes + AI summary. */
    noteId: text('note_id'),
    companyEntityId: text('company_entity_id'),
    summary: jsonb('summary').$type<NoteSummary | null>(),
    followUpEmail: text('follow_up_email'),
    executiveReadout: text('executive_readout'),
    /** Recording ingest (phone recordings / uploaded transcripts): where the background job is. */
    ingestStatus: text('ingest_status').$type<IngestStatus | null>(),
    ingestError: text('ingest_error'),
    ingestStageAt: timestamp('ingest_stage_at', { withTimezone: true }),
    /** The audio attachment the meeting was built from, when there is one. */
    recordingAttachmentId: text('recording_attachment_id'),
    durationSeconds: doublePrecision('duration_seconds'),
    createdAt: now('created_at'),
    updatedAt: now('updated_at'),
  },
  (t) => [index('meetings_context_start').on(t.contextId, t.startsAt)],
)

export type IngestStatus = 'queued' | 'uploading' | 'transcribing' | 'structuring' | 'filing' | 'done' | 'failed'

export interface TranscriptSegment {
  t: number // seconds from start
  speaker: string
  text: string
}

export const transcripts = pgTable('transcripts', {
  id: id(),
  meetingId: text('meeting_id').notNull(),
  segments: jsonb('segments').$type<TranscriptSegment[]>().notNull().default([]),
  text: text('text').notNull().default(''),
  language: text('language').default('en'),
  source: text('source').notNull().default('live'), // 'live' | 'upload' | 'api' | 'recording' | 'seed'
  /** Generic labels from diarization mapped to people, e.g. { "Speaker 1": "Harsha" }. */
  speakerMap: jsonb('speaker_map').$type<Record<string, string>>().notNull().default({}),
  attachmentId: text('attachment_id'),
  durationSeconds: doublePrecision('duration_seconds'),
  createdAt: now('created_at'),
})

/* -------------------------------- entities ------------------------------- */

export type EntityType = 'person' | 'company' | 'project' | 'topic'

export interface EntityAttributes {
  role?: string
  company?: string
  email?: string
  location?: string
  status?: string
  stage?: string
  owner?: string
  [key: string]: string | undefined
}

export const entities = pgTable(
  'entities',
  {
    id: id(),
    contextId: text('context_id').notNull(),
    type: text('type').$type<EntityType>().notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    aliases: jsonb('aliases').$type<string[]>().notNull().default([]),
    attributes: jsonb('attributes').$type<EntityAttributes>().notNull().default({}),
    /** AI overview / relationship summary. */
    summary: text('summary'),
    summaryUpdatedAt: timestamp('summary_updated_at', { withTimezone: true }),
    mentionCount: integer('mention_count').notNull().default(0),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    pinned: boolean('pinned').notNull().default(false),
    createdAt: now('created_at'),
    updatedAt: now('updated_at'),
  },
  (t) => [uniqueIndex('entities_ctx_type_slug').on(t.contextId, t.type, t.slug), index('entities_type').on(t.type)],
)

/** Mention of an entity inside a note, with the passage it was found in. */
export const noteEntities = pgTable(
  'note_entities',
  {
    id: id(),
    noteId: text('note_id').notNull(),
    entityId: text('entity_id').notNull(),
    excerpt: text('excerpt'),
    confidence: doublePrecision('confidence').notNull().default(1),
    createdAt: now('created_at'),
  },
  (t) => [uniqueIndex('note_entities_pair').on(t.noteId, t.entityId), index('note_entities_entity').on(t.entityId)],
)

export const entityRelations = pgTable(
  'entity_relations',
  {
    id: id(),
    contextId: text('context_id').notNull(),
    fromType: text('from_type').notNull(),
    fromId: text('from_id').notNull(),
    toType: text('to_type').notNull(),
    toId: text('to_id').notNull(),
    relation: text('relation').notNull(), // works_at | attended | decided_in | about | involves | owns | depends_on | related
    weight: doublePrecision('weight').notNull().default(1),
    sourceNoteId: text('source_note_id'),
    createdAt: now('created_at'),
  },
  (t) => [
    uniqueIndex('relations_unique').on(t.fromType, t.fromId, t.toType, t.toId, t.relation),
    index('relations_from').on(t.fromId),
    index('relations_to').on(t.toId),
  ],
)

/* ---------------------------------- tasks -------------------------------- */

export type TaskStatus = 'open' | 'waiting' | 'delegated' | 'done' | 'dropped'
export type Priority = 'low' | 'normal' | 'high' | 'urgent'

export const tasks = pgTable(
  'tasks',
  {
    id: id(),
    contextId: text('context_id').notNull(),
    title: text('title').notNull(),
    owner: text('owner').notNull().default('Me'),
    ownerEntityId: text('owner_entity_id'),
    /** Customer / project this task belongs to. */
    entityId: text('entity_id'),
    sourceNoteId: text('source_note_id'),
    sourceExcerpt: text('source_excerpt'),
    dueAt: timestamp('due_at', { withTimezone: true }),
    status: text('status').$type<TaskStatus>().notNull().default('open'),
    priority: text('priority').$type<Priority>().notNull().default('normal'),
    aiGenerated: boolean('ai_generated').notNull().default(true),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: now('created_at'),
    updatedAt: now('updated_at'),
  },
  (t) => [index('tasks_context_status').on(t.contextId, t.status), index('tasks_source').on(t.sourceNoteId)],
)

/* -------------------------------- decisions ------------------------------ */

export type DecisionStatus = 'active' | 'proposed' | 'superseded' | 'revisited' | 'reversed'

export const decisions = pgTable(
  'decisions',
  {
    id: id(),
    contextId: text('context_id').notNull(),
    title: text('title').notNull(),
    statement: text('statement').notNull(),
    decidedAt: timestamp('decided_at', { withTimezone: true }).notNull(),
    context: text('context'),
    reasoning: text('reasoning'),
    alternatives: jsonb('alternatives').$type<string[]>().notNull().default([]),
    status: text('status').$type<DecisionStatus>().notNull().default('active'),
    topicEntityId: text('topic_entity_id'),
    companyEntityId: text('company_entity_id'),
    sourceNoteId: text('source_note_id'),
    sourceExcerpt: text('source_excerpt'),
    aiGenerated: boolean('ai_generated').notNull().default(true),
    createdAt: now('created_at'),
    updatedAt: now('updated_at'),
  },
  (t) => [index('decisions_context').on(t.contextId, t.decidedAt)],
)

/** A decision's history: every later discussion that confirmed, modified or contradicted it. */
export const decisionRevisions = pgTable(
  'decision_revisions',
  {
    id: id(),
    decisionId: text('decision_id').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    statement: text('statement').notNull(),
    kind: text('kind').$type<'made' | 'confirmed' | 'modified' | 'contradicted' | 'proposed'>().notNull(),
    sourceNoteId: text('source_note_id'),
    sourceExcerpt: text('source_excerpt'),
    createdAt: now('created_at'),
  },
  (t) => [index('decision_revisions_decision').on(t.decisionId)],
)

/* ------------------------------- commitments ----------------------------- */

export type CommitmentKind = 'promised' | 'waiting' | 'follow_up' | 'question'

/** Open loops: promises made, things awaited, follow-ups owed. */
export const commitments = pgTable(
  'commitments',
  {
    id: id(),
    contextId: text('context_id').notNull(),
    text: text('text').notNull(),
    kind: text('kind').$type<CommitmentKind>().notNull(),
    byWhom: text('by_whom').notNull().default('Me'),
    counterpartyEntityId: text('counterparty_entity_id'),
    companyEntityId: text('company_entity_id'),
    sourceNoteId: text('source_note_id'),
    sourceExcerpt: text('source_excerpt'),
    dueHint: text('due_hint'),
    dueAt: timestamp('due_at', { withTimezone: true }),
    priority: text('priority').$type<Priority>().notNull().default('normal'),
    status: text('status').$type<'open' | 'resolved' | 'dismissed'>().notNull().default('open'),
    detectedAt: now('detected_at'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => [index('commitments_context_status').on(t.contextId, t.status)],
)

/* ---------------------------------- facts -------------------------------- */

/** Structured numbers and attributes ("ByteDance revenue: $7.6M"), each with its source. */
export const facts = pgTable(
  'facts',
  {
    id: id(),
    contextId: text('context_id').notNull(),
    entityId: text('entity_id').notNull(),
    label: text('label').notNull(),
    value: text('value').notNull(),
    numericValue: doublePrecision('numeric_value'),
    unit: text('unit'),
    sourceNoteId: text('source_note_id'),
    sourceExcerpt: text('source_excerpt'),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
    /** Set when a newer observation replaced this value. */
    supersededById: text('superseded_by_id'),
    createdAt: now('created_at'),
  },
  (t) => [index('facts_entity').on(t.entityId), index('facts_label').on(t.entityId, t.label)],
)

/** Change detection: a fact whose value differs from what was previously known. */
export const changes = pgTable(
  'changes',
  {
    id: id(),
    contextId: text('context_id').notNull(),
    entityId: text('entity_id'),
    label: text('label').notNull(),
    oldValue: text('old_value').notNull(),
    newValue: text('new_value').notNull(),
    description: text('description').notNull(),
    sourceNoteId: text('source_note_id'),
    previousNoteId: text('previous_note_id'),
    detectedAt: now('detected_at'),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  },
  (t) => [index('changes_context').on(t.contextId, t.detectedAt)],
)

/* -------------------------------- research ------------------------------- */

export const researchProjects = pgTable('research_projects', {
  id: id(),
  contextId: text('context_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  question: text('question'),
  /** AI synthesis across everything in the project. */
  synthesis: text('synthesis'),
  synthesisUpdatedAt: timestamp('synthesis_updated_at', { withTimezone: true }),
  status: text('status').$type<'active' | 'parked' | 'done'>().notNull().default('active'),
  createdAt: now('created_at'),
  updatedAt: now('updated_at'),
})

/* ------------------------------ sources/files ---------------------------- */

export type SourceKind = 'url' | 'file' | 'image' | 'audio' | 'email' | 'screenshot' | 'pdf'

export const sources = pgTable(
  'sources',
  {
    id: id(),
    noteId: text('note_id').notNull(),
    kind: text('kind').$type<SourceKind>().notNull(),
    title: text('title'),
    url: text('url'),
    domain: text('domain'),
    extractedText: text('extracted_text'),
    createdAt: now('created_at'),
  },
  (t) => [index('sources_note').on(t.noteId)],
)

export const attachments = pgTable(
  'attachments',
  {
    id: id(),
    noteId: text('note_id').notNull(),
    name: text('name').notNull(),
    mime: text('mime').notNull(),
    size: integer('size').notNull(),
    /** Small files are stored inline (base64). Larger ones would go to object storage — same API boundary. */
    data: text('data'),
    storageUrl: text('storage_url'),
    durationSeconds: doublePrecision('duration_seconds'),
    createdAt: now('created_at'),
  },
  (t) => [index('attachments_note').on(t.noteId)],
)

/* --------------------------------- timeline ------------------------------ */

export const timelineEvents = pgTable(
  'timeline_events',
  {
    id: id(),
    contextId: text('context_id').notNull(),
    entityId: text('entity_id').notNull(),
    kind: text('kind').notNull(), // meeting | note | decision | task | change | commitment | email | capture
    title: text('title').notNull(),
    description: text('description'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    noteId: text('note_id'),
    meetingId: text('meeting_id'),
    refId: text('ref_id'),
    createdAt: now('created_at'),
  },
  (t) => [index('timeline_entity_time').on(t.entityId, t.occurredAt), uniqueIndex('timeline_dedupe').on(t.entityId, t.kind, t.refId)],
)

/* -------------------------------- embeddings ----------------------------- */

export type EmbeddingOwner = 'note' | 'entity' | 'task' | 'decision' | 'meeting' | 'research'

export const embeddings = pgTable(
  'embeddings',
  {
    id: id(),
    contextId: text('context_id').notNull(),
    ownerType: text('owner_type').$type<EmbeddingOwner>().notNull(),
    ownerId: text('owner_id').notNull(),
    chunkIndex: integer('chunk_index').notNull().default(0),
    text: text('text').notNull(),
    embedding: vector('embedding', { dimensions: 768 }).notNull(),
    provider: text('provider').notNull(),
    createdAt: now('created_at'),
  },
  (t) => [index('embeddings_owner').on(t.ownerType, t.ownerId), index('embeddings_context').on(t.contextId)],
)

/* --------------------------------- insights ------------------------------ */

/** Proactive observations. Surfaced quietly in Home and entity pages; never as notifications. */
export const insights = pgTable(
  'insights',
  {
    id: id(),
    contextId: text('context_id').notNull(),
    kind: text('kind').notNull(), // pattern | overdue | unresolved | change | prep
    text: text('text').notNull(),
    entityId: text('entity_id'),
    score: doublePrecision('score').notNull().default(0.5),
    evidence: jsonb('evidence').$type<{ noteId: string; title: string }[]>().notNull().default([]),
    dedupeKey: text('dedupe_key').notNull(),
    createdAt: now('created_at'),
    dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('insights_dedupe').on(t.contextId, t.dedupeKey)],
)

/* --------------------------------- ai calls ------------------------------ */

export const aiCalls = pgTable('ai_calls', {
  id: id(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  purpose: text('purpose').notNull(),
  inputChars: integer('input_chars').notNull().default(0),
  outputChars: integer('output_chars').notNull().default(0),
  ok: boolean('ok').notNull().default(true),
  error: text('error'),
  durationMs: integer('duration_ms'),
  createdAt: now('created_at'),
  notebookId: text('notebook_id'),
})

/* --------------------------------- settings ------------------------------ */

export const appMeta = pgTable('app_meta', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>(),
  updatedAt: now('updated_at'),
})

/* ------------------------------ platform tables ---------------------------- */

/** Invitations to join a notebook; single use, expire after 7 days. */
export const invites = pgTable('invites', {
  id: id(),
  notebookId: text('notebook_id').notNull(),
  email: text('email'),
  role: text('role').$type<UserRole>().notNull().default('member'),
  tokenHash: text('token_hash').notNull().unique(),
  createdBy: text('created_by'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  acceptedUserId: text('accepted_user_id'),
  createdAt: now('created_at'),
}, (t) => [index('invites_notebook_idx').on(t.notebookId)])

/** Personal capture tokens for shortcuts, automations and scripts. Only the hash is stored. */
export const apiTokens = pgTable('api_tokens', {
  id: id(),
  notebookId: text('notebook_id').notNull(),
  userId: text('user_id').notNull(),
  label: text('label').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  prefix: text('prefix').notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: now('created_at'),
}, (t) => [index('api_tokens_notebook_idx').on(t.notebookId)])

/** Snapshots of a note's content, written on processed saves and before restores. */
export const noteVersions = pgTable('note_versions', {
  id: id(),
  noteId: text('note_id').notNull(),
  title: text('title').notNull().default(''),
  contentJson: jsonb('content_json').notNull(),
  contentText: text('content_text').notNull().default(''),
  wordCount: integer('word_count').notNull().default(0),
  reason: text('reason').$type<'save' | 'restore' | 'import' | 'manual' | 'original'>().notNull().default('save'),
  createdAt: now('created_at'),
}, (t) => [index('note_versions_note_idx').on(t.noteId, t.createdAt)])

/** Public read-only links to a note. */
export const shareLinks = pgTable('share_links', {
  id: id(),
  notebookId: text('notebook_id').notNull(),
  noteId: text('note_id').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  token: text('token').notNull(),
  createdBy: text('created_by'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  views: integer('views').notNull().default(0),
  lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
  createdAt: now('created_at'),
}, (t) => [index('share_links_note_idx').on(t.noteId)])

/** Note templates: built-in (notebook_id null) and per-notebook custom ones. */
export const templates = pgTable('templates', {
  id: id(),
  notebookId: text('notebook_id'),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  kind: text('kind').$type<NoteKind>().notNull().default('note'),
  contentJson: jsonb('content_json').notNull(),
  position: integer('position').notNull().default(0),
  createdBy: text('created_by'),
  createdAt: now('created_at'),
  updatedAt: now('updated_at'),
}, (t) => [index('templates_notebook_idx').on(t.notebookId)])

/** Immutable record of administrative actions. */
export const adminEvents = pgTable('admin_events', {
  id: id(),
  actorUserId: text('actor_user_id'),
  actorName: text('actor_name'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  targetName: text('target_name'),
  meta: jsonb('meta').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: now('created_at'),
}, (t) => [index('admin_events_created_idx').on(t.createdAt)])

/** Weekly review narratives, one per context and week. */
export const weeklyReviews = pgTable('weekly_reviews', {
  id: id(),
  contextId: text('context_id').notNull(),
  weekStart: text('week_start').notNull(),
  narrative: text('narrative'),
  provider: text('provider'),
  facts: jsonb('facts').$type<unknown>(),
  createdAt: now('created_at'),
  updatedAt: now('updated_at'),
}, (t) => [uniqueIndex('weekly_reviews_ctx_week_idx').on(t.contextId, t.weekStart)])

export type Notebook = typeof notebooks.$inferSelect
export type User = typeof users.$inferSelect
export type Template = typeof templates.$inferSelect
export type NoteVersion = typeof noteVersions.$inferSelect
export type ShareLink = typeof shareLinks.$inferSelect
export type Note = typeof notes.$inferSelect
export type Meeting = typeof meetings.$inferSelect
export type Entity = typeof entities.$inferSelect
export type Task = typeof tasks.$inferSelect
export type Decision = typeof decisions.$inferSelect
export type Commitment = typeof commitments.$inferSelect
export type Fact = typeof facts.$inferSelect
export type Change = typeof changes.$inferSelect
export type Context = typeof contexts.$inferSelect
export type ResearchProject = typeof researchProjects.$inferSelect
export type TimelineEvent = typeof timelineEvents.$inferSelect
export type Insight = typeof insights.$inferSelect
export type Transcript = typeof transcripts.$inferSelect
export type Attachment = typeof attachments.$inferSelect
export type Source = typeof sources.$inferSelect

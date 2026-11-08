/**
 * Loads every research file under data/ into one in-memory dataset.
 * Shared by validate.ts, build-graph.ts and the tests. No dependencies.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import type { Assertion, Comparison, CoreIdentity, Discovery, Entity, SacredEra, Source } from '../../schema/types.ts'

export const ROOT = join(import.meta.dirname, '..', '..')
export const DATA = join(ROOT, 'data')

export interface FileOf<T> {
  file: string
  domain: string
  items: T[]
}

export interface Dataset {
  core: CoreIdentity[]
  entities: FileOf<Entity>[]
  assertions: FileOf<Assertion>[]
  sources: FileOf<Source>[]
  comparisons: FileOf<Comparison>[]
  discoveries: Discovery[]
  sacred: SacredEra[]
  parseErrors: string[]
}

function readJsonArray<T>(path: string, errors: string[]): T[] {
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'))
    if (Array.isArray(raw)) return raw as T[]
    if (raw && Array.isArray(raw.items)) return raw.items as T[]
    errors.push(`${path}: expected a JSON array (or {items: [...]})`)
    return []
  } catch (e) {
    errors.push(`${path}: ${(e as Error).message}`)
    return []
  }
}

function readDir<T>(dir: string, errors: string[]): FileOf<T>[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ file: join(dir, f), domain: basename(f, '.json').split(/[-.]/)[0], items: readJsonArray<T>(join(dir, f), errors) }))
}

export function loadDataset(): Dataset {
  const parseErrors: string[] = []
  const core = readJsonArray<CoreIdentity>(join(DATA, 'core-registry.json'), parseErrors)
  const entities = readDir<Entity>(join(DATA, 'entities'), parseErrors)
  const assertions = readDir<Assertion>(join(DATA, 'assertions'), parseErrors)
  const sources = readDir<Source>(join(DATA, 'sources'), parseErrors)
  const comparisons = readDir<Comparison>(join(DATA, 'comparisons'), parseErrors)
  const discoveries = existsSync(join(DATA, 'discoveries.json')) ? readJsonArray<Discovery>(join(DATA, 'discoveries.json'), parseErrors) : []
  const sacred = existsSync(join(DATA, 'sacred-chronology.json')) ? readJsonArray<SacredEra>(join(DATA, 'sacred-chronology.json'), parseErrors) : []
  return { core, entities, assertions, sources, comparisons, discoveries, sacred, parseErrors }
}

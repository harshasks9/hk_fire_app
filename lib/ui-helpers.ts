/* Pure helpers shared by server and client components. */
export function entityHref(type: string, id: string): string {
  return type === 'person' ? `/people/${id}` : type === 'company' ? `/companies/${id}` : `/topics/${id}`
}
export function dotFor(kind: string): string {
  return kind === 'work' ? 'bg-accent' : kind === 'personal' ? 'bg-success' : kind === 'finance' ? 'bg-warning' : kind === 'family' ? 'bg-danger/80' : 'bg-fg-3'
}

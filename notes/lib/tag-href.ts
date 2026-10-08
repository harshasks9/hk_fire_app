/** Where a tag chip goes. Plain module so server and client components can share it. */
export function tagHref(tag: string): string {
  return `/notes?tag=${encodeURIComponent(tag)}`
}

/** Where an entity page lives, by type. */
export function entityHref(type: string, id: string): string {
  return type === 'person' ? `/people/${id}` : type === 'company' ? `/companies/${id}` : `/topics/${id}`
}

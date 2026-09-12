/** Where a tag chip goes. Plain module so server and client components can share it. */
export function tagHref(tag: string): string {
  return `/notes?tag=${encodeURIComponent(tag)}`
}

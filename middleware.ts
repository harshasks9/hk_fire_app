/**
 * Vercel Edge Middleware — runs gate.ts in front of every request to the static site.
 * The gate returns a Response to intercept (the key form, a redirect) or undefined
 * to let the request fall through to the file in dist/.
 */
import { next } from '@vercel/edge'
import { gate } from './gate.ts'

export const config = { matcher: '/(.*)' }

export default async function middleware(req: Request): Promise<Response> {
  return (await gate(req)) ?? next()
}

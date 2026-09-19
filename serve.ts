/**
 * Local preview of dist/ with the key gate in front — what Vercel does, on localhost.
 * Not used in deployment; `npm run serve`.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'
import { gate } from './gate.ts'

const ROOT = join(import.meta.dirname, 'dist')
const PORT = Number(process.env.PORT ?? 4173)
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  const body = chunks.length ? Buffer.concat(chunks) : undefined
  const fetchReq = new Request(url, {
    method: req.method,
    headers: Object.entries(req.headers).filter(([, v]) => typeof v === 'string') as [string, string][],
    body: body && req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
  })

  const intercepted = await gate(fetchReq)
  if (intercepted) {
    // The browser drops Secure cookies over plain http; strip the flag for localhost only.
    const headers = new Headers(intercepted.headers)
    const cookie = headers.get('set-cookie')
    if (cookie) headers.set('set-cookie', cookie.replace('; Secure', ''))
    res.writeHead(intercepted.status, Object.fromEntries(headers))
    res.end(Buffer.from(await intercepted.arrayBuffer()))
    return
  }

  let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
  if (path.endsWith('/')) path += 'index.html'
  let file = join(ROOT, path)
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
    const data = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
    res.end(data)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('Not found')
  }
}).listen(PORT, () => console.log(`Serving dist/ behind the gate at http://localhost:${PORT}`))

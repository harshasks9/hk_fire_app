import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gate, tokenFor, COOKIE, DEFAULT_KEY } from './middleware.ts'

const KEY = '888888'
const site = 'https://hk.hkfire.app'

function post(path: string, key: string, headers: Record<string, string> = {}) {
  return new Request(site + path, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
    body: new URLSearchParams({ key }).toString(),
  })
}

describe('gate', () => {
  it('defaults to the standard key', () => {
    assert.equal(DEFAULT_KEY, '888888')
  })

  it('shows the key form to a visitor with no cookie, and does not index it', async () => {
    const res = await gate(new Request(site + '/owl/'), KEY)
    assert.ok(res)
    assert.equal(res.status, 401)
    const html = await res.text()
    assert.match(html, /<form method="post"/)
    assert.match(html, /name="key"/)
    assert.match(html, /noindex/)
    assert.doesNotMatch(html, /not right/)
    assert.equal(res.headers.get('cache-control'), 'no-store')
  })

  it('rejects a wrong key and says so', async () => {
    const res = await gate(post('/', '123456'), KEY)
    assert.ok(res)
    assert.equal(res.status, 401)
    assert.match(await res.text(), /not right/)
    assert.equal(res.headers.get('set-cookie'), null)
  })

  it('rejects an empty or malformed submission without throwing', async () => {
    const res = await gate(post('/', ''), KEY)
    assert.equal(res?.status, 401)
    const junk = new Request(site + '/', { method: 'POST', body: 'not a form', headers: { 'content-type': 'text/plain' } })
    assert.equal((await gate(junk, KEY))?.status, 401)
  })

  it('accepts the right key, sets a hashed cookie and returns to the page asked for', async () => {
    const res = await gate(post('/pax/', KEY), KEY)
    assert.ok(res)
    assert.equal(res.status, 303)
    assert.equal(res.headers.get('location'), '/pax/')
    const cookie = res.headers.get('set-cookie') ?? ''
    assert.match(cookie, new RegExp(`^${COOKIE}=${await tokenFor(KEY)};`))
    assert.match(cookie, /HttpOnly/)
    assert.match(cookie, /Secure/)
    assert.match(cookie, /SameSite=Lax/)
    assert.match(cookie, /Max-Age=2592000/)
    assert.doesNotMatch(cookie, /888888/)
  })

  it('trims whitespace around the submitted key', async () => {
    const res = await gate(post('/', `  ${KEY} `), KEY)
    assert.equal(res?.status, 303)
  })

  it('lets a request through once the cookie carries the right token', async () => {
    const req = new Request(site + '/owl/', { headers: { cookie: `${COOKIE}=${await tokenFor(KEY)}; other=1` } })
    assert.equal(await gate(req, KEY), undefined)
  })

  it('does not accept a cookie holding the key itself, or a token for another key', async () => {
    const raw = new Request(site + '/', { headers: { cookie: `${COOKIE}=${KEY}` } })
    assert.equal((await gate(raw, KEY))?.status, 401)
    const other = new Request(site + '/', { headers: { cookie: `${COOKIE}=${await tokenFor('000000')}` } })
    assert.equal((await gate(other, KEY))?.status, 401)
  })

  it('honours a different configured key', async () => {
    assert.equal((await gate(post('/', KEY), 'secret'))?.status, 401)
    assert.equal((await gate(post('/', 'secret'), 'secret'))?.status, 303)
  })

  it('clears the cookie on /logout and returns home', async () => {
    const res = await gate(new Request(site + '/logout', { headers: { cookie: `${COOKIE}=${await tokenFor(KEY)}` } }), KEY)
    assert.ok(res)
    assert.equal(res.status, 303)
    assert.equal(res.headers.get('location'), '/')
    assert.match(res.headers.get('set-cookie') ?? '', /Max-Age=0/)
  })

  it('never redirects off-site after a successful key', async () => {
    const res = await gate(post('//evil.example', KEY), KEY)
    assert.equal(res?.headers.get('location'), '/')
  })
})

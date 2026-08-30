export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; retry?: string }>
}) {
  const params = await searchParams
  return (
    <div className="mx-auto mt-16 max-w-xs">
      <h1 className="mb-1 text-xl font-semibold">Five Delta</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
        Private. One user.
      </p>
      {params.error === 'bad' ? (
        <p role="alert" className="mb-3 text-sm" style={{ color: 'var(--bad)' }}>
          Wrong password.
        </p>
      ) : null}
      {params.error === 'rate' ? (
        <p role="alert" className="mb-3 text-sm" style={{ color: 'var(--bad)' }}>
          Too many attempts. Try again in {params.retry ?? '900'} seconds.
        </p>
      ) : null}
      <form method="post" action="/api/login" className="flex flex-col gap-3">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
        <button
          type="submit"
          className="rounded-md border px-3 py-2 text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}
        >
          Sign in
        </button>
      </form>
    </div>
  )
}

'use client'
import * as React from 'react'
import { Button, Input, Textarea } from '@/components/ui'
import { Dialog } from '@/components/ui/Dialog'

export type FieldType = 'text' | 'textarea' | 'date' | 'datetime' | 'select' | 'number'
export interface Field { name: string; label: string; type?: FieldType; options?: { value: string; label: string }[]; placeholder?: string; required?: boolean; help?: string }
export type Values = Record<string, string>

/** One dialog for every "edit this thing" form: a field spec in, values out. */
export function EditDialog({ title, fields, initial, submitLabel = 'Save', onSubmit, onClose, footer }: { title: string; fields: Field[]; initial?: Values; submitLabel?: string; onSubmit: (values: Values) => Promise<void>; onClose: () => void; footer?: React.ReactNode }) {
  const [values, setValues] = React.useState<Values>(() => Object.fromEntries(fields.map((f) => [f.name, initial?.[f.name] ?? ''])))
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const set = (name: string, v: string) => setValues((o) => ({ ...o, [name]: v }))
  const missing = fields.some((f) => f.required && !values[f.name]?.trim())
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (missing) return
    setBusy(true); setError('')
    try { await onSubmit(values); onClose() } catch (err) { setError(String((err as Error).message ?? err)) } finally { setBusy(false) }
  }
  return (
    <Dialog onClose={onClose} title={title}>
      <form onSubmit={submit} className="space-y-3">
        {fields.map((f, i) => (
          <div key={f.name}>
            <label className="mb-1 block text-[12.5px] text-fg-2">{f.label}{f.required ? ' *' : ''}</label>
            {f.type === 'textarea' ? <Textarea autoFocus={i === 0} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} rows={3} />
              : f.type === 'select' ? <select value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} className="h-9 w-full rounded-[9px] border border-border-2 bg-surface px-2 text-[13.5px] outline-none focus:border-accent">{(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              : <Input autoFocus={i === 0} type={f.type === 'datetime' ? 'datetime-local' : f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />}
            {f.help ? <p className="mt-1 text-[11.5px] text-fg-3">{f.help}</p> : null}
          </div>
        ))}
        {error ? <p className="text-[13px] text-danger">{error}</p> : null}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div>{footer}</div>
          <div className="flex gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" variant="primary" loading={busy} disabled={busy || missing}>{submitLabel}</Button></div>
        </div>
      </form>
    </Dialog>
  )
}

/* Small date helpers shared by the editors. */
export const toDateInput = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : '')
export const toDateTimeInput = (d: Date | string | null | undefined) => { if (!d) return ''; const x = new Date(d); const p = (n: number) => String(n).padStart(2, '0'); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}` }
export const fromDateInput = (s: string | undefined, endOfDay = false) => (s ? new Date(s + (endOfDay ? 'T17:00:00' : 'T12:00:00')).toISOString() : null)
export const fromDateTimeInput = (s: string | undefined) => (s ? new Date(s).toISOString() : null)

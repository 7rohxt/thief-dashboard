import { generate } from './generate.js'
import { TODAY } from './constants.js'

export const db = generate()
export const offenderById = Object.fromEntries(db.offenders.map((o) => [o.id, o]))
export const caseById = Object.fromEntries(db.cases.map((c) => [c.id, c]))

export const PERIODS = [
  { id: '3m', label: '3 months', months: 3 },
  { id: '6m', label: '6 months', months: 6 },
  { id: '12m', label: '12 months', months: 12 },
  { id: 'all', label: '3 years', months: 36 },
]

export function periodStart(periodId) {
  const p = PERIODS.find((x) => x.id === periodId) ?? PERIODS[2]
  return new Date(TODAY.getFullYear(), TODAY.getMonth() - (p.months - 1), 1).getTime()
}

export function casesInPeriod(periodId) {
  const start = periodStart(periodId)
  return db.cases.filter((c) => c.ts >= start)
}

// Same-length window immediately before the selected one, for deltas.
export function casesInPreviousPeriod(periodId) {
  const end = periodStart(periodId)
  const start = end - (TODAY.getTime() - end)
  return db.cases.filter((c) => c.ts >= start && c.ts < end)
}

export function monthKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthsList(periodId) {
  const p = PERIODS.find((x) => x.id === periodId) ?? PERIODS[2]
  const out = []
  for (let i = p.months - 1; i >= 0; i--) {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1)
    out.push({ key: monthKey(d.getTime()), label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }) })
  }
  return out
}

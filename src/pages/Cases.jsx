import { useMemo, useState } from 'react'
import { db, offenderById } from '../data/index.js'
import { CRIME_TYPES, STATIONS, CASE_STATUSES, BEAT_BY_ID, TYPE_BY_ID } from '../data/constants.js'
import { Card, StatusBadge, TypeChip, Avatar, Icon } from '../components/ui.jsx'
import { fmtDateTime, fmtINR, fmtInt, toCSV, download } from '../lib/format.js'

const PAGE = 25

export default function Cases({ query }) {
  const [q, setQ] = useState('')
  const [type, setType] = useState(query.type ?? 'all')
  const [station, setStation] = useState('all')
  const [status, setStatus] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const f = from ? new Date(from).getTime() : 0
    const t = to ? new Date(to).getTime() + 86400000 : Infinity
    return db.cases.filter((c) =>
      (type === 'all' || c.type === type) && (station === 'all' || c.station === station) && (status === 'all' || c.status === status) &&
      c.ts >= f && c.ts < t &&
      (!s || c.fir.toLowerCase().includes(s) || c.property.toLowerCase().includes(s) || BEAT_BY_ID[c.beat].name.toLowerCase().includes(s) ||
        c.accused.some((a) => offenderById[a].name.toLowerCase().includes(s) || (offenderById[a].alias ?? '').toLowerCase().includes(s))))
  }, [q, type, station, status, from, to])

  const pages = Math.max(1, Math.ceil(list.length / PAGE))
  const pg = Math.min(page, pages - 1)
  const value = list.reduce((s, c) => s + c.value, 0)
  const recovered = list.reduce((s, c) => s + c.recovered, 0)

  const exportCSV = () => {
    const rows = [['FIR', 'Station', 'Date', 'Crime type', 'Area', 'Accused', 'Status', 'Property', 'Value (INR)', 'Recovered (INR)', 'Vehicle used', 'Victim']]
    for (const c of list) rows.push([c.fir, c.station, fmtDateTime(c.date), TYPE_BY_ID[c.type].label, BEAT_BY_ID[c.beat].name,
      c.accused.map((a) => offenderById[a].name + (offenderById[a].alias ? ` @ ${offenderById[a].alias}` : '')).join('; ') || 'Not identified', CASE_STATUSES[c.status].label,
      c.property, c.value, c.recovered, c.vehicle, `${c.victim.gender}, ${c.victim.ageBand}`])
    download('pulianthope-cases.csv', toCSV(rows))
  }
  const reset = (fn) => (e) => { fn(e.target.value); setPage(0) }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Case Records</h2>
          <div className="ta">வழக்குப் பதிவுகள் · {fmtInt(list.length)} cases · property {fmtINR(value, true)} · recovered {fmtINR(recovered, true)}</div>
        </div>
        <span className="spacer" />
        <button className="btn primary" onClick={exportCSV}><Icon name="download" size={14} /> Export CSV</button>
      </div>

      <div className="filters">
        <input className="input" placeholder="FIR no., accused, area, property" value={q} onChange={reset(setQ)} style={{ width: 260 }} />
        <select className="select" value={type} onChange={reset(setType)}>
          <option value="all">All crime types</option>
          {CRIME_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select className="select" value={station} onChange={reset(setStation)}>
          <option value="all">All stations</option>
          {STATIONS.map((s) => <option key={s} value={s}>{s} PS</option>)}
        </select>
        <select className="select" value={status} onChange={reset(setStatus)}>
          <option value="all">All statuses</option>
          {Object.entries(CASE_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="small muted">From</span><input type="date" className="input" value={from} onChange={reset(setFrom)} />
        <span className="small muted">To</span><input type="date" className="input" value={to} onChange={reset(setTo)} />
      </div>

      <Card flush>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>FIR</th><th>Date & time</th><th>Crime</th><th>Area</th><th>Accused</th><th>Property</th><th className="num">Value</th><th className="num">Recovered</th><th>Status</th></tr></thead>
            <tbody>
              {list.slice(pg * PAGE, pg * PAGE + PAGE).map((c) => (
                <tr key={c.id}>
                  <td style={{ whiteSpace: 'nowrap' }}><div style={{ fontWeight: 600 }}>{c.fir}</div><div className="small muted">{c.station} PS</div></td>
                  <td className="mono t2" style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(c.date)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}><TypeChip type={c.type} /></td>
                  <td className="t2">{BEAT_BY_ID[c.beat].name}</td>
                  <td>
                    {c.accused.length ? (
                      <div className="col" style={{ gap: 4 }}>
                        {c.accused.map((a) => (
                          <a key={a} href={`#/offender/${a}`} className="row" style={{ gap: 6 }}>
                            <Avatar offender={offenderById[a]} size={22} round />
                            <span className="small" style={{ whiteSpace: 'nowrap' }}>{offenderById[a].name}</span>
                          </a>
                        ))}
                      </div>
                    ) : <span className="muted small">Not identified</span>}
                  </td>
                  <td className="small t2" style={{ minWidth: 200 }}>{c.property}<div className="muted">{c.vehicle} · victim {c.victim.gender.toLowerCase()}, {c.victim.ageBand}</div></td>
                  <td className="num">{fmtINR(c.value)}</td>
                  <td className="num" style={{ color: c.recovered ? 'var(--text)' : 'var(--muted)' }}>{c.recovered ? fmtINR(c.recovered) : '—'}</td>
                  <td><StatusBadge status={c.status} kind="case" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <div className="empty">No cases match these filters.</div>}
        </div>
        <div className="pager">
          <span>Showing {list.length ? pg * PAGE + 1 : 0}–{Math.min(list.length, pg * PAGE + PAGE)} of {fmtInt(list.length)}</span>
          <button className="btn" disabled={pg === 0} onClick={() => setPage(pg - 1)}>‹ Prev</button>
          <span>Page {pg + 1} / {pages}</span>
          <button className="btn" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>Next ›</button>
        </div>
      </Card>
    </div>
  )
}

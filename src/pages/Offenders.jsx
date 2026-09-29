import { useMemo, useState } from 'react'
import { db } from '../data/index.js'
import { CRIME_TYPES, TYPE_BY_ID, OFFENDER_STATUSES, GANGS, GANG_BY_ID, BEAT_BY_ID } from '../data/constants.js'
import { StatusBadge, TypeChip, Seg, RiskPill, openOffender } from '../components/ui.jsx'
import { photoOf } from '../lib/photos.js'
import { daysAgo } from '../lib/format.js'

const SORTS = [
  { id: 'risk', label: 'Risk' },
  { id: 'cases', label: 'Most cases' },
  { id: 'recent', label: 'Most recent' },
]

export default function Offenders({ query }) {
  const [q, setQ] = useState('')
  const [type, setType] = useState(query.type ?? 'all')
  const [status, setStatus] = useState(query.status ?? 'all')
  const [gang, setGang] = useState('all')
  const [hsOnly, setHsOnly] = useState(false)
  const [sort, setSort] = useState('risk')

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    let l = db.offenders.filter((o) =>
      (!s || o.name.toLowerCase().includes(s) || (o.alias ?? '').toLowerCase().includes(s) || o.id.toLowerCase().includes(s)) &&
      (type === 'all' || o.primaryType === type || o.secondaryType === type) &&
      (status === 'all' || o.status === status) &&
      (gang === 'all' || (gang === 'none' ? !o.gangId : o.gangId === gang)) &&
      (!hsOnly || o.historySheet))
    l = l.slice().sort((a, b) =>
      sort === 'risk' ? b.risk - a.risk : sort === 'cases' ? b.caseCount - a.caseCount : new Date(b.lastOffence ?? 0) - new Date(a.lastOffence ?? 0))
    return l
  }, [q, type, status, gang, hsOnly, sort])

  const counts = Object.fromEntries(Object.keys(OFFENDER_STATUSES).map((k) => [k, db.offenders.filter((o) => o.status === k).length]))

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Offender Directory</h2>
          <div className="ta">குற்றவாளிகள் · {list.length} of {db.offenders.length} shown</div>
        </div>
        <span className="spacer" />
        <Seg options={SORTS} value={sort} onChange={setSort} />
      </div>

      <div className="filters">
        <input className="input" placeholder="Filter by name, alias or ID" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
        <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All crime types</option>
          {CRIME_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(OFFENDER_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label} ({counts[k]})</option>)}
        </select>
        <select className="select" value={gang} onChange={(e) => setGang(e.target.value)}>
          <option value="all">All gangs</option>
          {GANGS.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          <option value="none">No known gang</option>
        </select>
        <label className="row small t2" style={{ gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={hsOnly} onChange={(e) => setHsOnly(e.target.checked)} /> History-sheeters only
        </label>
      </div>

      {list.length === 0 && <div className="card empty">No offenders match these filters.</div>}
      <div className="off-grid">
        {list.map((o) => {
          return (
            <div key={o.id} className="off-card" onClick={() => openOffender(o.id)}>
              <div className="ph">
                <img src={photoOf(o)} alt={o.name} loading="lazy" />
                <span className="id">{o.id}</span>
                <span className="risk"><RiskPill risk={o.risk} /></span>
                {o.historySheet && <span className="hs tag">{o.historySheet.no} · Cat {o.historySheet.category}</span>}
              </div>
              <div className="body">
                <div>
                  <div className="nm">{o.name}</div>
                  <div className="al">{o.alias && <>alias <b style={{ color: 'var(--text)', fontWeight: 600 }}>{o.alias}</b> · </>}{o.age} yrs · {o.father}</div>
                </div>
                <StatusBadge status={o.status} />
                <TypeChip type={o.primaryType} />
                <div className="small muted">{o.gangId ? GANG_BY_ID[o.gangId].name : 'No known gang'} · {BEAT_BY_ID[o.homeBeat].name}</div>
                <div className="meta">
                  <span><b style={{ color: 'var(--text)' }}>{o.caseCount}</b> cases</span>
                  <span>Last: {o.lastOffence ? daysAgo(o.lastOffence) : '—'}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

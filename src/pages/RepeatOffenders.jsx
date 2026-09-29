import { useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'
import { db, caseById } from '../data/index.js'
import { CRIME_TYPES, TYPE_BY_ID, TODAY } from '../data/constants.js'
import { Card, Kpi, StatusBadge, OffenderLink, ChartTip, RiskPill, openOffender } from '../components/ui.jsx'
import { fmtInt, fmtPct, daysAgo } from '../lib/format.js'

const DAY = 86400000
const BUCKETS = [
  { label: '≤ 15 days', max: 15 }, { label: '16–30', max: 30 }, { label: '31–60', max: 60 },
  { label: '61–90', max: 90 }, { label: '91–180', max: 180 }, { label: '181–365', max: 365 }, { label: '> 1 year', max: Infinity },
]

export default function RepeatOffenders() {
  const [type, setType] = useState('chain')
  const color = type === 'all' ? '#3987e5' : TYPE_BY_ID[type].color

  const rows = useMemo(() => db.offenders.map((o) => {
    const cs = o.caseIds.map((id) => caseById[id]).filter((c) => type === 'all' || c.type === type).sort((a, b) => a.ts - b.ts)
    const gaps = cs.slice(1).map((c, i) => (c.ts - cs[i].ts) / DAY)
    const last12 = cs.filter((c) => TODAY - c.ts < 365 * DAY).length
    const prev12 = cs.filter((c) => TODAY - c.ts >= 365 * DAY && TODAY - c.ts < 730 * DAY).length
    return { o, n: cs.length, gaps, avgGap: gaps.length ? gaps.reduce((s, g) => s + g, 0) / gaps.length : null, last12, prev12, last: cs[cs.length - 1] }
  }).filter((r) => r.n >= 2).sort((a, b) => b.n - a.n), [type])

  const allGaps = rows.flatMap((r) => r.gaps)
  const hist = BUCKETS.map((b, i) => ({ label: b.label, value: allGaps.filter((g) => g <= b.max && g > (i ? BUCKETS[i - 1].max : -1)).length }))
  const sortedGaps = allGaps.slice().sort((a, b) => a - b)
  const median = sortedGaps.length ? Math.round(sortedGaps[Math.floor(sortedGaps.length / 2)]) : null

  const typeCases = db.cases.filter((c) => type === 'all' || c.type === type)
  const detected = typeCases.filter((c) => c.accused.length)
  const top10 = rows.slice(0, 10)
  const top10Ids = new Set(top10.map((r) => r.o.id))
  const byTop10 = detected.filter((c) => c.accused.some((a) => top10Ids.has(a))).length
  const escalating = rows.filter((r) => r.last12 >= 3 && r.last12 > r.prev12 * 1.3).sort((a, b) => (b.last12 - b.prev12) - (a.last12 - a.prev12)).slice(0, 6)
  const pareto = rows.slice(0, 25).map((r) => ({ label: r.o.alias, value: r.n, id: r.o.id }))
  const label = type === 'all' ? 'all crimes' : TYPE_BY_ID[type].label.toLowerCase()

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Repeat Offender Analytics</h2>
          <div className="ta">தொடர் குற்றவாளிகள் · 3-year history</div>
        </div>
        <span className="spacer" />
        <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All crime types</option>
          {CRIME_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>

      <div className="grid g-kpi">
        <Kpi label={`Repeat offenders (2+ ${label})`} icon="repeat" color={color} value={fmtInt(rows.length)} />
        <Kpi label="Habitual (5+ cases)" icon="alert" color="var(--critical)" value={fmtInt(rows.filter((r) => r.n >= 5).length)} />
        <Kpi label="Solved cases linked to top 10" icon="users" color="var(--serious)" value={detected.length ? fmtPct(byTop10 / detected.length) : '—'} />
        <Kpi label="Median gap before re-offending" icon="clock" color="var(--gold)" value={median != null ? `${median} days` : '—'} />
        <Kpi label="Escalating this year" icon="trend" color="var(--warning)" value={fmtInt(escalating.length)} />
      </div>

      <div className="grid g-2">
        <Card title="Time between offences" hint={`How quickly repeat offenders strike again · ${label}`}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hist} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="22%">
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--axis)' }} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTip valueFmt={(v) => `${v} repeat offences`} />} />
              <Bar dataKey="value" name="Re-offences" fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Cases per offender" hint="Top 25 · click a bar to open the profile">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={pareto} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="16%">
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--axis)' }} interval={0} angle={-45} textAnchor="end" height={50} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTip valueFmt={(v) => `${v} cases`} />} />
              <Bar dataKey="value" name="Cases" radius={[4, 4, 0, 0]} isAnimationActive={false} onClick={(d) => openOffender(d.id)} style={{ cursor: 'pointer' }}>
                {pareto.map((p, i) => <Cell key={p.id} fill={color} fillOpacity={i < 10 ? 1 : 0.45} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid">
        <Card flush title={`Most frequent offenders · ${label}`} hint={`${rows.length} offenders with 2+ cases`}>
          <div className="tbl-wrap" style={{ maxHeight: 520 }}>
            <table className="tbl">
              <thead><tr><th>#</th><th>Offender</th><th className="num">Cases</th><th className="num">Last 12 mo</th><th className="num">Avg gap</th><th>Last offence</th><th>Status</th><th>Risk</th></tr></thead>
              <tbody>
                {rows.slice(0, 40).map((r, i) => (
                  <tr key={r.o.id} className="click" onClick={() => openOffender(r.o.id)}>
                    <td className="muted">{i + 1}</td>
                    <td><OffenderLink offender={r.o} sub={`${r.o.id} · ${TYPE_BY_ID[r.o.primaryType].label}`} size={32} /></td>
                    <td className="num"><b>{r.n}</b></td>
                    <td className="num">{r.last12}{r.last12 > r.prev12 && r.last12 >= 3 ? <span style={{ color: '#ff7b7b' }}> ▲</span> : ''}</td>
                    <td className="num">{r.avgGap != null ? `${Math.round(r.avgGap)} d` : '—'}</td>
                    <td className="t2">{daysAgo(r.last.date)}</td>
                    <td><StatusBadge status={r.o.status} /></td>
                    <td><RiskPill risk={r.o.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <div className="grid g-2">
          <Card title="Escalating offenders" hint="More cases in the last 12 months than the 12 before">
            <div className="col" style={{ gap: 10 }}>
              {escalating.map((r) => (
                <div key={r.o.id} className="row" style={{ justifyContent: 'space-between' }}>
                  <OffenderLink offender={r.o} sub={`${r.prev12} → ${r.last12} cases`} />
                  <StatusBadge status={r.o.status} />
                </div>
              ))}
              {!escalating.length && <span className="muted small">None for this crime type.</span>}
            </div>
          </Card>
          <Card title="Watch after release" hint="On bail, 3+ cases of this type">
            <div className="col" style={{ gap: 10 }}>
              {rows.filter((r) => r.o.status === 'bail' && r.n >= 3).sort((a, b) => new Date(b.o.statusSince) - new Date(a.o.statusSince)).slice(0, 6).map((r) => (
                <div key={r.o.id} className="row" style={{ justifyContent: 'space-between' }}>
                  <OffenderLink offender={r.o} sub={`Released ${daysAgo(r.o.statusSince)} · ${r.n} cases`} />
                  <RiskPill risk={r.o.risk} />
                </div>
              ))}
            </div>
          </Card>
      </div>
    </div>
  )
}

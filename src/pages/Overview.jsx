import { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { casesInPeriod, casesInPreviousPeriod, monthsList, monthKey, offenderById, db, PERIODS } from '../data/index.js'
import { CRIME_TYPES, TYPE_BY_ID, STATIONS, BEAT_BY_ID, CASE_STATUSES } from '../data/constants.js'
import { Card, Kpi, Legend, ChartTip, HBars, Seg, StatusBadge, TypeChip, OffenderLink, Avatar, RiskPill } from '../components/ui.jsx'
import { fmtInt, fmtINR, fmtPct, daysAgo } from '../lib/format.js'
import { go } from '../lib/router.js'

const rel = (a, b) => (b ? (a - b) / b : null)

export default function Overview({ period, setPeriod }) {
  const cases = useMemo(() => casesInPeriod(period), [period])
  const prev = useMemo(() => casesInPreviousPeriod(period), [period])

  const stats = useMemo(() => {
    const s = (list) => {
      const detected = list.filter((c) => c.accused.length).length
      const value = list.reduce((a, c) => a + c.value, 0)
      const recovered = list.reduce((a, c) => a + c.recovered, 0)
      const chain = list.filter((c) => c.type === 'chain').length
      const perOff = {}
      for (const c of list) for (const a of c.accused) perOff[a] = (perOff[a] ?? 0) + 1
      const repeaters = Object.values(perOff).filter((n) => n >= 3).length
      return { total: list.length, detected, detRate: list.length ? detected / list.length : 0, value, recovered, recRate: value ? recovered / value : 0, chain, repeaters, perOff }
    }
    return { cur: s(cases), prev: s(prev) }
  }, [cases, prev])

  const months = monthsList(period)
  const trend = useMemo(() => {
    const rows = Object.fromEntries(months.map((m) => [m.key, { label: m.label, ...Object.fromEntries(CRIME_TYPES.map((t) => [t.id, 0])) }]))
    for (const c of cases) { const r = rows[monthKey(c.ts)]; if (r) r[c.type]++ }
    return Object.values(rows)
  }, [cases, period])

  const byType = CRIME_TYPES.map((t) => ({ label: t.label, value: cases.filter((c) => c.type === t.id).length, color: t.color, id: t.id }))
    .sort((a, b) => b.value - a.value)
  const byStation = STATIONS.map((s) => ({ label: `${s} PS`, value: cases.filter((c) => c.station === s).length })).sort((a, b) => b.value - a.value)
  const byStatus = Object.entries(CASE_STATUSES).map(([k, v]) => ({ label: v.label, value: cases.filter((c) => c.status === k).length }))

  const topOffenders = Object.entries(stats.cur.perOff).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, n]) => ({ o: offenderById[id], n }))
  const absconding = db.offenders.filter((o) => o.status === 'absconding').length
  const periodLabel = PERIODS.find((p) => p.id === period).label

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Command Overview</h2>
          <div className="ta">மேலோட்டம் · last {periodLabel}</div>
        </div>
        <span className="spacer" />
        <Seg options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      <div className="grid g-kpi">
        <Kpi label="Total cases (FIRs)" icon="file" value={fmtInt(stats.cur.total)} delta={rel(stats.cur.total, stats.prev.total)} />
        <Kpi label="Chain snatching" icon="alert" color={TYPE_BY_ID.chain.color} value={fmtInt(stats.cur.chain)} delta={rel(stats.cur.chain, stats.prev.chain)} />
        <Kpi label="Detection rate" icon="check" color="var(--good)" value={fmtPct(stats.cur.detRate)} delta={rel(stats.cur.detRate, stats.prev.detRate)} deltaGoodWhenDown={false} />
        <Kpi label="Property recovered" icon="rupee" color="var(--gold)" value={fmtINR(stats.cur.recovered, true)} delta={rel(stats.cur.recRate, stats.prev.recRate)} deltaGoodWhenDown={false} />
        <Kpi label="Repeat offenders (3+)" icon="repeat" color="var(--serious)" value={fmtInt(stats.cur.repeaters)} delta={rel(stats.cur.repeaters, stats.prev.repeaters)} />
        <Kpi label="Absconding now" icon="users" color="var(--critical)" value={fmtInt(absconding)} />
      </div>

      <div className="grid g-2-1">
        <Card title="Cases per month by crime type" hint="Hover a bar for the breakdown">
          <Legend items={CRIME_TYPES.map((t) => ({ label: t.label, color: t.color }))} />
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="18%">
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--axis)' }} interval="preserveStartEnd" minTickGap={10} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTip labelFmt={(l, p) => `${l} · ${p.reduce((s, x) => s + x.value, 0)} cases`} />} />
              {CRIME_TYPES.map((t, i) => (
                <Bar key={t.id} dataKey={t.id} name={t.label} stackId="a" fill={t.color} stroke="var(--panel)" strokeWidth={1}
                  radius={i === CRIME_TYPES.length - 1 ? [4, 4, 0, 0] : 0} isAnimationActive={false} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Crime type breakdown" hint="Click to open hotspots">
          <HBars rows={byType} onClick={(r) => go(`hotspots?type=${r.id}`)} />
          <div style={{ height: 18 }} />
          <div className="card-head" style={{ marginBottom: 8 }}><h3>By police station</h3></div>
          <HBars rows={byStation} />
        </Card>
      </div>

      <div className="grid g-3">
        <Card title="Top offenders this period" right={<a className="small muted" href="#/repeat">View all →</a>}>
          <div className="col" style={{ gap: 10 }}>
            {topOffenders.map(({ o, n }) => (
              <div className="row" key={o.id} style={{ justifyContent: 'space-between' }}>
                <OffenderLink offender={o} sub={`${TYPE_BY_ID[o.primaryType].label} · ${n} cases`} />
                <RiskPill risk={o.risk} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="Latest cases" right={<a className="small muted" href="#/cases">All cases →</a>}>
          <div className="col" style={{ gap: 10 }}>
            {cases.slice(0, 7).map((c) => (
              <div key={c.id} className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="col" style={{ gap: 2 }}>
                  <TypeChip type={c.type} />
                  <span className="small muted">{BEAT_BY_ID[c.beat].name} · {daysAgo(c.date)}</span>
                </div>
                <div className="row" style={{ gap: 4 }}>
                  {c.accused.slice(0, 2).map((a) => <Avatar key={a} offender={offenderById[a]} size={26} round />)}
                  {!c.accused.length && <span className="small muted">Unknown accused</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Case status">
          <HBars rows={byStatus} max={cases.length} fmt={(v) => `${v} · ${fmtPct(v / Math.max(1, cases.length))}`} />
          <div className="small muted" style={{ marginTop: 14 }}>
            Property stolen {fmtINR(stats.cur.value, true)} · recovered {fmtINR(stats.cur.recovered, true)} ({fmtPct(stats.cur.recRate)})
          </div>
        </Card>
      </div>
    </div>
  )
}

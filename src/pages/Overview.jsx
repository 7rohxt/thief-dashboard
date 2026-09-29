import { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { casesInPeriod, casesInPreviousPeriod, monthsList, monthKey, offenderById, db, PERIODS } from '../data/index.js'
import { CRIME_TYPES, TYPE_BY_ID, STATIONS, BEATS, BEAT_BY_ID, CASE_STATUSES } from '../data/constants.js'
import { ALERTS } from '../data/alerts.js'
import { Card, Kpi, Legend, ChartTip, HBars, Seg, StatusBadge, TypeChip, Avatar, RiskPill, Icon, TONES } from '../components/ui.jsx'
import { BaseMap, HotSpot, BOUNDARY_BOUNDS } from '../components/CaseMap.jsx'
import Heatmap from '../components/Heatmap.jsx'
import { fmtInt, fmtINR, fmtPct, daysAgo } from '../lib/format.js'
import { go } from '../lib/router.js'

const rel = (a, b) => (b ? (a - b) / b : null)
const More = ({ to, label = 'View all' }) => <a className="small" style={{ color: 'var(--accent)', fontWeight: 500 }} href={`#/${to}`}>{label} →</a>

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
      return { total: list.length, detRate: list.length ? detected / list.length : 0, value, recovered, recRate: value ? recovered / value : 0, chain, repeaters, perOff }
    }
    return { cur: s(cases), prev: s(prev) }
  }, [cases, prev])

  const months = monthsList(period)
  const trend = useMemo(() => {
    const rows = Object.fromEntries(months.map((m) => [m.key, { label: m.label, ...Object.fromEntries(CRIME_TYPES.map((t) => [t.id, 0])) }]))
    for (const c of cases) { const r = rows[monthKey(c.ts)]; if (r) r[c.type]++ }
    return Object.values(rows)
  }, [cases, period])

  const byType = CRIME_TYPES.map((t) => ({ label: t.label, value: cases.filter((c) => c.type === t.id).length, color: t.color, id: t.id })).sort((a, b) => b.value - a.value)
  const byStation = STATIONS.map((s) => ({ label: `${s} PS`, value: cases.filter((c) => c.station === s).length })).sort((a, b) => b.value - a.value)
  const byStatus = Object.entries(CASE_STATUSES).map(([k, v]) => ({ label: v.label, value: cases.filter((c) => c.status === k).length }))
  const beatCounts = BEATS.map((b) => ({ beat: b, n: cases.filter((c) => c.beat === b.id).length, p: prev.filter((c) => c.beat === b.id).length })).sort((a, b) => b.n - a.n)
  const maxBeat = beatCounts[0]?.n ?? 0
  const minBeat = beatCounts[beatCounts.length - 1]?.n ?? 0

  const topOffenders = Object.entries(stats.cur.perOff).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, n]) => ({ o: offenderById[id], n }))
  const repeatChain = db.offenders.map((o) => ({ o, n: cases.filter((c) => c.type === 'chain' && c.accused.includes(o.id)).length }))
    .filter((r) => r.n >= 2).sort((a, b) => b.n - a.n).slice(0, 5)
  const absconding = db.offenders.filter((o) => o.status === 'absconding').length
  const critical = ALERTS.filter((a) => a.tone === 'critical')
  const periodLabel = PERIODS.find((p) => p.id === period).label

  return (
    <div className="page compact">
      <div className="page-head">
        <div>
          <h2>Command Overview</h2>
          <div className="ta">மேலோட்டம் · last {periodLabel}</div>
        </div>
        <span className="spacer" />
        <Seg options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      {/* Row 1: headline numbers */}
      <div className="grid g-kpi">
        <Kpi label="Total cases" icon="file" value={fmtInt(stats.cur.total)} delta={rel(stats.cur.total, stats.prev.total)} />
        <Kpi label="Chain snatching" icon="alert" color={TYPE_BY_ID.chain.color} value={fmtInt(stats.cur.chain)} delta={rel(stats.cur.chain, stats.prev.chain)} />
        <Kpi label="Detection rate" icon="check" color="var(--good)" value={fmtPct(stats.cur.detRate)} delta={rel(stats.cur.detRate, stats.prev.detRate)} deltaGoodWhenDown={false} />
        <Kpi label="Recovered" icon="rupee" color="#b88400" value={fmtINR(stats.cur.recovered, true)} delta={rel(stats.cur.recRate, stats.prev.recRate)} deltaGoodWhenDown={false} />
        <Kpi label="Repeat offenders (3+)" icon="repeat" color="var(--serious)" value={fmtInt(stats.cur.repeaters)} delta={rel(stats.cur.repeaters, stats.prev.repeaters)} />
        <Kpi label="Absconding now" icon="users" color="var(--critical)" value={fmtInt(absconding)} />
      </div>

      {/* Row 2: trend + hotspot map */}
      <div className="grid g-2-1">
        <Card title="Cases per month by crime type" right={<More to="cases" label="Case records" />}>
          <Legend items={CRIME_TYPES.map((t) => ({ label: t.label, color: t.color }))} />
          <ResponsiveContainer width="100%" height={262}>
            <BarChart data={trend} margin={{ top: 6, right: 6, left: -20, bottom: 0 }} barCategoryGap="18%">
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--axis)' }} interval="preserveStartEnd" minTickGap={10} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(16,24,40,0.04)' }} content={<ChartTip labelFmt={(l, p) => `${l} · ${p.reduce((s, x) => s + x.value, 0)} cases`} />} />
              {CRIME_TYPES.map((t, i) => (
                <Bar key={t.id} dataKey={t.id} name={t.label} stackId="a" fill={t.color} stroke="var(--panel)" strokeWidth={1}
                  radius={i === CRIME_TYPES.length - 1 ? [4, 4, 0, 0] : 0} isAnimationActive={false} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Hotspots" hint="click a circle" right={<More to="hotspots" label="Open map" />}>
          <BaseMap height={232} bounds={BOUNDARY_BOUNDS}>
            {beatCounts.map(({ beat, n }) => <HotSpot key={beat.id} beat={beat} count={n} max={maxBeat} min={minBeat} onClick={(b) => go(`hotspots?beat=${b.id}`)} />)}
          </BaseMap>
          <div className="mini-list" style={{ marginTop: 10 }}>
            {beatCounts.slice(0, 3).map(({ beat, n, p }, i) => {
              const ch = p ? (n - p) / p : null
              return (
                <a key={beat.id} className="row" href={`#/hotspots?beat=${beat.id}`} style={{ justifyContent: 'space-between' }}>
                  <span className="row" style={{ gap: 8 }}><span className="rank">{i + 1}</span><span>{beat.name}</span></span>
                  <span className="row" style={{ gap: 8 }}>
                    <b className="mono">{n}</b>
                    <span className="small mono" style={{ width: 44, textAlign: 'right', color: ch == null ? 'var(--muted)' : ch > 0.1 ? 'var(--critical)' : ch < -0.1 ? 'var(--good)' : 'var(--muted)' }}>
                      {ch == null ? '—' : `${ch > 0 ? '↑' : ch < 0 ? '↓' : ''}${Math.abs(ch * 100).toFixed(0)}%`}
                    </span>
                  </span>
                </a>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Row 3: offenders + timing + crime mix */}
      <div className="grid g-3">
        <Card title="Most frequent offenders" hint="this period" right={<More to="repeat" />}>
          <div className="mini-list">
            {topOffenders.map(({ o, n }) => (
              <a key={o.id} className="row" href={`#/offender/${o.id}`} style={{ justifyContent: 'space-between' }}>
                <span className="row" style={{ gap: 10, minWidth: 0 }}>
                  <Avatar offender={o} size={34} />
                  <span className="col" style={{ gap: 0, minWidth: 0 }}>
                    <span className="ellipsis" style={{ fontWeight: 600 }}>{o.name}</span>
                    <span className="muted small">{TYPE_BY_ID[o.primaryType].label} · <b style={{ color: 'var(--text)' }}>{n}</b> cases</span>
                  </span>
                </span>
                <RiskPill risk={o.risk} />
              </a>
            ))}
          </div>
        </Card>
        <Card title="When crimes happen" hint="day × hour" right={<More to="hotspots" label="Patterns" />}>
          <Heatmap cases={cases} compact />
          <div className="card-head" style={{ margin: '16px 0 10px' }}><h3>Repeat chain snatchers</h3></div>
          <div className="mini-list">
            {repeatChain.slice(0, 3).map(({ o, n }) => (
              <a key={o.id} className="row" href={`#/offender/${o.id}`} style={{ justifyContent: 'space-between' }}>
                <span className="row" style={{ gap: 8 }}><Avatar offender={o} size={26} round /><span>{o.name}</span></span>
                <span className="small"><b>{n}</b> <span className="muted">snatches</span></span>
              </a>
            ))}
          </div>
        </Card>
        <Card title="Crime type breakdown" right={<More to="hotspots" label="By area" />}>
          <HBars rows={byType} onClick={(r) => go(`hotspots?type=${r.id}`)} />
          <div className="card-head" style={{ margin: '16px 0 10px' }}><h3>By police station</h3></div>
          <HBars rows={byStation} />
        </Card>
      </div>

      {/* Row 4: alerts + latest cases + status */}
      <div className="grid g-3">
        <Card title="Critical alerts" hint={`${critical.length} open`} right={<More to="alerts" />}>
          <div className="mini-list">
            {critical.slice(0, 5).map((a) => (
              <a key={a.id} className="row" href={`#/${a.link}`} style={{ alignItems: 'flex-start', gap: 10 }}>
                {a.offender
                  ? <Avatar offender={offenderById[a.offender]} size={30} />
                  : <span style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: TONES.critical.bg, color: TONES.critical.c, flex: 'none' }}><Icon name={a.icon} size={15} /></span>}
                <span className="col" style={{ gap: 0, minWidth: 0 }}>
                  <span className="small" style={{ color: 'var(--critical)', fontWeight: 600 }}>{a.kind}</span>
                  <span className="ellipsis" style={{ fontSize: 13 }}>{a.title}</span>
                </span>
              </a>
            ))}
          </div>
        </Card>
        <Card title="Latest cases" right={<More to="cases" />}>
          <div className="mini-list">
            {cases.slice(0, 6).map((c) => (
              <div key={c.id} className="row" style={{ justifyContent: 'space-between' }}>
                <div className="col" style={{ gap: 0, minWidth: 0 }}>
                  <TypeChip type={c.type} />
                  <span className="small muted ellipsis">{BEAT_BY_ID[c.beat].name} · {daysAgo(c.date)}</span>
                </div>
                <div className="row" style={{ gap: 4 }}>
                  {c.accused.slice(0, 2).map((a) => <a key={a} href={`#/offender/${a}`}><Avatar offender={offenderById[a]} size={24} round /></a>)}
                  {!c.accused.length && <span className="small muted">Unknown</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Case status">
          <HBars rows={byStatus} max={cases.length} fmt={(v) => `${v} · ${fmtPct(v / Math.max(1, cases.length))}`} />
          <div className="stat-pair">
            <div><div className="small muted">Property stolen</div><div className="big">{fmtINR(stats.cur.value, true)}</div></div>
            <div><div className="small muted">Recovered</div><div className="big">{fmtINR(stats.cur.recovered, true)} <span className="small muted">({fmtPct(stats.cur.recRate)})</span></div></div>
          </div>
        </Card>
      </div>
    </div>
  )
}

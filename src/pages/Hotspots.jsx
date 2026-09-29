import { Fragment, useMemo, useState } from 'react'
import { casesInPeriod, casesInPreviousPeriod, offenderById, PERIODS } from '../data/index.js'
import { CRIME_TYPES, TYPE_BY_ID, BEATS, BEAT_BY_ID } from '../data/constants.js'
import { Card, Seg, HBars, OffenderLink, Icon } from '../components/ui.jsx'
import { BaseMap, CaseDot, BeatBubble } from '../components/CaseMap.jsx'
import { WEEKDAYS, hourLabel, fmtPct } from '../lib/format.js'

// Sequential single-hue ramp (blue) stepped for the dark surface: low = recedes, high = bright.
const RAMP = ['#16233a', '#104281', '#184f95', '#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#5598e7', '#86b6ef', '#cde2fb']
const rampColor = (v, max) => (v === 0 ? 'rgba(255,255,255,0.03)' : RAMP[Math.min(RAMP.length - 1, 1 + Math.floor((v / Math.max(1, max)) * (RAMP.length - 2)))])

export default function Hotspots({ period, setPeriod, query }) {
  const [type, setType] = useState(query.type ?? 'all')
  const [view, setView] = useState('areas')
  const [beatSel, setBeatSel] = useState(query.beat ?? null)

  const all = useMemo(() => casesInPeriod(period), [period])
  const prevAll = useMemo(() => casesInPreviousPeriod(period), [period])
  const cases = useMemo(() => all.filter((c) => type === 'all' || c.type === type), [all, type])
  const prev = useMemo(() => prevAll.filter((c) => type === 'all' || c.type === type), [prevAll, type])
  const scoped = beatSel ? cases.filter((c) => c.beat === beatSel) : cases
  const color = type === 'all' ? '#e66767' : TYPE_BY_ID[type].color

  const beatCounts = BEATS.map((b) => ({ beat: b, n: cases.filter((c) => c.beat === b.id).length, p: prev.filter((c) => c.beat === b.id).length }))
  const maxBeat = Math.max(...beatCounts.map((b) => b.n))
  const minBeat = Math.min(...beatCounts.map((b) => b.n))

  const heat = useMemo(() => {
    const m = Array.from({ length: 7 }, () => Array(24).fill(0))
    for (const c of scoped) m[c.weekday][c.hour]++
    return m
  }, [scoped])
  const heatMax = Math.max(...heat.flat())

  const tally = (fn) => {
    const t = {}
    for (const c of scoped) { const k = fn(c); t[k] = (t[k] ?? 0) + 1 }
    return Object.entries(t).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))
  }
  const vehicles = tally((c) => c.vehicle).map((r) => ({ ...r, color }))
  const victimsAge = ['18-30', '31-45', '46-60', '60+'].map((b) => ({ label: `Age ${b}`, value: scoped.filter((c) => c.victim.ageBand === b).length }))
  const female = scoped.filter((c) => c.victim.gender === 'Female').length
  const offCounts = {}
  for (const c of scoped) for (const a of c.accused) offCounts[a] = (offCounts[a] ?? 0) + 1
  const topHere = Object.entries(offCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const typeMix = CRIME_TYPES.map((t) => ({ label: t.label, value: scoped.filter((c) => c.type === t.id).length, color: t.color })).filter((r) => r.value).sort((a, b) => b.value - a.value)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Hotspots & Patterns</h2>
          <div className="ta">குற்றப் பகுதிகள் · {cases.length} cases{type !== 'all' ? ` of ${TYPE_BY_ID[type].label.toLowerCase()}` : ''}</div>
        </div>
        <span className="spacer" />
        <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All crime types</option>
          {CRIME_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <Seg options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      <div className="grid g-2-1">
        <Card title="Crime map" hint="Click an area to focus all charts on it"
          right={<Seg options={[{ id: 'areas', label: 'Areas' }, { id: 'cases', label: 'Each case' }]} value={view} onChange={setView} />}>
          <BaseMap height={470} bounds={BEATS.map((b) => [b.lat, b.lng])}>
            {view === 'areas'
              ? beatCounts.map(({ beat, n }) => <BeatBubble key={beat.id} beat={beat} count={n} max={maxBeat} min={minBeat} color={beatSel === beat.id ? '#ffffff' : color} onClick={(b) => setBeatSel(beatSel === b.id ? null : b.id)} />)
              : scoped.map((c) => <CaseDot key={c.id} c={c} />)}
          </BaseMap>
          {view === 'cases' && type === 'all' && (
            <div className="legend" style={{ marginTop: 10 }}>
              {CRIME_TYPES.map((t) => <span key={t.id} className="chip"><span className="sw" style={{ background: t.color, borderRadius: '50%' }} />{t.label}</span>)}
            </div>
          )}
        </Card>
        <Card flush title="Areas ranked" hint="vs previous period">
          <div className="tbl-wrap" style={{ maxHeight: 500 }}>
            <table className="tbl">
              <thead><tr><th>Area</th><th className="num">Cases</th><th className="num">Change</th></tr></thead>
              <tbody>
                {beatCounts.slice().sort((a, b) => b.n - a.n).map(({ beat, n, p }) => {
                  const ch = p ? (n - p) / p : null
                  return (
                    <tr key={beat.id} className="click" onClick={() => setBeatSel(beatSel === beat.id ? null : beat.id)} style={beatSel === beat.id ? { outline: '1px solid var(--gold)' } : undefined}>
                      <td><div>{beat.name}</div><div className="small muted">{beat.station} PS</div></td>
                      <td className="num"><b>{n}</b></td>
                      <td className="num" style={{ color: ch == null ? 'var(--muted)' : ch > 0.1 ? '#ff7b7b' : ch < -0.1 ? '#3ccf5a' : 'var(--text-2)' }}>
                        {ch == null ? '—' : `${ch > 0 ? '▲' : ch < 0 ? '▼' : ''} ${Math.abs(ch * 100).toFixed(0)}%`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {beatSel && (
        <div className="card row" style={{ justifyContent: 'space-between', borderColor: 'var(--gold)' }}>
          <span><Icon name="map" size={14} /> Focused on <b>{BEAT_BY_ID[beatSel].name}</b> ({BEAT_BY_ID[beatSel].station} PS) · {scoped.length} cases</span>
          <button className="btn" onClick={() => setBeatSel(null)}>Clear focus</button>
        </div>
      )}

      <Card title="When crimes happen" hint="Day of week × hour · darker = fewer, brighter = more">
        <div className="heat">
          <span />
          {Array.from({ length: 24 }, (_, h) => <span key={h} className="hl">{h % 3 === 0 ? hourLabel(h) : ''}</span>)}
          {heat.map((row, d) => (
            <Fragment key={d}>
              <span className="lab">{WEEKDAYS[d]}</span>
              {row.map((v, h) => <span key={`${d}-${h}`} className="cell" style={{ background: rampColor(v, heatMax) }} title={`${WEEKDAYS[d]} ${hourLabel(h)}–${hourLabel((h + 1) % 24)}: ${v} cases`} />)}
            </Fragment>
          ))}
        </div>
        <div className="row small muted" style={{ marginTop: 10, gap: 6 }}>
          <span>Fewer</span>
          {RAMP.slice(1).map((c) => <span key={c} style={{ width: 22, height: 10, background: c, borderRadius: 2 }} />)}
          <span>More (max {heatMax} in one slot)</span>
        </div>
      </Card>

      <div className="grid g-3">
        <Card title="Crime mix">
          <HBars rows={typeMix} />
        </Card>
        <Card title="How offenders moved">
          <HBars rows={vehicles} fmt={(v) => fmtPct(v / Math.max(1, scoped.length))} />
          <div style={{ height: 16 }} />
          <div className="card-head" style={{ marginBottom: 8 }}><h3>Victims</h3><span className="hint">{fmtPct(female / Math.max(1, scoped.length))} women</span></div>
          <HBars rows={victimsAge} />
        </Card>
        <Card title="Most active offenders here">
          <div className="col" style={{ gap: 10 }}>
            {topHere.map(([id, n]) => <OffenderLink key={id} offender={offenderById[id]} sub={`${n} cases in this selection`} />)}
            {!topHere.length && <span className="muted small">No identified offenders.</span>}
          </div>
        </Card>
      </div>
    </div>
  )
}

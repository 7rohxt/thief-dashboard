import { useMemo, useState } from 'react'
import { casesInPeriod, casesInPreviousPeriod, offenderById, PERIODS } from '../data/index.js'
import { CRIME_TYPES, TYPE_BY_ID, BEATS, BEAT_BY_ID } from '../data/constants.js'
import { Card, Seg, HBars, OffenderLink, Icon } from '../components/ui.jsx'
import { BaseMap, CaseDot, HotSpot, BOUNDARY_BOUNDS } from '../components/CaseMap.jsx'
import { fmtPct } from '../lib/format.js'
import Heatmap from '../components/Heatmap.jsx'

export default function Hotspots({ period, setPeriod, query }) {
  const [type, setType] = useState(query.type ?? 'all')
  const [view, setView] = useState('areas')
  const [beatSel, setBeatSel] = useState(query.beat ?? null)

  const all = useMemo(() => casesInPeriod(period), [period])
  const prevAll = useMemo(() => casesInPreviousPeriod(period), [period])
  const cases = useMemo(() => all.filter((c) => type === 'all' || c.type === type), [all, type])
  const prev = useMemo(() => prevAll.filter((c) => type === 'all' || c.type === type), [prevAll, type])
  const scoped = beatSel ? cases.filter((c) => c.beat === beatSel) : cases
  const color = type === 'all' ? '#e34948' : TYPE_BY_ID[type].color

  const beatCounts = BEATS.map((b) => ({ beat: b, n: cases.filter((c) => c.beat === b.id).length, p: prev.filter((c) => c.beat === b.id).length }))
  const maxBeat = Math.max(...beatCounts.map((b) => b.n))
  const minBeat = Math.min(...beatCounts.map((b) => b.n))


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
          <BaseMap height={500} bounds={BOUNDARY_BOUNDS}>
            {view === 'areas'
              ? beatCounts.map(({ beat, n }) => <HotSpot key={beat.id} beat={beat} count={n} max={maxBeat} min={minBeat} selected={beatSel === beat.id} onClick={(b) => setBeatSel(beatSel === b.id ? null : b.id)} />)
              : scoped.map((c) => <CaseDot key={c.id} c={c} />)}
          </BaseMap>
          {view === 'areas' && (
            <div className="row small muted" style={{ marginTop: 10, gap: 6 }}>
              <span>Fewer cases</span>
              {['#fcae91', '#fb6a4a', '#ef3b2c', '#cb181d', '#99000d'].map((c) => <span key={c} style={{ width: 22, height: 10, background: c, borderRadius: 2 }} />)}
              <span>More cases</span>
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, borderTop: '2px dashed #c8102e' }} /> Pulianthope boundary (approx.)</span>
            </div>
          )}
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
                    <tr key={beat.id} className="click" onClick={() => setBeatSel(beatSel === beat.id ? null : beat.id)} style={beatSel === beat.id ? { background: 'var(--brand-soft)' } : undefined}>
                      <td><div>{beat.name}</div><div className="small muted">{beat.station} PS</div></td>
                      <td className="num"><b>{n}</b></td>
                      <td className="num" style={{ color: ch == null ? 'var(--muted)' : ch > 0.1 ? 'var(--critical)' : ch < -0.1 ? 'var(--good)' : 'var(--text-2)' }}>
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
        <div className="card row" style={{ justifyContent: 'space-between', borderColor: '#c7d4f1', background: 'var(--brand-soft)' }}>
          <span><Icon name="map" size={14} /> Focused on <b>{BEAT_BY_ID[beatSel].name}</b> ({BEAT_BY_ID[beatSel].station} PS) · {scoped.length} cases</span>
          <button className="btn" onClick={() => setBeatSel(null)}>Clear focus</button>
        </div>
      )}

      <Card title="When crimes happen" hint="Day of week × hour · darker = more cases">
        <Heatmap cases={scoped} />
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

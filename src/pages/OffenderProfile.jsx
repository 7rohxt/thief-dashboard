import { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { offenderById, caseById } from '../data/index.js'
import { TYPE_BY_ID, GANG_BY_ID, BEAT_BY_ID, OFFENDER_STATUSES, CRIME_TYPES, TODAY } from '../data/constants.js'
import { Card, Kpi, StatusBadge, TypeChip, OffenderLink, Icon, HBars, ChartTip, Legend, RiskPill } from '../components/ui.jsx'
import { BaseMap, CaseDot } from '../components/CaseMap.jsx'
import { photoOf } from '../lib/photos.js'
import { fmtDate, fmtDateTime, fmtINR, fmtInt, daysAgo } from '../lib/format.js'

export default function OffenderProfile({ id }) {
  const o = offenderById[id]
  const cases = useMemo(() => (o ? o.caseIds.map((cid) => caseById[cid]) : []), [id])
  const years = useMemo(() => {
    const ys = {}
    for (const c of cases) {
      const y = new Date(c.date).getFullYear()
      ys[y] = ys[y] ?? { label: String(y), ...Object.fromEntries(CRIME_TYPES.map((t) => [t.id, 0])) }
      ys[y][c.type]++
    }
    return Object.values(ys).sort((a, b) => a.label - b.label)
  }, [cases])
  if (!o) return <div className="page"><div className="card empty">Offender {id} not found.</div></div>

  const typesUsed = CRIME_TYPES.filter((t) => o.typeCounts[t.id])
  const avgGap = o.gaps.length ? Math.round(o.gaps.reduce((s, g) => s + g, 0) / o.gaps.length) : null
  const recovered = cases.reduce((s, c) => s + c.recovered, 0)
  const beats = {}
  for (const c of cases) beats[c.beat] = (beats[c.beat] ?? 0) + 1
  const beatRows = Object.entries(beats).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([b, n]) => ({ label: BEAT_BY_ID[b].name, value: n }))
  const hours = Array.from({ length: 24 }, () => 0)
  for (const c of cases) hours[c.hour]++
  const peak = hours.indexOf(Math.max(...hours))
  const center = cases.length ? [cases.reduce((s, c) => s + c.lat, 0) / cases.length, cases.reduce((s, c) => s + c.lng, 0) / cases.length] : undefined

  const fact = (k, v) => <div><div className="k">{k}</div><div className="v">{v}</div></div>

  return (
    <div className="page">
      <div className="page-head">
        <a className="btn" href="#/offenders"><Icon name="back" size={14} /> Offenders</a>
        <span className="spacer" />
        <button className="btn" onClick={() => window.print()}><Icon name="download" size={14} /> Print dossier</button>
      </div>

      <div className="card profile-top">
        <div className="mug">
          <img src={photoOf(o)} alt={o.name} />
          <div className="cap">{o.id}{o.historySheet ? ` · ${o.historySheet.no}` : ''}</div>
        </div>
        <div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 26 }}>{o.name}</h2>
            <span className="t2" style={{ fontSize: 16 }}>alias <b style={{ color: 'var(--text)' }}>{o.alias}</b></span>
            <StatusBadge status={o.status} />
            <RiskPill risk={o.risk} />
            {o.historySheet && <span className="tag">History-sheeter · Cat {o.historySheet.category}</span>}
            {o.nbw && <span className="badge" style={{ background: 'var(--critical-bg)', color: 'var(--critical)' }}><Icon name="alert" size={12} /> NBW issued</span>}
          </div>
          <div className="t2" style={{ marginTop: 6 }}>{o.father} · {o.age} yrs · {o.mo}</div>
          <div className="facts">
            {fact('Primary crime', <TypeChip type={o.primaryType} />)}
            {fact('Secondary crime', <TypeChip type={o.secondaryType} />)}
            {fact('Gang', o.gangId ? GANG_BY_ID[o.gangId].name : 'No known gang')}
            {fact('Home area', BEAT_BY_ID[o.homeBeat].name)}
            {fact('Height / build', `${o.heightCm} cm · ${o.build}`)}
            {fact('Identifying marks', o.marks.join('; '))}
            {fact('First offence at age', o.firstOffenceAge)}
            {fact(`${OFFENDER_STATUSES[o.status].label} since`, fmtDate(o.statusSince))}
            {o.bailCondition && fact('Bail condition', o.bailCondition)}
            {o.nextCheck && fact('Next HS check', fmtDate(o.nextCheck))}
          </div>
        </div>
      </div>

      <div className="grid g-kpi">
        <Kpi label="Cases on record" icon="file" value={fmtInt(o.caseCount)} />
        <Kpi label="Property involved" icon="rupee" color="#b88400" value={fmtINR(o.propertyValue, true)} />
        <Kpi label="Recovered" icon="check" color="var(--good)" value={fmtINR(recovered, true)} />
        <Kpi label="Avg gap between offences" icon="repeat" color="var(--serious)" value={avgGap != null ? `${avgGap} days` : '—'} />
        <Kpi label="Usual time" icon="clock" color="var(--accent)" value={cases.length ? `${((peak + 11) % 12) + 1}${peak < 12 ? ' AM' : ' PM'}` : '—'} />
      </div>

      <div className="grid g-2">
        <Card title="Offences per year">
          {typesUsed.length > 1 && <Legend items={typesUsed.map((t) => ({ label: t.label, color: t.color }))} />}
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={years} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--axis)' }} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(16,24,40,0.04)' }} content={<ChartTip />} />
              {typesUsed.map((t, i) => (
                <Bar key={t.id} dataKey={t.id} name={t.label} stackId="a" fill={t.color} stroke="var(--panel)" strokeWidth={1}
                  radius={i === typesUsed.length - 1 ? [4, 4, 0, 0] : 0} isAnimationActive={false} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Where they operate" hint="Top areas by case count">
          <HBars rows={beatRows} />
          <div style={{ marginTop: 16 }} className="card-head"><h3>Known associates</h3><span className="hint">co-accused</span></div>
          <div className="col" style={{ gap: 8 }}>
            {o.associates.slice(0, 5).map((a) => (
              <OffenderLink key={a.id} offender={offenderById[a.id]} size={30} sub={`${a.count} joint case${a.count === 1 ? '' : 's'} · ${OFFENDER_STATUSES[offenderById[a.id].status].label}`} />
            ))}
            {!o.associates.length && <span className="muted small">No co-accused on record.</span>}
          </div>
        </Card>
      </div>

      <div className="grid g-2">
        <Card title="Case locations">
          {cases.length ? (
            <BaseMap height={360} bounds={cases.length > 1 ? cases.map((c) => [c.lat, c.lng]) : undefined} center={center} zoom={16}>
              {cases.map((c) => <CaseDot key={c.id} c={c} />)}
            </BaseMap>
          ) : <div className="empty">No cases.</div>}
        </Card>
        <Card title="Crime timeline" hint={`${cases.length} cases, newest first`}>
          <div className="timeline" style={{ maxHeight: 360, overflow: 'auto' }}>
            {cases.map((c) => (
              <div className="ev" key={c.id}>
                <span className="pt" style={{ background: TYPE_BY_ID[c.type].color }} />
                <div className="d">{fmtDateTime(c.date)} · {daysAgo(c.date)}</div>
                <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <span><b>{TYPE_BY_ID[c.type].label}</b> <span className="t2">at {BEAT_BY_ID[c.beat].name}</span></span>
                  <StatusBadge status={c.status} kind="case" />
                </div>
                <div className="small muted">{c.fir}, {c.station} PS · {c.property} · {fmtINR(c.value)}{c.accused.length > 1 ? ` · with ${c.accused.filter((a) => a !== o.id).map((a) => offenderById[a].name).join(', ')}` : ''}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

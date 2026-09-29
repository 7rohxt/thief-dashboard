import { useMemo, useState } from 'react'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY } from 'd3-force'
import { db, offenderById, caseById } from '../data/index.js'
import { GANGS, GANG_BY_ID, NO_GANG_COLOR, TYPE_BY_ID, OFFENDER_STATUSES } from '../data/constants.js'
import { Card, Seg, StatusBadge, TypeChip, OffenderLink, RiskPill, Legend } from '../components/ui.jsx'
import { photoOf } from '../lib/photos.js'
import { go } from '../lib/router.js'

const W = 900, H = 640

function layout(minLinks) {
  const links = db.links.filter((l) => l.count >= minLinks).map((l) => ({ ...l }))
  const ids = new Set(links.flatMap((l) => [l.source, l.target]))
  const nodes = db.offenders.filter((o) => ids.has(o.id)).map((o) => ({ id: o.id, o, r: 12 + Math.sqrt(o.caseCount) * 2.4 }))
  // gang anchors keep clusters readable
  const anchor = (n) => {
    const gi = GANGS.findIndex((g) => g.id === n.o.gangId)
    if (gi < 0) return { x: W / 2, y: H / 2 }
    const a = (gi / GANGS.length) * Math.PI * 2
    return { x: W / 2 + Math.cos(a) * 240, y: H / 2 + Math.sin(a) * 190 }
  }
  const sim = forceSimulation(nodes)
    .force('link', forceLink(links).id((d) => d.id).distance((l) => 70 - Math.min(30, l.count * 4)).strength(0.4))
    .force('charge', forceManyBody().strength(-260))
    .force('center', forceCenter(W / 2, H / 2))
    .force('collide', forceCollide().radius((d) => d.r + 12))
    .force('x', forceX((d) => anchor(d).x).strength(0.12))
    .force('y', forceY((d) => anchor(d).y).strength(0.12))
    .stop()
  for (let i = 0; i < 400; i++) sim.tick()
  for (const n of nodes) { n.x = Math.max(n.r + 24, Math.min(W - n.r - 24, n.x)); n.y = Math.max(n.r + 12, Math.min(H - n.r - 22, n.y)) }
  return { nodes, links }
}

export default function GangNetwork({ query }) {
  const [minLinks, setMinLinks] = useState(2)
  const [hover, setHover] = useState(null)
  const [sel, setSel] = useState(query.focus ?? null)
  const [gangFilter, setGangFilter] = useState('all')
  const { nodes, links } = useMemo(() => layout(minLinks), [minLinks])

  const focus = hover ?? sel
  const neighbours = useMemo(() => {
    if (!focus) return null
    const s = new Set([focus])
    for (const l of links) { if (l.source.id === focus) s.add(l.target.id); if (l.target.id === focus) s.add(l.source.id) }
    return s
  }, [focus, links])
  const dim = (id, gangId) => (neighbours ? !neighbours.has(id) : gangFilter !== 'all' && gangId !== gangFilter)

  const gangStats = GANGS.map((g) => {
    const members = db.offenders.filter((o) => o.gangId === g.id)
    const caseSet = new Set(members.flatMap((m) => m.caseIds))
    const types = {}
    for (const id of caseSet) { const t = caseById[id].type; types[t] = (types[t] ?? 0) + 1 }
    const top = Object.entries(types).sort((a, b) => b[1] - a[1])[0]
    const active = members.filter((m) => m.status === 'bail' || m.status === 'absconding' || m.status === 'watch').length
    const leader = members.slice().sort((a, b) => b.caseCount - a.caseCount)[0]
    return { g, members, cases: caseSet.size, top: top?.[0], active, leader }
  })
  const selO = sel ? offenderById[sel] : null

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Gang Network</h2>
          <div className="ta">கும்பல் தொடர்புகள் · offenders linked by joint cases (co-accused)</div>
        </div>
        <span className="spacer" />
        <span className="small muted">Min. joint cases</span>
        <Seg options={[{ id: 1, label: '1+' }, { id: 2, label: '2+' }, { id: 3, label: '3+' }, { id: 5, label: '5+' }]} value={minLinks} onChange={setMinLinks} />
      </div>

      <div className="grid g-2-1">
        <Card title="Link chart" hint="Hover to trace links · click to select · larger photo = more cases">
          <Legend items={[...GANGS.map((g) => ({ label: g.name, color: g.color })), { label: 'No known gang', color: NO_GANG_COLOR }]} />
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} onClick={() => setSel(null)}>
            <defs>
              {nodes.map((n) => <clipPath key={n.id} id={`clip-${n.id}`}><circle cx={n.x} cy={n.y} r={n.r - 2} /></clipPath>)}
            </defs>
            {links.map((l) => {
              const on = neighbours && (l.source.id === focus || l.target.id === focus)
              const off = neighbours ? !on : gangFilter !== 'all' && (l.source.o.gangId !== gangFilter || l.target.o.gangId !== gangFilter)
              return <line key={`${l.source.id}-${l.target.id}`} x1={l.source.x} y1={l.source.y} x2={l.target.x} y2={l.target.y}
                stroke={on ? '#1b3a8a' : '#98a2b3'} strokeOpacity={off ? 0.08 : on ? 0.9 : 0.45} strokeWidth={Math.min(7, 0.8 + l.count * 0.7)} />
            })}
            {nodes.map((n) => {
              const c = n.o.gangId ? GANG_BY_ID[n.o.gangId].color : NO_GANG_COLOR
              const faded = dim(n.id, n.o.gangId)
              return (
                <g key={n.id} style={{ cursor: 'pointer', opacity: faded ? 0.15 : 1, transition: 'opacity .15s' }}
                  onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}
                  onClick={(e) => { e.stopPropagation(); setSel(n.id) }}>
                  <circle cx={n.x} cy={n.y} r={n.r + 1} fill="#ffffff" stroke={sel === n.id ? '#101828' : c} strokeWidth={sel === n.id ? 4 : 3} />
                  <image href={photoOf(n.o)} x={n.x - n.r} y={n.y - n.r} width={n.r * 2} height={n.r * 2} clipPath={`url(#clip-${n.id})`} preserveAspectRatio="xMidYMid slice" />
                  {n.o.status === 'absconding' && <circle cx={n.x + n.r * 0.72} cy={n.y - n.r * 0.72} r={5} fill="#d92d20" stroke="#ffffff" strokeWidth={2} />}
                  {(focus ? neighbours.has(n.id) : n.r > 24) && (
                    <text x={n.x} y={n.y + n.r + 13} textAnchor="middle" fontSize="11" fill="#101828" fontWeight="600" stroke="#ffffff" strokeWidth="4" paintOrder="stroke">{n.o.alias}</text>
                  )}
                </g>
              )
            })}
          </svg>
          <div className="small muted">Red dot = absconding. Line thickness = number of joint cases.</div>
        </Card>

        <div className="col" style={{ gap: 16 }}>
          {selO ? (
            <Card title="Selected offender" right={<button className="btn" onClick={() => go(`offender/${selO.id}`)}>Open profile →</button>}>
              <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
                <img src={photoOf(selO)} className="avatar" width={92} height={92} alt={selO.name} />
                <div className="col" style={{ gap: 6 }}>
                  <b style={{ fontSize: 16 }}>{selO.name}</b>
                  <span className="t2">alias <b style={{ color: 'var(--text)' }}>{selO.alias}</b></span>
                  <StatusBadge status={selO.status} />
                  <TypeChip type={selO.primaryType} />
                  <RiskPill risk={selO.risk} />
                </div>
              </div>
              <div className="card-head" style={{ marginTop: 14, marginBottom: 8 }}><h3>Associates</h3></div>
              <div className="col" style={{ gap: 8 }}>
                {selO.associates.slice(0, 6).map((a) => <OffenderLink key={a.id} offender={offenderById[a.id]} size={28} sub={`${a.count} joint case${a.count === 1 ? '' : 's'} · ${OFFENDER_STATUSES[offenderById[a.id].status].label}`} />)}
              </div>
            </Card>
          ) : (
            <Card title="Gangs" hint="Click to highlight">
              <div className="col" style={{ gap: 10 }}>
                {gangStats.map(({ g, members, cases, top, active, leader }) => (
                  <div key={g.id} className="card" style={{ padding: 12, cursor: 'pointer', background: gangFilter === g.id ? 'var(--brand-soft)' : '#fff', boxShadow: 'none', borderColor: gangFilter === g.id ? g.color : 'var(--border)' }}
                    onClick={() => setGangFilter(gangFilter === g.id ? 'all' : g.id)}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span className="chip" style={{ color: 'var(--text)', fontWeight: 600, fontSize: 13 }}><span className="sw" style={{ background: g.color }} />{g.name}</span>
                      <span className="small muted">{members.length} members</span>
                    </div>
                    <div className="small t2" style={{ marginTop: 6 }}>
                      {cases} cases · mostly {top ? TYPE_BY_ID[top].label.toLowerCase() : '—'} · {active} free / at large
                    </div>
                    {leader && <div className="small muted" style={{ marginTop: 2 }}>Most active: {leader.name} @ {leader.alias} ({leader.caseCount})</div>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

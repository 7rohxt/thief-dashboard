import { useMemo, useState } from 'react'
import logo from '../assets/gcp-logo.png'
import { Icon, Avatar } from './ui.jsx'
import { db } from '../data/index.js'
import { ALERTS } from '../data/alerts.js'
import { TODAY, TYPE_BY_ID } from '../data/constants.js'

export const NAV = [
  { id: 'overview', label: 'Overview', ta: 'மேலோட்டம்', icon: 'grid' },
  { id: 'offenders', label: 'Offenders', ta: 'குற்றவாளிகள்', icon: 'users' },
  { id: 'repeat', label: 'Repeat Offenders', ta: 'தொடர் குற்றவாளிகள்', icon: 'repeat' },
  { id: 'hotspots', label: 'Hotspots & Patterns', ta: 'குற்றப் பகுதிகள்', icon: 'map' },
  { id: 'network', label: 'Gang Network', ta: 'கும்பல் தொடர்புகள்', icon: 'network' },
  { id: 'alerts', label: 'Alerts', ta: 'எச்சரிக்கைகள்', icon: 'bell' },
  { id: 'cases', label: 'Case Records', ta: 'வழக்குப் பதிவுகள்', icon: 'file' },
]

function GlobalSearch() {
  const [q, setQ] = useState('')
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return []
    const has = (v) => String(v ?? '').toLowerCase().includes(s)
    return db.offenders.filter((o) => has(o.name) || has(o.alias) || has(o.id) || has(o.historySheet?.no)).slice(0, 7)
  }, [q])
  return (
    <div className="search">
      <Icon name="search" />
      <input placeholder="Search name, alias, ID, HS no." value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => setTimeout(() => setQ(''), 200)} />
      {q.trim().length >= 2 && results.length === 0 && (
        <div className="results"><div className="small muted" style={{ padding: '10px 12px' }}>No offender matches “{q.trim()}”</div></div>
      )}
      {results.length > 0 && (
        <div className="results">
          {results.map((o) => (
            <a key={o.id} href={`#/offender/${o.id}`} onClick={() => setQ('')}>
              <Avatar offender={o} size={32} />
              <span className="col" style={{ gap: 0 }}>
                <span style={{ fontWeight: 600 }}>{o.name} <span className="muted small">@ {o.alias}</span></span>
                <span className="muted small">{o.id} · {TYPE_BY_ID[o.primaryType].label} · {o.caseCount} cases</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Layout({ page, title, children }) {
  const critical = ALERTS.filter((a) => a.tone === 'critical').length
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <img src={logo} alt="Greater Chennai Police" />
          <div>
            <div className="t1">Greater Chennai Police</div>
            <div className="t2">Pulianthope</div>
            <div className="t3">Crime Intelligence</div>
          </div>
        </div>
        <div className="nav-label">Dashboard</div>
        <nav className="nav">
          {NAV.map((n) => (
            <a key={n.id} href={`#/${n.id}`} className={page === n.id || (page === 'offender' && n.id === 'offenders') ? 'active' : ''}>
              <Icon name={n.icon} size={18} style={{ flex: 'none' }} />
              <span className="lbl">{n.label}<small>{n.ta}</small></span>
              {n.id === 'alerts' && critical > 0 && <span className="count">{critical}</span>}
            </a>
          ))}
        </nav>
        <div className="foot">
          <div>Data as of {TODAY.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div>{db.offenders.length} offenders · {db.cases.length.toLocaleString('en-IN')} cases</div>
          <div style={{ marginTop: 6 }}>Built by MAARR Smart Solutions</div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <div className="sub">Pulianthope Police District · Pulianthope, Basin Bridge, Vyasarpadi and Otteri stations</div>
          </div>
          <span className="demo-badge" title="All names, cases and figures are generated sample data">SAMPLE DATA · DEMO</span>
          <span className="spacer" />
          <GlobalSearch />
        </header>
        {children}
      </div>
    </div>
  )
}

import { TYPE_BY_ID, OFFENDER_STATUSES, CASE_STATUSES } from '../data/constants.js'
import { photoOf } from '../lib/photos.js'
import { go } from '../lib/router.js'

export const TONES = {
  good: { c: 'var(--good)', bg: 'var(--good-bg)', icon: 'check' },
  warning: { c: 'var(--warning)', bg: 'var(--warning-bg)', icon: 'clock' },
  serious: { c: 'var(--serious)', bg: 'var(--serious-bg)', icon: 'eye' },
  critical: { c: 'var(--critical)', bg: 'var(--critical-bg)', icon: 'alert' },
  neutral: { c: 'var(--neutral)', bg: 'var(--neutral-bg)', icon: 'gavel' },
}

export function Icon({ name, size = 16, style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', style }
  switch (name) {
    case 'check': return <svg {...p}><path d="M20 6 9 17l-5-5" /></svg>
    case 'clock': return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
    case 'eye': return <svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
    case 'alert': return <svg {...p}><path d="M12 3 2 21h20L12 3Z" /><path d="M12 10v5M12 18h.01" /></svg>
    case 'gavel': return <svg {...p}><path d="m14 13-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10" /><path d="m16 16 6-6M8 8l6-6M9 7l8 8M21 11l-8-8" /></svg>
    case 'grid': return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
    case 'users': return <svg {...p}><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M16 3.1a4 4 0 0 1 0 7.8M22 21a7 7 0 0 0-4-6.3" /></svg>
    case 'repeat': return <svg {...p}><path d="m17 2 4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></svg>
    case 'map': return <svg {...p}><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z" /><circle cx="12" cy="9" r="2.5" /></svg>
    case 'network': return <svg {...p}><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="19" r="2.5" /><circle cx="19" cy="19" r="2.5" /><path d="M11 7.3 6.2 16.8M13 7.3l4.8 9.5M7.5 19h9" /></svg>
    case 'bell': return <svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></svg>
    case 'file': return <svg {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></svg>
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
    case 'download': return <svg {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
    case 'back': return <svg {...p}><path d="M15 18l-6-6 6-6" /></svg>
    case 'shield': return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
    case 'trend': return <svg {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M14 7h7v7" /></svg>
    case 'rupee': return <svg {...p}><path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a5 5 0 0 0 0-10" /></svg>
    default: return null
  }
}

export function Card({ title, hint, right, children, className = '', flush }) {
  return (
    <section className={`card ${flush ? 'flush' : ''} ${className}`}>
      {(title || right) && (
        <div className="card-head">
          {title && <h3>{title}</h3>}
          {hint && <span className="hint">{hint}</span>}
          <span className="spacer" />
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

export function Kpi({ label, value, delta, deltaGoodWhenDown = true, color = '#2a78d6', icon }) {
  let d = null
  if (delta != null && isFinite(delta)) {
    const up = delta > 0
    const good = deltaGoodWhenDown ? !up : up
    d = <><b className={good ? 'down-good' : 'up-bad'}>{up ? '↑' : '↓'} {Math.abs(delta * 100).toFixed(0)}%</b> vs prev. period</>
  }
  return (
    <div className="card kpi">
      <div className="top">
        <span className="label">{label}</span>
        {icon && <span className="ico" style={{ background: `color-mix(in srgb, ${color} 12%, white)`, color }}><Icon name={icon} size={16} /></span>}
      </div>
      <div className="value">{value}</div>
      <div className="delta">{d ?? ' '}</div>
    </div>
  )
}

export function StatusBadge({ status, kind = 'offender' }) {
  const s = (kind === 'offender' ? OFFENDER_STATUSES : CASE_STATUSES)[status]
  if (!s) return null
  const t = TONES[s.tone]
  return (
    <span className="badge" style={{ background: t.bg, color: t.c }}>
      <span style={{ display: 'flex' }}><Icon name={t.icon} size={12} /></span>
      {s.label}
    </span>
  )
}

export function TypeChip({ type, ta }) {
  const t = TYPE_BY_ID[type]
  return <span className="chip"><span className="sw" style={{ background: t.color }} />{t.label}{ta && <span className="muted"> · {t.ta}</span>}</span>
}

export function Avatar({ offender, size = 36, round }) {
  return <img className={`avatar ${round ? 'round' : ''}`} src={photoOf(offender)} width={size} height={size} alt={offender.name} />
}

export function OffenderLink({ offender, sub, size = 34 }) {
  return (
    <a className="row" href={`#/offender/${offender.id}`} onClick={(e) => e.stopPropagation()}>
      <Avatar offender={offender} size={size} />
      <span className="col" style={{ gap: 0 }}>
        <span style={{ fontWeight: 600 }}>{offender.name} <span className="muted small">@ {offender.alias}</span></span>
        {sub && <span className="muted small">{sub}</span>}
      </span>
    </a>
  )
}

export function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((it) => <span key={it.label} className="chip"><span className="sw" style={{ background: it.color }} />{it.label}</span>)}
    </div>
  )
}

export function ChartTip({ active, payload, label, labelFmt, valueFmt = (v) => v }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tip">
      <div className="h">{labelFmt ? labelFmt(label, payload) : label}</div>
      {payload.filter((p) => p.value != null).map((p) => (
        <div className="r" key={p.dataKey}>
          <span className="sw" style={{ background: p.color || p.payload?.fill }} />
          <span className="t2">{p.name}</span>
          <span className="v">{valueFmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function HBars({ rows, max, fmt = (v) => v, onClick }) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="hbar">
      {rows.map((r) => (
        <div className="r" key={r.label} title={`${r.label}: ${fmt(r.value)}`} style={{ cursor: onClick ? 'pointer' : undefined }} onClick={() => onClick?.(r)}>
          <span className="t2" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
          <span className="track"><span className="fill" style={{ display: 'block', width: `${(r.value / m) * 100}%`, background: r.color ?? 'var(--accent)' }} /></span>
          <span className="v">{fmt(r.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function Seg({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => <button key={o.id} className={o.id === value ? 'on' : ''} onClick={() => onChange(o.id)}>{o.label}</button>)}
    </div>
  )
}

export function RiskPill({ risk }) {
  const t = risk >= 75 ? TONES.critical : risk >= 50 ? TONES.serious : risk >= 25 ? TONES.warning : TONES.good
  return <span className="badge" style={{ background: t.bg, color: t.c, padding: '2px 9px', boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${t.c} 22%, transparent)` }}>Risk {risk}</span>
}

export const openOffender = (id) => go(`offender/${id}`)

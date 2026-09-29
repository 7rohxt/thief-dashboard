import { useState } from 'react'
import { ALERTS } from '../data/alerts.js'
import { offenderById } from '../data/index.js'
import { Icon, Avatar, Seg } from '../components/ui.jsx'
import { go } from '../lib/router.js'

const TONE_COLOR = { critical: 'var(--critical)', serious: 'var(--serious)', warning: 'var(--warning)', good: 'var(--good)' }
const TONE_LABEL = { critical: 'Critical', serious: 'High', warning: 'Due' }

export default function Alerts() {
  const kinds = ['all', ...new Set(ALERTS.map((a) => a.kind))]
  const [kind, setKind] = useState('all')
  const list = ALERTS.filter((a) => kind === 'all' || a.kind === kind)
  const count = (tone) => ALERTS.filter((a) => a.tone === tone).length

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Alerts</h2>
          <div className="ta">எச்சரிக்கைகள் · {count('critical')} critical · {count('serious')} high · {count('warning')} due</div>
        </div>
      </div>
      <Seg options={kinds.map((k) => ({ id: k, label: k === 'all' ? `All (${ALERTS.length})` : `${k} (${ALERTS.filter((a) => a.kind === k).length})` }))} value={kind} onChange={setKind} />

      <div className="col" style={{ gap: 10 }}>
        {list.map((a) => (
          <div key={a.id} className="alert">
            <span className="edge" style={{ background: TONE_COLOR[a.tone] }} />
            {a.offender
              ? <Avatar offender={offenderById[a.offender]} size={46} />
              : <span style={{ width: 46, height: 46, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'rgba(208,59,59,.15)', color: TONE_COLOR[a.tone] }}><Icon name={a.icon} size={22} /></span>}
            <div className="col" style={{ gap: 2 }}>
              <div className="row" style={{ gap: 8 }}>
                <span className="badge" style={{ background: `color-mix(in srgb, ${TONE_COLOR[a.tone]} 18%, transparent)` }}>
                  <span style={{ color: TONE_COLOR[a.tone], display: 'flex' }}><Icon name={a.icon} size={12} /></span>{TONE_LABEL[a.tone]} · {a.kind}
                </span>
              </div>
              <div className="ttl">{a.title}</div>
              <div className="desc">{a.desc}</div>
            </div>
            <button className="btn" onClick={() => go(a.link)}>Open →</button>
          </div>
        ))}
      </div>
    </div>
  )
}

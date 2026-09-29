import { Fragment, useMemo } from 'react'
import { WEEKDAYS, hourLabel } from '../lib/format.js'

// Sequential single-hue ramp (blue): light = few, dark = many.
export const HEAT_RAMP = ['#f2f4f7', '#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#0d366b']
const rampColor = (v, max) => (v === 0 ? HEAT_RAMP[0] : HEAT_RAMP[Math.min(HEAT_RAMP.length - 1, 1 + Math.floor((v / Math.max(1, max)) * (HEAT_RAMP.length - 2)))])

export default function Heatmap({ cases, compact = false }) {
  const heat = useMemo(() => {
    const m = Array.from({ length: 7 }, () => Array(24).fill(0))
    for (const c of cases) m[c.weekday][c.hour]++
    return m
  }, [cases])
  const max = Math.max(...heat.flat())
  const every = compact ? 6 : 3
  return (
    <>
      <div className={`heat ${compact ? 'compact' : ''}`}>
        <span />
        {Array.from({ length: 24 }, (_, h) => <span key={h} className="hl">{h % every === 0 ? hourLabel(h) : ''}</span>)}
        {heat.map((row, d) => (
          <Fragment key={d}>
            <span className="lab">{compact ? WEEKDAYS[d][0] + WEEKDAYS[d][1] : WEEKDAYS[d]}</span>
            {row.map((v, h) => <span key={h} className="cell" style={{ background: rampColor(v, max) }} title={`${WEEKDAYS[d]} ${hourLabel(h)}–${hourLabel((h + 1) % 24)}: ${v} cases`} />)}
          </Fragment>
        ))}
      </div>
      <div className="row small muted" style={{ marginTop: 10, gap: 4 }}>
        <span>Fewer</span>
        {HEAT_RAMP.slice(1).map((c) => <span key={c} style={{ width: compact ? 12 : 22, height: 8, background: c, borderRadius: 2 }} />)}
        <span>More{compact ? '' : ` (max ${max} in one slot)`}</span>
      </div>
    </>
  )
}

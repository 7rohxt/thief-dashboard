import { db, offenderById } from './index.js'
import { TODAY, BEATS, CRIME_TYPES, TYPE_BY_ID } from './constants.js'

const DAY = 86400000
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`
const days = (d) => Math.floor((TODAY - new Date(d)) / DAY)

function build() {
  const out = []

  // 1. Hotspot spikes: last 30 days vs average of the previous 90 days
  for (const b of BEATS) {
    for (const t of CRIME_TYPES) {
      const recent = db.cases.filter((c) => c.beat === b.id && c.type === t.id && TODAY - c.ts < 30 * DAY).length
      const prev = db.cases.filter((c) => c.beat === b.id && c.type === t.id && TODAY - c.ts >= 30 * DAY && TODAY - c.ts < 120 * DAY).length / 3
      if (recent >= 4 && recent >= prev * 1.5) {
        out.push({
          id: `spike-${b.id}-${t.id}`, kind: 'Hotspot spike', tone: 'critical', icon: 'trend',
          title: `${t.label} spike at ${b.name}`,
          desc: `${recent} cases in the last 30 days vs ${prev.toFixed(1)} per month over the previous 3 months. Consider extra patrols at peak hours.`,
          link: `hotspots?beat=${b.id}&type=${t.id}`, sort: 0,
        })
      }
    }
  }

  // 2. Absconding offenders
  for (const o of db.offenders.filter((x) => x.status === 'absconding')) {
    out.push({
      id: `abs-${o.id}`, kind: 'Absconding', tone: 'critical', icon: 'alert', offender: o.id,
      title: `${o.name} @ ${o.alias} is absconding${o.nbw ? ' (NBW issued)' : ''}`,
      desc: `${o.caseCount} cases on record, mainly ${TYPE_BY_ID[o.primaryType].label.toLowerCase()}. Last seen around ${BEATS.find((b) => b.id === o.homeBeat).name}.`,
      link: `offender/${o.id}`, sort: 1,
    })
  }

  // 3. Recently released habitual offenders
  for (const o of db.offenders.filter((x) => x.status === 'bail' && days(x.statusSince) <= 30 && x.caseCount >= 12)) {
    out.push({
      id: `bail-${o.id}`, kind: 'Released on bail', tone: 'serious', icon: 'eye', offender: o.id,
      title: `${o.name} @ ${o.alias} released on bail ${plural(days(o.statusSince), 'day')} ago`,
      desc: `${o.caseCount} prior cases (${o.typeCounts[o.primaryType] ?? 0} ${TYPE_BY_ID[o.primaryType].label.toLowerCase()}). Condition: ${o.bailCondition}.`,
      link: `offender/${o.id}`, sort: 2,
    })
  }

  // 4. History-sheet check-ins
  for (const o of db.offenders.filter((x) => x.historySheet && x.nextCheck)) {
    const d = -days(o.nextCheck) // positive = in future
    if (d > 7) continue
    const overdue = d < 0
    out.push({
      id: `hs-${o.id}`, kind: overdue ? 'Check-in overdue' : 'Check-in due', tone: overdue ? 'critical' : 'warning', icon: 'clock', offender: o.id,
      title: `History-sheet check ${overdue ? `overdue by ${plural(-d, 'day')}` : d === 0 ? 'due today' : `due in ${plural(d, 'day')}`}: ${o.name}`,
      desc: `${o.historySheet.no}, category ${o.historySheet.category}. Verify residence and current activity.`,
      link: `offender/${o.id}`, sort: overdue ? 1.5 : 3,
    })
  }

  // 5. Active pairs: co-accused together 3+ times in 90 days
  const pairs = {}
  for (const c of db.cases.filter((c) => TODAY - c.ts < 90 * DAY)) {
    for (let i = 0; i < c.accused.length; i++) for (let j = i + 1; j < c.accused.length; j++) {
      const k = [c.accused[i], c.accused[j]].sort().join('|')
      pairs[k] = (pairs[k] ?? 0) + 1
    }
  }
  for (const [k, n] of Object.entries(pairs)) {
    if (n < 3) continue
    const [a, b] = k.split('|').map((id) => offenderById[id])
    out.push({
      id: `pair-${k}`, kind: 'Active pair', tone: 'serious', icon: 'network', offender: a.id,
      title: `${a.name} and ${b.name} operating together`,
      desc: `Co-accused in ${n} cases in the last 90 days.`,
      link: `network?focus=${a.id}`, sort: 2.5,
    })
  }

  return out.sort((x, y) => x.sort - y.sort)
}

export const ALERTS = build()

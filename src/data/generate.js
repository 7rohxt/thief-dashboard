// Deterministic demo dataset. Same seed -> same offenders and cases every load.
import {
  TODAY, CRIME_TYPES, BEATS, GANGS, FIRST_NAMES, FATHER_NAMES, ALIASES, MARKS, BUILDS,
  MO_TEXT, PHONE_BRANDS, BIKES, BEAT_BY_ID,
} from './constants.js'

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260929)
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const chance = (p) => rand() < p
function weighted(items, w) {
  const total = items.reduce((s, it) => s + w(it), 0)
  let r = rand() * total
  for (const it of items) { r -= w(it); if (r <= 0) return it }
  return items[items.length - 1]
}
const DAY = 86400000
const addDays = (d, n) => new Date(d.getTime() + n * DAY)

const PHOTO_COUNT = 5
const OFFENDER_COUNT = 64
const MONTHS = 36

// ---------------------------------------------------------------- offenders
function makeOffenders() {
  const used = new Set()
  const aliasPool = ALIASES.slice()
  const list = []
  for (let i = 0; i < OFFENDER_COUNT; i++) {
    let first
    do { first = pick(FIRST_NAMES) } while (used.has(first) && used.size < FIRST_NAMES.length)
    used.add(first)
    const father = pick(FATHER_NAMES)
    const primary = weighted(CRIME_TYPES, (t) => t.weight)
    let secondary = weighted(CRIME_TYPES, (t) => t.weight)
    if (secondary.id === primary.id) secondary = CRIME_TYPES[(CRIME_TYPES.indexOf(primary) + 1) % CRIME_TYPES.length]
    const gang = chance(0.72) ? GANGS[i % GANGS.length] : null
    const home = gang ? BEATS[(GANGS.indexOf(gang) * 2 + int(0, 2)) % BEATS.length] : pick(BEATS)
    // Pareto-ish activity: a few prolific repeat offenders drive most cases
    const activity = Math.pow(rand(), 1.7) * 6 + 0.5
    const age = int(19, 54)
    // always draw one random number so the rest of the dataset stays identical
    // only some offenders have a known alias
    const pickAlias = () => { const r = rand(); if (i % 5 >= 2 || !aliasPool.length) return null; return aliasPool.splice(Math.floor(r * aliasPool.length), 1)[0] }
    list.push({
      id: `OFF-${String(i + 1).padStart(4, '0')}`,
      name: `${father[0]}. ${first}`,
      alias: pickAlias(),
      father: `S/o ${father}`,
      age,
      heightCm: int(158, 182),
      build: pick(BUILDS),
      marks: [pick(MARKS), ...(chance(0.4) ? [pick(MARKS)] : [])].filter((m, j, a) => a.indexOf(m) === j),
      photo: i % PHOTO_COUNT,
      gangId: gang?.id ?? null,
      homeBeat: home.id,
      primaryType: primary.id,
      secondaryType: secondary.id,
      mo: pick(MO_TEXT[primary.id]),
      firstOffenceAge: Math.max(15, age - int(1, 18)),
      historySheet: null,
      activity,
    })
  }
  return list
}

// ---------------------------------------------------------------- cases
function monthVolume(m) {
  // m = 0 oldest ... 35 current. Festival months (Oct-Dec) spike, mild uptrend.
  const date = new Date(TODAY.getFullYear(), TODAY.getMonth() - (MONTHS - 1 - m), 1)
  const month = date.getMonth()
  const festival = month >= 9 && month <= 11 ? 1.25 : month === 0 ? 1.1 : 1
  return Math.round((24 + m * 0.18 + int(-3, 3)) * festival)
}

function describeProperty(type) {
  switch (type) {
    case 'chain': {
      const sov = int(2, 8)
      return { text: `Gold chain, ${sov} sovereigns`, value: sov * int(70000, 82000) }
    }
    case 'mobile': return { text: `${pick(PHONE_BRANDS)} mobile phone`, value: int(9000, 95000) }
    case 'pickpocket': return { text: 'Wallet with cash and cards', value: int(1500, 18000) }
    case 'vehicle': {
      const bike = pick(BIKES)
      return { text: `${bike} (TN-05-${String.fromCharCode(65 + int(0, 25))}${String.fromCharCode(65 + int(0, 25))}-${int(1000, 9999)})`, value: int(35000, 190000) }
    }
    case 'hb': return { text: `Gold jewels ${int(3, 25)} sovereigns, cash`, value: int(60000, 900000) }
    case 'robbery': return { text: pick(['Cash and mobile phone', 'Cash, gold ring', 'Day collection cash', 'Mobile phone and wallet']), value: int(4000, 120000) }
    case 'extortion': return { text: 'Cash extorted from trader', value: int(5000, 60000) }
    default: return { text: '-', value: 0 }
  }
}

function vehicleUsed(type) {
  if (type === 'chain') return weighted(['Two-wheeler (pillion)', 'Two-wheeler (solo)', 'On foot'], (v) => ({ 'Two-wheeler (pillion)': 70, 'Two-wheeler (solo)': 20, 'On foot': 10 }[v]))
  if (type === 'mobile') return weighted(['Two-wheeler (pillion)', 'Two-wheeler (solo)', 'On foot'], (v) => ({ 'Two-wheeler (pillion)': 50, 'Two-wheeler (solo)': 25, 'On foot': 25 }[v]))
  if (type === 'robbery') return weighted(['Two-wheeler (pillion)', 'On foot', 'Auto-rickshaw'], (v) => ({ 'Two-wheeler (pillion)': 45, 'On foot': 40, 'Auto-rickshaw': 15 }[v]))
  if (type === 'vehicle') return 'On foot'
  if (type === 'hb') return weighted(['On foot', 'Two-wheeler (solo)'], (v) => (v === 'On foot' ? 70 : 30))
  return 'On foot'
}

function victimProfile(type) {
  const female = type === 'chain' ? chance(0.9) : type === 'mobile' ? chance(0.5) : chance(0.3)
  const ageBand = weighted(['18-30', '31-45', '46-60', '60+'], (b) => ({
    '18-30': type === 'mobile' ? 40 : 18, '31-45': 32, '46-60': type === 'chain' ? 34 : 24, '60+': type === 'chain' ? 20 : 10,
  }[b]))
  return { gender: female ? 'Female' : 'Male', ageBand }
}

function makeCases(offenders) {
  const cases = []
  const firSeq = {}
  const start = new Date(TODAY.getFullYear(), TODAY.getMonth() - (MONTHS - 1), 1)
  for (let m = 0; m < MONTHS; m++) {
    const monthStart = new Date(start.getFullYear(), start.getMonth() + m, 1)
    const monthEnd = m === MONTHS - 1 ? TODAY : new Date(start.getFullYear(), start.getMonth() + m + 1, 1)
    const span = Math.max(1, Math.floor((monthEnd - monthStart) / DAY))
    let n = monthVolume(m)
    if (m === MONTHS - 1) n = Math.round(n * (span / 30))
    for (let k = 0; k < n; k++) {
      // Story for the demo: chain snatching climbs in the last 4 months
      const type = weighted(CRIME_TYPES, (t) => t.weight * (t.id === 'chain' && m >= MONTHS - 4 ? 1.8 : 1))
      const beat = weighted(BEATS, (b) => b.affinity[type.id] ?? 0.4)
      const day = addDays(monthStart, int(0, span - 1))
      const hour = pick(type.hours)
      const date = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, int(0, 59))
      if (date > TODAY) continue
      const station = beat.station
      const year = date.getFullYear()
      const key = `${station}-${year}`
      firSeq[key] = (firSeq[key] ?? 0) + 1

      const ageDays = (TODAY - date) / DAY
      const detected = chance(type.id === 'pickpocket' ? 0.55 : type.id === 'vehicle' ? 0.62 : 0.78)
      let accused = []
      if (detected) {
        const lead = weighted(offenders, (o) => o.activity *
          (o.primaryType === type.id ? 5 : o.secondaryType === type.id ? 2 : 0.15) *
          (o.homeBeat === beat.id ? 2.2 : 1))
        accused.push(lead.id)
        const pairProb = type.id === 'chain' || type.id === 'mobile' ? 0.6 : 0.3
        if (chance(pairProb)) {
          const pool = offenders.filter((o) => o.id !== lead.id && (lead.gangId ? o.gangId === lead.gangId : chance(0.08)))
          if (pool.length) accused.push(weighted(pool, (o) => o.activity).id)
          if (chance(0.18) && pool.length > 1) {
            const third = weighted(pool, (o) => o.activity).id
            if (!accused.includes(third)) accused.push(third)
          }
        }
      }
      let status
      if (!detected) status = ageDays < 45 ? 'investigation' : 'undetected'
      else if (ageDays < 20) status = chance(0.5) ? 'investigation' : 'arrested'
      else if (ageDays < 120) status = chance(0.7) ? 'arrested' : 'chargesheet'
      else if (ageDays < 420) status = chance(0.75) ? 'chargesheet' : 'arrested'
      else status = chance(0.35) ? 'convicted' : 'chargesheet'

      const prop = describeProperty(type.id)
      const recovered = detected && status !== 'investigation' && chance(0.72)
        ? Math.round(prop.value * (0.4 + rand() * 0.6) / 100) * 100 : 0
      cases.push({
        id: `C${String(cases.length + 1).padStart(5, '0')}`,
        fir: `Cr. No. ${firSeq[key]}/${year}`,
        station,
        date: date.toISOString(),
        ts: date.getTime(),
        hour,
        weekday: date.getDay(),
        type: type.id,
        beat: beat.id,
        lat: beat.lat + (rand() - 0.5) * 0.0024,
        lng: beat.lng + (rand() - 0.5) * 0.0024,
        accused,
        status,
        property: prop.text,
        value: prop.value,
        recovered,
        vehicle: vehicleUsed(type.id),
        victim: victimProfile(type.id),
      })
    }
  }
  cases.sort((a, b) => b.ts - a.ts)
  return cases
}

// ---------------------------------------------------------------- derive offender state
function finaliseOffenders(offenders, cases) {
  const byOff = Object.fromEntries(offenders.map((o) => [o.id, []]))
  for (const c of cases) for (const a of c.accused) byOff[a].push(c)
  let hsCounter = 101
  for (const o of offenders) {
    const list = byOff[o.id].sort((a, b) => a.ts - b.ts)
    o.caseIds = list.map((c) => c.id).reverse()
    o.caseCount = list.length
    const last = list[list.length - 1]
    o.lastOffence = last ? last.date : null
    const typeCounts = {}
    for (const c of list) typeCounts[c.type] = (typeCounts[c.type] ?? 0) + 1
    o.typeCounts = typeCounts
    o.propertyValue = list.reduce((s, c) => s + c.value, 0)
    // gaps between consecutive offences (days)
    o.gaps = list.slice(1).map((c, i) => Math.round((c.ts - list[i].ts) / DAY))
    const daysSince = last ? (TODAY - new Date(last.date)) / DAY : 9999
    if (!last) o.status = 'watch'
    else if (daysSince < 25) o.status = weighted(['custody', 'bail', 'absconding'], (s) => ({ custody: 45, bail: 30, absconding: 25 }[s]))
    else if (daysSince < 150) o.status = weighted(['custody', 'bail', 'absconding'], (s) => ({ custody: 35, bail: 50, absconding: 15 }[s]))
    else if (daysSince < 500) o.status = weighted(['bail', 'watch', 'convicted'], (s) => ({ bail: 45, watch: 35, convicted: 20 }[s]))
    else o.status = weighted(['watch', 'convicted'], (s) => (s === 'watch' ? 55 : 45))
    const since = last ? addDays(new Date(last.date), int(1, Math.max(2, Math.min(daysSince - 1, 120)))) : addDays(TODAY, -int(30, 400))
    o.statusSince = (since > TODAY ? addDays(TODAY, -1) : since).toISOString()
    if (o.status === 'bail') o.bailCondition = pick(['Sign daily at Pulianthope PS', 'Sign weekly at Pulianthope PS', 'Not to leave Chennai without permission', 'Sign daily at Otteri PS'])
    if (o.status === 'absconding') o.nbw = chance(0.7)
    if (o.caseCount >= 22 || (o.caseCount >= 12 && chance(0.5))) {
      o.historySheet = { no: `HS ${hsCounter++}/${2015 + int(0, 10)}`, category: o.caseCount >= 30 ? 'A+' : o.caseCount >= 20 ? 'A' : 'B' }
      o.nextCheck = addDays(TODAY, int(-6, 21)).toISOString()
    }
    // simple, explainable risk score 0-100
    const recent = list.filter((c) => (TODAY - new Date(c.date)) / DAY < 365).length
    const avgGap = o.gaps.length ? o.gaps.reduce((s, g) => s + g, 0) / o.gaps.length : 400
    o.risk = Math.min(100, Math.round(
      o.caseCount * 0.9 + recent * 2.2 + (avgGap < 45 ? 16 : avgGap < 120 ? 8 : 0) +
      (o.status === 'absconding' ? 18 : o.status === 'bail' ? 9 : 0) + (o.historySheet ? 6 : 0)))
    o.associates = []
    delete o.activity
  }
  // associates = co-accused counts
  const pairs = {}
  for (const c of cases) {
    for (let i = 0; i < c.accused.length; i++) for (let j = i + 1; j < c.accused.length; j++) {
      const [a, b] = [c.accused[i], c.accused[j]].sort()
      pairs[`${a}|${b}`] = (pairs[`${a}|${b}`] ?? 0) + 1
    }
  }
  const links = Object.entries(pairs).map(([k, count]) => { const [source, target] = k.split('|'); return { source, target, count } })
  const byId = Object.fromEntries(offenders.map((o) => [o.id, o]))
  for (const l of links) {
    byId[l.source].associates.push({ id: l.target, count: l.count })
    byId[l.target].associates.push({ id: l.source, count: l.count })
  }
  for (const o of offenders) o.associates.sort((a, b) => b.count - a.count)
  return links
}

export function generate() {
  const offenders = makeOffenders()
  const cases = makeCases(offenders)
  const links = finaliseOffenders(offenders, cases)
  return { offenders, cases, links }
}

export { BEAT_BY_ID }

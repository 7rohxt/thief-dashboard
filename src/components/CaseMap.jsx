import { MapContainer, TileLayer, CircleMarker, Circle, Polygon, Popup, Tooltip as LTooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP_CENTER, PULIANTHOPE_BOUNDARY, TYPE_BY_ID, BEAT_BY_ID } from '../data/constants.js'
import { fmtDateTime, fmtINR } from '../lib/format.js'
import { offenderById } from '../data/index.js'

// Free OpenStreetMap tiles: no API key. Attribution is required by the OSM tile policy.
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

export function BaseMap({ height = 420, zoom = 15, center = MAP_CENTER, bounds, boundary = true, children }) {
  const view = bounds ? { bounds, boundsOptions: { padding: [24, 24] } } : { center, zoom }
  return (
    <MapContainer {...view} zoomSnap={0.25} style={{ height }} scrollWheelZoom={false}>
      <TileLayer url={TILES} attribution={ATTR} maxZoom={19} />
      {boundary && <PulianthopeBoundary />}
      {children}
    </MapContainer>
  )
}

export function PulianthopeBoundary() {
  return (
    <Polygon positions={PULIANTHOPE_BOUNDARY} interactive={false}
      pathOptions={{ color: '#c8102e', weight: 2, dashArray: '6 5', fillColor: '#c8102e', fillOpacity: 0.05 }} />
  )
}

export const BOUNDARY_BOUNDS = PULIANTHOPE_BOUNDARY

export function CaseDot({ c }) {
  const t = TYPE_BY_ID[c.type]
  return (
    <CircleMarker center={[c.lat, c.lng]} radius={5} pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: t.color, fillOpacity: 0.95 }}>
      <Popup>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>{t.label}</div>
        <div>{c.fir} · {c.station} PS</div>
        <div>{fmtDateTime(c.date)}</div>
        <div>{BEAT_BY_ID[c.beat].name}</div>
        <div>{c.property} · {fmtINR(c.value)}</div>
        <div style={{ marginTop: 4 }}>
          Accused: {c.accused.length ? c.accused.map((a) => <a key={a} href={`#/offender/${a}`} style={{ color: '#1c5cab', marginRight: 6, fontWeight: 600 }}>{offenderById[a].name}</a>) : 'Not identified'}
        </div>
      </Popup>
    </CircleMarker>
  )
}

// Heat-style hotspot: a soft outer glow plus a solid core. Radius is in metres so
// the hotspots scale with the map when zooming. Intensity drives size and depth of red.
const HOT_RAMP = ['#fcae91', '#fb6a4a', '#ef3b2c', '#cb181d', '#99000d']

export function HotSpot({ beat, count, max, min = 0, selected, onClick }) {
  const t = max > min ? (count - min) / (max - min) : 1
  if (!count) return null
  const color = HOT_RAMP[Math.min(HOT_RAMP.length - 1, Math.round(t * (HOT_RAMP.length - 1)))]
  const r = 45 + t * 105 // metres
  const handlers = { click: () => onClick?.(beat) }
  return (
    <>
      <Circle center={[beat.lat, beat.lng]} radius={r * 1.9} interactive={false} pathOptions={{ stroke: false, fillColor: color, fillOpacity: 0.12 }} />
      <Circle center={[beat.lat, beat.lng]} radius={r * 1.35} interactive={false} pathOptions={{ stroke: false, fillColor: color, fillOpacity: 0.2 }} />
      <Circle center={[beat.lat, beat.lng]} radius={r} eventHandlers={handlers}
        pathOptions={{ color: selected ? '#101828' : '#ffffff', weight: selected ? 3 : 1.5, fillColor: color, fillOpacity: 0.55 + 0.3 * t }}>
        <LTooltip direction="top" sticky>{beat.name}: <b>{count}</b> cases</LTooltip>
      </Circle>
    </>
  )
}

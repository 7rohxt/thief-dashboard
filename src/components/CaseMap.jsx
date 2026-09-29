import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip as LTooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP_CENTER, TYPE_BY_ID, BEAT_BY_ID } from '../data/constants.js'
import { fmtDateTime, fmtINR } from '../lib/format.js'
import { offenderById } from '../data/index.js'

const TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const ATTR = '&copy; OpenStreetMap contributors &copy; CARTO'

export function BaseMap({ height = 420, zoom = 15, center = MAP_CENTER, bounds, children }) {
  const view = bounds ? { bounds, boundsOptions: { padding: [36, 36] } } : { center, zoom }
  return (
    <MapContainer {...view} zoomSnap={0.25} style={{ height }} scrollWheelZoom={false}>
      <TileLayer url={TILES} attribution={ATTR} subdomains="abcd" maxZoom={19} />
      {children}
    </MapContainer>
  )
}

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

export function BeatBubble({ beat, count, max, min = 0, color = '#e34948', onClick }) {
  const t = max > min ? (count - min) / (max - min) : 1
  const r = count ? 9 + t * 24 : 4
  return (
    <CircleMarker center={[beat.lat, beat.lng]} radius={r}
      pathOptions={{ color, weight: 2, fillColor: color, fillOpacity: 0.18 + 0.42 * t }}
      eventHandlers={{ click: () => onClick?.(beat) }}>
      <LTooltip direction="top" offset={[0, -r]}>{beat.name}: <b>{count}</b> cases</LTooltip>
    </CircleMarker>
  )
}

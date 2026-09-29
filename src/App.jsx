import { useState } from 'react'
import Layout, { NAV } from './components/Layout.jsx'
import { useRoute } from './lib/router.js'
import Overview from './pages/Overview.jsx'
import Offenders from './pages/Offenders.jsx'
import OffenderProfile from './pages/OffenderProfile.jsx'
import RepeatOffenders from './pages/RepeatOffenders.jsx'
import Hotspots from './pages/Hotspots.jsx'
import GangNetwork from './pages/GangNetwork.jsx'
import Alerts from './pages/Alerts.jsx'
import Cases from './pages/Cases.jsx'
import { offenderById } from './data/index.js'

export default function App() {
  const { page, param, query } = useRoute()
  const [period, setPeriod] = useState('12m')
  const key = `${page}/${param ?? ''}/${JSON.stringify(query)}`

  let body, title
  switch (page) {
    case 'offenders': body = <Offenders key={key} query={query} />; break
    case 'offender': body = <OffenderProfile key={key} id={param} />; title = offenderById[param] ? `Offender · ${offenderById[param].name}` : 'Offender'; break
    case 'repeat': body = <RepeatOffenders />; break
    case 'hotspots': body = <Hotspots key={key} period={period} setPeriod={setPeriod} query={query} />; break
    case 'network': body = <GangNetwork key={key} query={query} />; break
    case 'alerts': body = <Alerts />; break
    case 'cases': body = <Cases key={key} query={query} />; break
    default: body = <Overview period={period} setPeriod={setPeriod} />
  }
  title = title ?? (NAV.find((n) => n.id === page)?.label ?? 'Overview')
  return <Layout page={page} title={`${title}`}>{body}</Layout>
}

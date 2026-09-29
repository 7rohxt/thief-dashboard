import { useEffect, useState } from 'react'

// Minimal hash router so the demo also works as a single offline HTML file.
function parse() {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [path, query = ''] = raw.split('?')
  const parts = path.split('/').filter(Boolean)
  return { page: parts[0] || 'overview', param: parts[1] ?? null, query: Object.fromEntries(new URLSearchParams(query)) }
}

export function useRoute() {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const on = () => { setRoute(parse()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export const go = (path) => { window.location.hash = `#/${path}` }

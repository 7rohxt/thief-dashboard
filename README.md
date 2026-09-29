# Pulianthope Crime Intelligence Dashboard (demo)

Front-end demo of a crime and offender analytics dashboard for the Pulianthope police district
(Pulianthope, Basin Bridge, Vyasarpadi and Otteri stations), Greater Chennai Police.

> **All data is generated sample data.** Names, cases, FIR numbers, gangs and figures are fictional.
> Portrait photos are placeholders reused across offenders. In production they come from the
> department's own records.

## Quick demo (no install)

Open `demo/index.html` in Chrome or Edge by double-clicking it. Everything is inside that one file.
The street map tiles need an internet connection; everything else works offline.

## Run from source

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build -> dist/
npm run build:demo   # single self-contained file -> demo/index.html
```

## Screens

| Screen | What it shows |
|---|---|
| Overview | Headline numbers with change vs previous period, monthly cases by crime type, type and station breakdown, top offenders, latest cases, case status |
| Offenders | Photo cards with search and filters (crime type, status, gang, history-sheeters), sorted by risk, cases or recency |
| Offender profile | Photo, aliases, marks, usual method, status and bail condition, offences per year, areas, associates, case map, full crime timeline |
| Repeat Offenders | For any crime type: time between offences, cases per offender, most frequent offenders, escalating offenders, habitual offenders recently out on bail |
| Hotspots & Patterns | Area map (bubbles or each case), areas ranked with change, day × hour grid, crime mix, how offenders moved, victim profile, most active offenders per area |
| Gang Network | Link chart of co-accused offenders coloured by gang, with hover tracing, gang summaries |
| Alerts | Hotspot spikes, absconding (NBW), history-sheet check-ins due or overdue, habitual offenders released on bail, pairs operating together |
| Case Records | Filterable, paginated FIR table with CSV export |

## Structure

```
src/
  data/constants.js   beats, crime types, gangs, statuses, name lists
  data/generate.js    seeded generator (same data every load)
  data/index.js       dataset + period helpers
  data/alerts.js      alert rules
  components/         layout, shared UI, map helpers
  pages/              one file per screen
  assets/             logo and placeholder portraits
```

To connect real data later, replace `src/data/generate.js` with API calls that return the same
shapes (`offenders`, `cases`, `links`).

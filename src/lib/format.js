import { TODAY } from '../data/constants.js'

export const fmtInt = (n) => Math.round(n).toLocaleString('en-IN')

export function fmtINR(n, compact = false) {
  if (compact) {
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`
    if (n >= 1e3) return `₹${(n / 1e3).toFixed(0)}K`
  }
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
export const fmtDateTime = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
export const fmtPct = (n, digits = 0) => `${(n * 100).toFixed(digits)}%`

export function daysAgo(d) {
  const days = Math.floor((TODAY - new Date(d)) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} mo ago`
  return `${(days / 365).toFixed(1)} yrs ago`
}

export const hourLabel = (h) => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function riskTone(r) {
  if (r >= 75) return { color: '#d03b3b', label: 'Very high' }
  if (r >= 50) return { color: '#ec835a', label: 'High' }
  if (r >= 25) return { color: '#b98a00', label: 'Medium' }
  return { color: '#3a7d44', label: 'Low' }
}

export function toCSV(rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return rows.map((r) => r.map(esc).join(',')).join('\n')
}

export function download(filename, text, type = 'text/csv') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

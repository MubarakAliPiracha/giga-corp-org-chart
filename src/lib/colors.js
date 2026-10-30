// One fixed palette. Tailwind v4 only generates classes it can see as literal
// strings, so every entry is written out in full — never built with template
// strings. A department always hashes to the same entry, so its colour is
// consistent across cards, chips and charts.

export const PALETTE = [
  { card: 'border-sky-200 bg-sky-50', chip: 'bg-sky-100 text-sky-800', avatar: 'bg-sky-600', bar: '#0284c7' },
  { card: 'border-emerald-200 bg-emerald-50', chip: 'bg-emerald-100 text-emerald-800', avatar: 'bg-emerald-600', bar: '#059669' },
  { card: 'border-violet-200 bg-violet-50', chip: 'bg-violet-100 text-violet-800', avatar: 'bg-violet-600', bar: '#7c3aed' },
  { card: 'border-amber-200 bg-amber-50', chip: 'bg-amber-100 text-amber-800', avatar: 'bg-amber-600', bar: '#d97706' },
  { card: 'border-rose-200 bg-rose-50', chip: 'bg-rose-100 text-rose-800', avatar: 'bg-rose-600', bar: '#e11d48' },
  { card: 'border-cyan-200 bg-cyan-50', chip: 'bg-cyan-100 text-cyan-800', avatar: 'bg-cyan-600', bar: '#0891b2' },
  { card: 'border-lime-200 bg-lime-50', chip: 'bg-lime-100 text-lime-800', avatar: 'bg-lime-600', bar: '#65a30d' },
  { card: 'border-fuchsia-200 bg-fuchsia-50', chip: 'bg-fuchsia-100 text-fuchsia-800', avatar: 'bg-fuchsia-600', bar: '#c026d3' },
  { card: 'border-indigo-200 bg-indigo-50', chip: 'bg-indigo-100 text-indigo-800', avatar: 'bg-indigo-600', bar: '#4f46e5' },
  { card: 'border-teal-200 bg-teal-50', chip: 'bg-teal-100 text-teal-800', avatar: 'bg-teal-600', bar: '#0d9488' },
  { card: 'border-orange-200 bg-orange-50', chip: 'bg-orange-100 text-orange-800', avatar: 'bg-orange-600', bar: '#ea580c' },
  { card: 'border-blue-200 bg-blue-50', chip: 'bg-blue-100 text-blue-800', avatar: 'bg-blue-600', bar: '#2563eb' },
  { card: 'border-green-200 bg-green-50', chip: 'bg-green-100 text-green-800', avatar: 'bg-green-600', bar: '#16a34a' },
  { card: 'border-purple-200 bg-purple-50', chip: 'bg-purple-100 text-purple-800', avatar: 'bg-purple-600', bar: '#9333ea' },
  { card: 'border-red-200 bg-red-50', chip: 'bg-red-100 text-red-800', avatar: 'bg-red-600', bar: '#dc2626' },
  { card: 'border-yellow-200 bg-yellow-50', chip: 'bg-yellow-100 text-yellow-800', avatar: 'bg-yellow-600', bar: '#ca8a04' },
  { card: 'border-pink-200 bg-pink-50', chip: 'bg-pink-100 text-pink-800', avatar: 'bg-pink-600', bar: '#db2777' },
]

// Deterministic string hash (djb2). Same department, same colour, every run.
function hash(text) {
  let value = 5381
  for (let i = 0; i < text.length; i += 1) {
    value = ((value << 5) + value + text.charCodeAt(i)) >>> 0
  }
  return value
}

export function themeFor(department) {
  return PALETTE[hash(department || '') % PALETTE.length]
}

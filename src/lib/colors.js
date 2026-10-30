// One fixed department palette: 9 muted hues at similar lightness. Each entry
// is a strong tone (text, avatar initials, card top border — all pass WCAG AA
// against the tint) and a ~12% tint (avatar and chip backgrounds).
// A department always hashes to the same entry, so its colour is consistent
// across cards, the list view and the detail panel.

export const PALETTE = [
  { strong: '#3660A8', tint: '#EBF0F8' }, // blue
  { strong: '#0E7467', tint: '#E6F2F0' }, // teal
  { strong: '#754FA0', tint: '#F1ECF7' }, // plum
  { strong: '#AD4A68', tint: '#F8ECF0' }, // rose
  { strong: '#92650C', tint: '#F7F1E3' }, // bronze
  { strong: '#49762F', tint: '#ECF3E8' }, // green
  { strong: '#0C7490', tint: '#E5F2F6' }, // cyan
  { strong: '#A04438', tint: '#F8ECEA' }, // clay
  { strong: '#5B6472', tint: '#EDEFF2' }, // slate
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

// Formatting singletons: created once at module scope, never per render.

const compactMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const fullMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const integer = new Intl.NumberFormat('en-US')

export const money = value => compactMoney.format(value)
export const moneyFull = value => fullMoney.format(value)
export const count = value => integer.format(value)
export const ratio = value => value.toFixed(2)
export const ratioFull = value => value.toFixed(4)

// "👏 Exceeds Expectations" -> "Exceeds Expectations"
export const stripEmoji = text =>
  (text || '').replace(/^[^\p{L}\p{N}]+/u, '').trim()

export const initials = name =>
  (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('')

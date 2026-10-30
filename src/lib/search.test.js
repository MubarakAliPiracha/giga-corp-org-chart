import { describe, it, expect } from 'vitest'
import { searchPeople, ancestorIds } from './search.js'

function person(id, name, title, department) {
  return { person: { id, name, title, department }, parentId: null, childIds: [] }
}

const nodes = new Map([
  ['1', { ...person('1', 'Ada Lovelace', 'Engineer', 'Software Development') }],
  ['2', { ...person('2', 'Ada Lovelace', 'Designer', 'UX') }],
  ['3', { ...person('3', 'Grace Hopper', 'Rear Admiral', 'Navy') }],
  ['4', { ...person('4', 'Alan Turing', 'Ada specialist', 'Research') }],
])

describe('searchPeople', () => {
  it('returns empty for a blank query', () => {
    expect(searchPeople(nodes, '   ')).toEqual([])
  })

  it('ranks name prefix above name substring above title', () => {
    const results = searchPeople(nodes, 'ada')
    expect(results.map(r => r.person.id)).toEqual(['1', '2', '4'])
  })

  it('keeps duplicate names distinguishable by returning both nodes', () => {
    const results = searchPeople(nodes, 'Ada Lovelace')
    expect(results).toHaveLength(2)
    expect(new Set(results.map(r => r.person.title))).toEqual(new Set(['Engineer', 'Designer']))
  })

  it('matches on id and is case-insensitive', () => {
    expect(searchPeople(nodes, 'GRACE')[0].person.id).toBe('3')
  })

  it('caps results at the limit', () => {
    expect(searchPeople(nodes, 'a', 2)).toHaveLength(2)
  })
})

describe('ancestorIds', () => {
  it('walks parent pointers up to the root, excluding the person', () => {
    const chain = new Map([
      ['r', { parentId: null }],
      ['m', { parentId: 'r' }],
      ['x', { parentId: 'm' }],
    ])
    expect(ancestorIds(chain, 'x')).toEqual(['r', 'm'])
    expect(ancestorIds(chain, 'r')).toEqual([])
  })
})

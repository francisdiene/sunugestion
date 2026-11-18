import { describe, it, expect } from 'vitest'
import { fmtDate } from '../../src/lib/utils/dates'

describe('fmtDate', () => {
  it('formate une date au format français', () => {
    expect(fmtDate('2026-11-17T12:00:00')).toBe('17/11/2026')
  })

  it('retourne un tiret pour une valeur absente', () => {
    expect(fmtDate(null)).toBe('—')
    expect(fmtDate(undefined)).toBe('—')
    expect(fmtDate('')).toBe('—')
  })

  it('gère une date invalide sans planter', () => {
    expect(() => fmtDate('date-invalide')).not.toThrow()
  })
})
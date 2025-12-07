import { describe, it, expect } from '@jest/globals'

function isExpiredMessage(msg: string) {
  return msg.toLowerCase().includes('jwt expired')
}

function isMissingRoleColumn(msg: string) {
  return msg.toLowerCase().includes("could not find the 'role' column") || msg.toLowerCase().includes('column role')
}

describe('Supabase auth error handling', () => {
  it('detects expired JWT messages', () => {
    expect(isExpiredMessage('JWT expired')).toBe(true)
    expect(isExpiredMessage('jwt EXPIRED')).toBe(true)
    expect(isExpiredMessage('token invalid')).toBe(false)
  })

  it('detects missing role column messages', () => {
    expect(isMissingRoleColumn("Could not find the 'role' column of 'users' in the schema cache")).toBe(true)
    expect(isMissingRoleColumn('column role missing')).toBe(true)
    expect(isMissingRoleColumn('unknown error')).toBe(false)
  })
})


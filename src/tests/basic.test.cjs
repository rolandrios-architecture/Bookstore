const { describe, it, expect } = require('@jest/globals')

describe('basic sanity', () => {
  it('1 + 1 equals 2', () => {
    expect(1 + 1).toBe(2)
  })
})

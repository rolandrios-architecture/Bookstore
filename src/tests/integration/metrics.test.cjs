const { describe, it, expect } = require('@jest/globals')

const BASE = process.env.BASE_URL || 'http://localhost:4001'

describe('integration: metrics endpoint', () => {
  it('GET /metrics returns 200 and text content', async () => {
    const res = await fetch(`${BASE}/metrics`)
    const text = await res.text()
    expect(res.status).toBe(200)
    expect(typeof text).toBe('string')
    expect(text.length).toBeGreaterThan(0)
  }, 20000)
})

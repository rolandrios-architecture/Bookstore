const { describe, it, expect } = require('@jest/globals')

// polyfill fetch using dynamic import for node-fetch (works in CommonJS)
global.fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

const BASE = process.env.BASE_URL || 'http://localhost:8080'

describe('API Gateway integration (end-to-end)', () => {
  let createdId = null

  it('POST /api/v1/bookstore creates a book', async () => {
    const payload = {
      title: 'Integration Test Book',
      description: 'Created by integration test',
      price: 9.99,
      authorName: 'Test Author'
    }

    const res = await fetch(`${BASE}/api/v1/bookstore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json).toHaveProperty('id')
    createdId = json.id || json.data?.id || json._id
    expect(createdId).toBeTruthy()
  }, 30000)

  it('GET /api/v1/bookstore returns list including created book', async () => {
    const res = await fetch(`${BASE}/api/v1/bookstore`)
    const json = await res.json()
    expect(res.status).toBe(200)
    const found = Array.isArray(json) ? json.find(b => String(b.id) === String(createdId)) : null
    expect(found).toBeTruthy()
  }, 20000)

  it('GET /api/v1/bookstore/:id returns the book', async () => {
    const res = await fetch(`${BASE}/api/v1/bookstore/${createdId}`)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json).toHaveProperty('id')
    expect(String(json.id)).toBe(String(createdId))
  }, 20000)

  it('PUT /api/v1/bookstore/:id updates the book', async () => {
    const update = { title: 'Updated Title', description: 'Updated' }
    const res = await fetch(`${BASE}/api/v1/bookstore/${createdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.title === 'Updated Title' || json.data?.title === 'Updated Title').toBeTruthy()
  }, 20000)

  it('DELETE /api/v1/bookstore/:id deletes the book', async () => {
    const res = await fetch(`${BASE}/api/v1/bookstore/${createdId}`, { method: 'DELETE' })
    const json = await res.json()
    expect(res.status === 200 || res.status === 204).toBeTruthy()
  }, 20000)
})

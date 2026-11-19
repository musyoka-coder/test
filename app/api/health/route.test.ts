import { expect, it, vi } from 'vitest'
import { GET } from './route'

const mock = vi.hoisted(() => ({ configured: vi.fn(), query: vi.fn() }))
vi.mock('@/lib/db', () => ({
  configured: mock.configured,
  db: async () => ({
    from: () => ({
      select: () => ({ limit: () => ({ abortSignal: mock.query }) }),
    }),
  }),
}))

it('reports readiness when the package API responds and prevents caching', async () => {
  mock.configured.mockReturnValue(true)
  mock.query.mockResolvedValue({ error: null })
  const response = await GET()
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('no-store')
  await expect(response.json()).resolves.toEqual({ status: 'ok' })
})

it('reports degraded readiness without exposing database errors', async () => {
  mock.configured.mockReturnValue(true)
  mock.query.mockResolvedValue({ error: { message: 'private setup details' } })
  const response = await GET()
  expect(response.status).toBe(503)
  await expect(response.json()).resolves.toEqual({ status: 'degraded' })
})

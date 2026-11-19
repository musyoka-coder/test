import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authenticate } from './actions/auth'
import { requestBooking } from './actions/booking'
import { applyHost } from './actions/partners'
import { manage } from './actions/admin'

const mock = vi.hoisted(() => {
  const insert = vi.fn()
  const eq = vi.fn()
  const update = vi.fn()
  const secureToken = 'a'.repeat(43)
  return {
    insert,
    update,
    eq,
    secureToken,
    c: {
      auth: {
        signInWithPassword: vi.fn(),
        getUser: vi.fn(),
        signUp: vi.fn(),
        resetPasswordForEmail: vi.fn(),
      },
      from: vi.fn(() => ({ insert, update })),
      rpc: vi.fn(),
    },
    audit: vi.fn(),
  }
})
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: mock.secureToken }) }),
}))
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(path)
  },
}))
vi.mock('@/lib/db', () => ({ configured: () => true, db: async () => mock.c }))
vi.mock('@/lib/logger', () => ({ reportFailure: mock.audit }))

function form(data: Record<string, string>) {
  const values = new FormData()
  for (const [key, value] of Object.entries({
    csrf_token: mock.secureToken,
    ...data,
  }))
    values.set(key, value)
  return values
}
const host = {
  name: 'QA Host',
  email: 'qa@example.test',
  phone: '0700000000',
  county: 'Nakuru',
  area: 'Molo',
  available_from: '2027-01-01',
  available_until: '2027-04-01',
  capacity: '2',
  amenities: 'Kitchen',
  road: 'Gravel',
}
const booking = {
  months: '3',
  cabin: '',
  start: '2027-01-01',
  price: '45000',
  ack: 'on',
}

beforeEach(() => {
  vi.resetAllMocks()
  mock.c.from.mockReturnValue({ insert: mock.insert, update: mock.update })
  mock.insert.mockResolvedValue({ error: null })
  mock.update.mockReturnValue({ eq: mock.eq })
  mock.eq.mockResolvedValue({ error: null })
  mock.c.rpc.mockResolvedValue({ data: true, error: null })
  mock.c.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin' } } })
  mock.c.auth.signInWithPassword.mockResolvedValue({
    data: { user: { user_metadata: {} } },
    error: null,
  })
})

describe('account actions', () => {
  it('preserves a package across sign-in', async () => {
    await expect(
      authenticate(
        form({
          email: 'qa@example.test',
          password: 'test-password',
          months: '6',
        }),
      ),
    ).rejects.toThrow('/book?months=6')
    expect(mock.c.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'qa@example.test',
      password: 'test-password',
    })
  })
  it('rejects invalid data before calling the auth API', async () => {
    await expect(
      authenticate(form({ email: 'invalid', password: 'short' })),
    ).rejects.toThrow('Enter+a+valid+email')
    expect(mock.c.auth.signInWithPassword).not.toHaveBeenCalled()
  })
  it('uses the configured callback and returns a neutral recovery response', async () => {
    mock.c.auth.resetPasswordForEmail.mockResolvedValue({
      error: { code: 'unknown_user' },
    })
    vi.stubEnv('APP_URL', 'https://quiet.example.test')
    try {
      await expect(
        authenticate(form({ mode: 'forgot', email: 'qa@example.test' })),
      ).rejects.toThrow('If+your+account+exists')
      expect(mock.c.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'qa@example.test',
        { redirectTo: 'https://quiet.example.test/auth/verify?mode=reset' },
      )
    } finally {
      vi.unstubAllEnvs()
    }
  })
})

describe('booking, host and admin actions', () => {
  it('submits a validated booking with the exact quote', async () => {
    await expect(requestBooking(form(booking))).rejects.toThrow(
      'Booking+request+submitted',
    )
    expect(mock.c.rpc).toHaveBeenCalledWith('request_booking', {
      p_months: 3,
      p_cabin: null,
      p_start: '2027-01-01',
      p_price: 45000,
      p_interests: [],
    })
  })
  it('rejects invalid dates and CSRF tokens before any write', async () => {
    await expect(
      requestBooking(form({ ...booking, start: '2027-02-30' })),
    ).rejects.toThrow('Choose+a+valid+date')
    await expect(
      requestBooking(form({ ...booking, csrf_token: 'wrong' })),
    ).rejects.toThrow('form+session+expired')
    expect(mock.c.rpc).not.toHaveBeenCalled()
  })
  it('accepts a known activity but rejects an arbitrary one', async () => {
    await expect(
      applyHost(form({ ...host, activities: 'Beekeeping' })),
    ).rejects.toThrow('Application+received')
    await expect(
      applyHost(form({ ...host, activities: 'unknown' })),
    ).rejects.toThrow('Check+your+contact')
    expect(mock.insert).toHaveBeenCalledTimes(1)
    expect(mock.insert).toHaveBeenCalledWith(
      expect.objectContaining({ activities: ['Beekeeping'], capacity: 2 }),
    )
  })
  it('does not surface backend messages to guests', async () => {
    mock.insert.mockResolvedValue({
      error: { code: '23514', message: 'private details' },
    })
    await expect(applyHost(form(host))).rejects.toThrow(
      'Application+could+not+be+saved',
    )
    expect(mock.audit).toHaveBeenCalledWith(
      'apply_host',
      expect.objectContaining({ code: '23514' }),
    )
  })
  it('requires admin privileges and an integer price', async () => {
    mock.c.rpc.mockResolvedValueOnce({ data: false })
    await expect(
      manage(form({ action: 'price', id: '3', price: '46000' })),
    ).rejects.toThrow('/dashboard')
    await expect(
      manage(form({ action: 'price', id: '3', price: '4.5' })),
    ).rejects.toThrow('Check+the+submitted+details')
    await expect(
      manage(form({ action: 'price', id: '3', price: '46000' })),
    ).rejects.toThrow('Changes+saved')
    expect(mock.update).toHaveBeenCalledExactlyOnceWith({ price: 46000 })
  })
})

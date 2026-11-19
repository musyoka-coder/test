import { expect, it } from 'vitest'
import { appOrigin, contentPolicy, randomToken, tokensMatch } from './security'

it('uses a trusted canonical origin and validates its shape', () => {
  expect(
    appOrigin({
      APP_URL: 'https://quiet.example.test',
      VERCEL_URL: 'preview.example.test',
    }),
  ).toBe('https://quiet.example.test')
  expect(appOrigin({ VERCEL_URL: 'preview.example.test' })).toBe(
    'https://preview.example.test',
  )
  expect(
    appOrigin({
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'quiet.example.test',
      VERCEL_URL: 'deployment.example.test',
    }),
  ).toBe('https://quiet.example.test')
  expect(() =>
    appOrigin({ APP_URL: 'https://quiet.example.test/redirect' }),
  ).toThrow('Invalid application origin')
})

it('checks exact constant-length tokens', () => {
  const token = randomToken()
  expect(tokensMatch(token, token)).toBe(true)
  expect(tokensMatch(token, randomToken())).toBe(false)
  expect(tokensMatch(token, null)).toBe(false)
})

it('requires nonces for scripts and blocks embedding and cross-origin form posting', () => {
  const policy = contentPolicy('nonce', false)
  expect(policy).toContain("'nonce-nonce'")
  expect(policy).toContain("frame-ancestors 'none'")
  expect(policy).toContain("form-action 'self'")
  expect(policy).not.toContain("'unsafe-eval'")
})

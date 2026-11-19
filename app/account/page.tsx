import { CsrfField } from '../csrf-field'
import Link from 'next/link'
import { authenticate } from '../actions/auth'
import { Field, Flash, Heading, one, type PageProps } from '../ui'
import { selection } from '@/lib/site'

export default async function Account({ searchParams }: PageProps) {
  const query = await searchParams
  const mode = one(query, 'mode')
  const choice = selection(one(query, 'months'), one(query, 'cabin'))
  const title =
    mode === 'signup'
      ? 'Create your account.'
      : mode === 'forgot'
        ? 'Reset your password.'
        : mode === 'reset'
          ? 'Set a new password.'
          : 'Sign in.'
  const account = (next: string) =>
    '/account?' + new URLSearchParams([...choice, ['mode', next]])
  return (
    <main className="shell content narrow">
      <Heading label="GUEST ACCOUNT" title={title}>
        {choice.has('months')
          ? 'Continue your ' + choice.get('months') + '-month stay request.'
          : 'Manage your stay requests.'}
      </Heading>
      <Flash query={query} />
      <form className="card form" action={authenticate}>
        <CsrfField />
        <input type="hidden" name="mode" value={mode} />
        {[...choice].map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        {mode !== 'reset' && <Field label="Email" name="email" type="email" />}
        {mode !== 'forgot' && (
          <label>
            {mode === 'reset' ? 'New password' : 'Password'}
            <input
              type="password"
              name="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete={
                mode === 'signup' || mode === 'reset'
                  ? 'new-password'
                  : 'current-password'
              }
            />
          </label>
        )}
        <button className="button">
          {mode === 'signup'
            ? 'Create account'
            : mode === 'forgot'
              ? 'Send reset link'
              : mode === 'reset'
                ? 'Save password'
                : 'Sign in'}
        </button>
      </form>
      <div className="actions section">
        {mode === 'signup' || mode === 'forgot' ? (
          <Link href={account('signin')}>Sign in</Link>
        ) : (
          mode !== 'reset' && (
            <>
              <Link href={account('signup')}>Create an account</Link>
              <Link href={account('forgot')}>Forgot password?</Link>
            </>
          )
        )}
      </div>
    </main>
  )
}

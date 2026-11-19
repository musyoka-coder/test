'use server'

import { redirect } from 'next/navigation'
import { reportFailure } from '@/lib/logger'
import { client, fields, result } from './shared'
import { appOrigin } from '@/lib/security'
import { selection } from '@/lib/site'
import { authInput } from '@/lib/validation'

export async function authenticate(form: FormData) {
  const choice = selection(form.get('months'), form.get('cabin'))
  const mode = form.get('mode') || 'signin'
  const query = new URLSearchParams(choice)
  if (typeof mode === 'string' && ['signup', 'forgot', 'reset'].includes(mode))
    query.set('mode', mode)
  const path = '/account?' + query
  const parsed = authInput.safeParse({ ...fields(form), mode })
  const s = await client(path, form)
  if (!parsed.success)
    result(
      path,
      'Enter a valid email and use a password of 8 characters or more, up to 72 bytes.',
    )
  const input = parsed.data
  const callback = new URL('/auth/verify', appOrigin())

  if (input.mode === 'forgot') {
    callback.searchParams.set('mode', 'reset')
    const { error } = await s.auth.resetPasswordForEmail(input.email, {
      redirectTo: callback.href,
    })
    if (error) await reportFailure('password_recovery', error)
    result(path, 'If your account exists, a reset link is on its way.', true)
  }

  if (input.mode === 'reset') {
    const { error } = await s.auth.updateUser({ password: input.password })
    if (error) {
      await reportFailure('password_update', error)
      result(
        path,
        'Password could not be updated. Request a fresh reset link and try again.',
      )
    }
    result('/dashboard', 'Password updated.', true)
  }

  if (input.mode === 'signup') {
    callback.search = choice.toString()
    const { data, error } = await s.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: callback.href,
        data: {
          booking_months: choice.get('months'),
          booking_cabin: choice.get('cabin'),
        },
      },
    })
    if (error) {
      await reportFailure('signup', error)
      result(
        path,
        'Account could not be created. Check your details or try again later.',
      )
    }
    if (data.session) redirect(choice.size ? '/book?' + choice : '/dashboard')
    result(
      path,
      'Check your email and follow the verification link to continue.',
      true,
    )
  }

  const { data, error } = await s.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })
  if (error) {
    await reportFailure('signin', error)
    result(
      path,
      'Sign-in failed. Check your credentials and verify your email.',
    )
  }
  if (!choice.size) {
    const saved = selection(
      data.user.user_metadata.booking_months,
      data.user.user_metadata.booking_cabin,
    )
    if (saved.size) redirect('/book?' + saved)
  }
  redirect(choice.size ? '/book?' + choice : '/dashboard')
}

export async function logout(form: FormData) {
  const s = await client('/account', form)
  const { error } = await s.auth.signOut()
  if (error) {
    await reportFailure('signout', error)
    result('/dashboard', 'Sign-out failed. Try again.')
  }
  redirect('/')
}

'use server'

import { reportFailure } from '@/lib/logger'
import { hostInput } from '@/lib/validation'
import { client, fields, result } from './shared'

export async function applyHost(form: FormData) {
  const path = '/partners'
  const s = await client(path, form)
  const parsed = hostInput.safeParse({
    ...fields(form),
    activities: form.getAll('activities'),
  })
  if (!parsed.success)
    result(
      path,
      'Check your contact details, capacity, and that the end date follows the start date.',
    )
  const { error } = await s.from('host_applications').insert(parsed.data)
  if (error) {
    await reportFailure('apply_host', error)
    result(path, 'Application could not be saved. Try again later.')
  }
  result(
    path,
    'Application received. We’ll review your cabin details before listing it.',
    true,
  )
}

'use server'

import { redirect } from 'next/navigation'
import { reportFailure } from '@/lib/logger'
import { client, fields, result } from './shared'
import { skills } from '@/lib/site'
import { adminInput } from '@/lib/validation'

export async function manage(form: FormData) {
  const s = await client('/admin', form)
  const {
    data: { user },
  } = await s.auth.getUser()
  if (!user) redirect('/account')
  const { data: allowed } = await s.rpc('is_admin')
  if (!allowed) redirect('/dashboard')
  const parsed = adminInput.safeParse(fields(form))
  if (!parsed.success)
    result('/admin', 'Check the submitted details and try again.')
  const item = parsed.data
  let error
  switch (item.action) {
    case 'price':
      ;({ error } = await s
        .from('packages')
        .update({ price: item.price })
        .eq('months', item.id))
      break
    case 'host':
      ;({ error } = await s
        .from('host_applications')
        .update({ status: item.status })
        .eq('id', item.id)
        .eq('status', 'Pending'))
      break
    case 'booking':
      ;({ error } = await s.rpc('review_booking', {
        p_id: item.id,
        p_status: item.status,
        p_cabin: item.cabin,
      }))
      break
    case 'cabin': {
      const { action, id, published, directions, ...details } = item
      const activities = Object.fromEntries(
        skills.flatMap((skill) => {
          const setting = form.get(skill)
          return setting === 'included' || setting === 'optional'
            ? [[skill, setting === 'included']]
            : []
        }),
      )
      const response = await s.rpc('save_cabin', {
        p_host: id,
        p_details: { ...details, published: published === 'on' },
        p_directions: directions,
        p_activities: activities,
      })
      if (response.error) await reportFailure(action, response.error)
      if (response.error)
        result(
          '/admin',
          'The cabin could not be saved. Verify the host approval and cabin details.',
        )
      break
    }
  }
  if (error) {
    await reportFailure(item.action, error)
    result(
      '/admin',
      'Changes could not be saved. Review the current status and cabin availability.',
    )
  }
  result('/admin', 'Changes saved.', true)
}

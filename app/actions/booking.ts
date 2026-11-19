'use server'

import { reportFailure } from '@/lib/logger'
import { selection } from '@/lib/site'
import { acceptanceInput, bookingInput } from '@/lib/validation'
import { client, fields, result } from './shared'

export async function requestBooking(form: FormData) {
  const choice = selection(form.get('months'), form.get('cabin'))
  const s = await client('/book?' + choice, form)
  const parsed = bookingInput.safeParse({
    ...fields(form),
    interests: form.getAll('interests'),
  })
  if (!parsed.success)
    result(
      '/book?' + choice,
      'Choose a valid date and review the stay inclusions.',
    )
  const item = parsed.data
  const path = '/book?' + choice + '&start=' + item.start
  const { error } = await s.rpc('request_booking', {
    p_months: item.months,
    p_cabin: item.cabin,
    p_start: item.start,
    p_price: item.price,
    p_interests: item.interests,
  })
  if (error) {
    reportFailure('request_booking', error)
    result(
      path,
      'The request could not be saved. Check the current price and cabin availability.',
    )
  }
  result(
    '/dashboard',
    'Booking request submitted. Confirmation is pending.',
    true,
  )
}

export async function acceptCabin(form: FormData) {
  const path = '/dashboard'
  const s = await client(path, form)
  const parsed = acceptanceInput.safeParse(fields(form))
  if (!parsed.success) result(path, 'Review the stay inclusions first.')
  const { error } = await s.rpc('accept_cabin', { p_id: parsed.data.id })
  if (error) {
    reportFailure('accept_cabin', error)
    result(
      path,
      'This cabin assignment could not be accepted. Refresh the dashboard.',
    )
  }
  result(path, 'Cabin assignment accepted.', true)
}

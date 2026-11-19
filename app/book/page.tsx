import { CsrfField } from '../csrf-field'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { configured, db } from '@/lib/db'
import { money, selection, today } from '@/lib/site'
import { catalog } from '../catalog'
import { requestBooking } from '../actions/booking'
import {
  CabinDetails,
  Checks,
  Field,
  Flash,
  Heading,
  one,
  type PageProps,
} from '../ui'
export default async function Book({ searchParams }: PageProps) {
  const query = await searchParams
  const choice = selection(one(query, 'months'), one(query, 'cabin'))
  const months = Number(choice.get('months'))
  if (!months) redirect('/packages')
  if (!configured())
    return (
      <main className="shell content">
        <Heading label="BOOKING" title="Booking is temporarily unavailable." />
        <Link href="/packages">Back to packages</Link>
      </main>
    )
  const s = await db()
  const {
    data: { user },
  } = await s.auth.getUser()
  if (!user) redirect('/account?mode=signup&' + choice)
  const { packages, cabins, offline } = await catalog()
  const rate = packages.find((p) => p.months === months)
  const start = one(query, 'start')
  const availability = /^\d{4}-\d{2}-\d{2}$/.test(start)
    ? await s.rpc('available_cabins', { p_months: months, p_start: start })
    : null
  const options = cabins.filter((c) => availability?.data?.includes(c.id))
  const selected = options.find((c) => c.id === choice.get('cabin'))
  const preview = cabins.find((c) => c.id === choice.get('cabin'))
  return (
    <main className="shell content narrow">
      <Heading
        label="BOOKING REQUEST"
        title={'Request a ' + months + '-month stay.'}
      >
        {rate
          ? money(rate.price) +
            ' total. Your request stays pending until it is reviewed. No payment is collected here.'
          : 'This package is currently unavailable.'}
      </Heading>
      <Flash query={query} />
      {rate && !offline && (
        <>
          <form className="form card">
            <input type="hidden" name="months" value={months} />
            <Field
              label="Preferred start date"
              name="start"
              type="date"
              initial={start}
              min={today()}
            />
            <label>
              Cabin preference
              <select name="cabin" defaultValue={choice.get('cabin') ?? ''}>
                <option value="">No preference yet</option>
                {(availability && !availability.error ? options : cabins).map(
                  (c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} · {c.county}
                    </option>
                  ),
                )}
                {choice.has('cabin') &&
                  availability &&
                  !selected &&
                  preview && (
                    <option value={preview.id}>
                      {preview.title} · unavailable for these dates
                    </option>
                  )}
              </select>
            </label>
            <button className="button outline">Check availability</button>
          </form>
          {availability?.error && (
            <p className="alert error">
              Availability could not be checked. Choose a valid date.
            </p>
          )}
          {availability && !availability.error && (
            <div className="section">
              <p>
                {options.length
                  ? options.length + ' cabin option(s) for these dates.'
                  : 'No approved cabin is currently available for these dates. You can still request a stay without a cabin preference.'}
              </p>
              {choice.has('cabin') && !selected && (
                <p className="alert error">
                  This cabin is unavailable on those dates. Choose another
                  option or submit without a cabin preference.
                </p>
              )}
              {selected && (
                <article className="card section">
                  <h2>{selected.title}</h2>
                  <CabinDetails cabin={selected} />
                </article>
              )}
              {(!choice.has('cabin') || selected) && (
                <form className="card form section" action={requestBooking}>
                  <CsrfField />
                  <input type="hidden" name="months" value={months} />
                  <input
                    type="hidden"
                    name="cabin"
                    value={selected?.id ?? ''}
                  />
                  <input type="hidden" name="start" value={start} />
                  <input type="hidden" name="price" value={rate.price} />
                  <fieldset>
                    <legend>Optional skill interests</legend>
                    <Checks name="interests" />
                  </fieldset>
                  <label className="check">
                    <input name="ack" type="checkbox" required />
                    {selected
                      ? 'I reviewed the included activities, meals, transport, and amenities.'
                      : 'I understand cabin inclusions depend on the eventual assignment and will be disclosed before I accept the cabin.'}
                  </label>
                  <button className="button">Submit booking request</button>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </main>
  )
}

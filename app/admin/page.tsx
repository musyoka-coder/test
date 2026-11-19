import { CsrfField } from '../csrf-field'
import { redirect } from 'next/navigation'
import { configured, db } from '@/lib/db'
import { money, skills } from '@/lib/site'
import { manage } from '../actions/admin'
import { Field, Flash, Heading, type Cabin, type PageProps } from '../ui'

export default async function Admin({ searchParams }: PageProps) {
  const query = await searchParams
  if (!configured()) redirect('/account')
  const s = await db()
  const {
    data: { user },
  } = await s.auth.getUser()
  const { data: allowed } = await s.rpc('is_admin')
  if (!user || !allowed) redirect('/dashboard')
  const results = await Promise.all([
    s.from('packages').select('*').order('months'),
    s
      .from('host_applications')
      .select('*')
      .order('created_at', { ascending: false }),
    s.from('cabins').select('*,cabin_activities(activity,included)'),
    s
      .from('bookings')
      .select('*,profiles(username)')
      .order('created_at', { ascending: false }),
    s.from('cabin_directions').select('*'),
  ])
  const [rates, hosts, stays, bookings, directions] = results
  const cabins = (stays.data ?? []) as Cabin[]
  return (
    <main className="shell content">
      <Heading label="ADMIN" title="Manage Quiet Reset." />
      <Flash query={query} />
      {results.some((r) => r.error) && (
        <p className="alert error">
          Some admin data could not be loaded. Refresh before making changes.
        </p>
      )}
      <section className="stack">
        <h2>Package prices</h2>
        <div className="grid">
          {rates.data?.map((p) => (
            <form className="card form" key={p.months} action={manage}>
              <CsrfField />
              <input type="hidden" name="action" value="price" />
              <input type="hidden" name="id" value={p.months} />
              <Field
                label={p.months + ' months · total KSh'}
                name="price"
                type="number"
                initial={p.price}
                min={1}
              />
              <button className="button outline">Save price</button>
            </form>
          ))}
        </div>
      </section>
      <section className="stack section">
        <h2>Host applications and cabins</h2>
        {!hosts.data?.length && <p>No applications yet.</p>}
        {hosts.data?.map((h) => {
          const c = cabins.find((c) => c.host_id === h.id)
          const arrival = directions.data?.find(
            (d) => d.cabin_id === c?.id,
          )?.directions
          return (
            <article className="card" key={h.id}>
              <p className="eyebrow">
                {h.status}
                {c ? (c.published ? ' · Published' : ' · Cabin draft') : ''}
              </p>
              <h3>
                {h.name} · {h.county}
              </h3>
              <p>
                {h.email} · {h.phone}
              </p>
              <p>
                {h.area} · Sleeps {h.capacity} · {h.available_from} to{' '}
                {h.available_until}
              </p>
              <p>
                {h.amenities} · {h.road}
              </p>
              <p>{h.activities.join(', ') || 'No activities offered'}</p>
              {h.status === 'Pending' && (
                <form className="actions" action={manage}>
                  <CsrfField />
                  <input type="hidden" name="action" value="host" />
                  <input type="hidden" name="id" value={h.id} />
                  <button className="button" name="status" value="Approved">
                    Approve host
                  </button>
                  <button
                    className="button outline"
                    name="status"
                    value="Declined"
                  >
                    Decline
                  </button>
                </form>
              )}
              {h.status === 'Approved' && (
                <details>
                  <summary>{c ? 'Edit cabin' : 'Add a cabin'}</summary>
                  <form className="form" action={manage}>
                    <CsrfField />
                    <input type="hidden" name="action" value="cabin" />
                    <input type="hidden" name="id" value={h.id} />
                    <div className="form-grid">
                      <Field
                        label="Cabin title"
                        name="title"
                        initial={c?.title}
                      />
                      <Field
                        label="Bedrooms"
                        name="bedrooms"
                        type="number"
                        min={1}
                        max={30}
                        initial={c?.bedrooms}
                      />
                      <Field
                        label="Water supply"
                        name="water"
                        initial={c?.water}
                      />
                      <Field
                        label="Electricity"
                        name="electricity"
                        initial={c?.electricity}
                      />
                      <label>
                        Mobile coverage
                        <select
                          name="connectivity"
                          defaultValue={c?.connectivity}
                        >
                          <option>Reliable</option>
                          <option>Limited</option>
                          <option>None</option>
                        </select>
                      </label>
                      <label>
                        Accessibility
                        <select
                          name="accessibility"
                          defaultValue={c?.accessibility}
                        >
                          <option>Step-free</option>
                          <option>Steps or uneven ground</option>
                        </select>
                      </label>
                      <Field
                        label="Distance to health facility (km)"
                        name="health_km"
                        type="number"
                        min={0}
                        initial={c?.health_km}
                      />
                      <Field
                        label="Included amenities"
                        name="amenities"
                        initial={c?.amenities}
                      />
                      <Field
                        label="Meals and what’s included"
                        name="meals"
                        initial={c?.meals}
                      />
                      <Field
                        label="Transport and what’s included"
                        name="transport"
                        initial={c?.transport}
                      />
                    </div>
                    <label>
                      Private arrival directions
                      <textarea
                        name="directions"
                        required
                        maxLength={2000}
                        defaultValue={arrival}
                      />
                    </label>
                    {skills
                      .filter((skill) => h.activities.includes(skill))
                      .map((skill) => {
                        const activity = c?.cabin_activities.find(
                          (a) => a.activity === skill,
                        )
                        return (
                          <label key={skill}>
                            {skill}
                            <select
                              name={skill}
                              defaultValue={
                                activity
                                  ? activity.included
                                    ? 'included'
                                    : 'optional'
                                  : ''
                              }
                            >
                              <option value="">Not offered</option>
                              <option value="included">Included</option>
                              <option value="optional">
                                Optional, separate arrangement
                              </option>
                            </select>
                          </label>
                        )
                      })}
                    <label className="check">
                      <input
                        name="published"
                        type="checkbox"
                        defaultChecked={c?.published}
                      />
                      Publish this cabin
                    </label>
                    <button className="button">Save cabin</button>
                  </form>
                </details>
              )}
            </article>
          )
        })}
      </section>
      <section className="stack section">
        <h2>Bookings</h2>
        {!bookings.data?.length && <p>No requests yet.</p>}
        {bookings.data?.map((b) => (
          <article className="card" key={b.id}>
            <p className="eyebrow">{b.status}</p>
            <h3>
              {b.months} months · {money(b.quote)}
            </h3>
            <p>
              {b.profiles?.username} · {b.start_date} to {b.end_date}
            </p>
            <p>{b.interests.join(', ') || 'No skill interests selected'}</p>
            {['Pending', 'Confirmed'].includes(b.status) && (
              <form className="form" action={manage}>
                <CsrfField />
                <input type="hidden" name="action" value="booking" />
                <input type="hidden" name="id" value={b.id} />
                {b.status === 'Pending' && (
                  <label>
                    Assign cabin
                    <select name="cabin" defaultValue={b.cabin_id ?? ''}>
                      <option value="">Choose cabin</option>
                      {cabins
                        .filter((c) => c.published)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} · {c.county}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                <div className="actions">
                  {b.status === 'Pending' && (
                    <>
                      <button
                        className="button"
                        name="status"
                        value="Confirmed"
                      >
                        Confirm stay
                      </button>
                      <button
                        className="button outline"
                        name="status"
                        value="Declined"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  <button
                    className="button outline"
                    name="status"
                    value="Cancelled"
                  >
                    Cancel stay
                  </button>
                </div>
              </form>
            )}
          </article>
        ))}
      </section>
    </main>
  )
}

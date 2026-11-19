import Link from 'next/link'
import { catalog } from '../catalog'
import { CabinDetails, Heading, one, type PageProps } from '../ui'
import { skills } from '@/lib/site'

export default async function Stays({ searchParams }: PageProps) {
  const query = await searchParams
  const { cabins, packages, offline } = await catalog()
  const county = one(query, 'county'),
    activity = one(query, 'activity'),
    connection = one(query, 'connection'),
    access = one(query, 'access')
  const matches = cabins.filter(
    (c) =>
      (!county || c.county === county) &&
      (!activity || c.cabin_activities.some((a) => a.activity === activity)) &&
      (!connection || c.connectivity === connection) &&
      (!access || c.accessibility === access),
  )
  const filters = [
    ['county', 'County', [...new Set(cabins.map((c) => c.county))]],
    ['activity', 'Learning activity', skills],
    ['connection', 'Mobile coverage', ['Reliable', 'Limited', 'None']],
    ['access', 'Accessibility', ['Step-free', 'Steps or uneven ground']],
  ] as const
  return (
    <main className="shell content">
      <Heading label="RURAL STAYS" title="Find a cabin that fits.">
        Cabin listings show an approximate area. Exact directions are shared
        privately after confirmation.
      </Heading>
      <form className="card form filters">
        {filters.map(([name, label, options]) => (
          <label key={name}>
            {label}
            <select name={name} defaultValue={one(query, name)}>
              <option value="">Any</option>
              {options.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        ))}
        <button className="button">Filter stays</button>
      </form>
      {offline && (
        <p className="alert">The live catalog is temporarily unavailable.</p>
      )}
      {!matches.length && (
        <p className="section">
          {cabins.length
            ? 'No cabins match these filters.'
            : 'Approved cabins will appear here when hosts publish their listings.'}
        </p>
      )}
      <div className="stack section">
        {matches.map((c) => (
          <article className="card" key={c.id}>
            <p className="eyebrow">
              {c.county} · {c.area}
            </p>
            <h2>{c.title}</h2>
            <CabinDetails cabin={c} />
            <div className="actions">
              {packages.map((p) => (
                <Link
                  className="button outline"
                  key={p.months}
                  href={'/book?months=' + p.months + '&cabin=' + c.id}
                >
                  Book {p.months} months
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>
      <article className="card section">
        <p className="eyebrow">
          ILLUSTRATIVE EXAMPLE · UNAVAILABLE FOR BOOKING
        </p>
        <h2>Highland garden cabin</h2>
        <p>
          A sample of what a listing could look like near Molo, Nakuru County.
        </p>
        <CabinDetails
          cabin={{
            id: 'sample',
            host_id: 'sample',
            title: 'Highland garden cabin',
            county: 'Nakuru',
            area: 'Molo highlands',
            capacity: 2,
            bedrooms: 1,
            water: 'Rainwater tank',
            electricity: 'Solar',
            connectivity: 'Limited',
            road: 'Unpaved final stretch',
            accessibility: 'Steps or uneven ground',
            health_km: 8,
            amenities: 'Basic kitchen, bedding, desk',
            meals: 'Self-catering',
            transport: 'Arrange your own',
            available_from: '',
            available_until: '',
            published: false,
            cabin_activities: [
              { activity: 'Kitchen gardening', included: false },
            ],
          }}
        />
      </article>
    </main>
  )
}

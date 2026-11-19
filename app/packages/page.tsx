import { catalog } from '../catalog'
import { Heading, Rates } from '../ui'
export default async function Packages() {
  const { packages, offline } = await catalog()
  return (
    <main className="shell content">
      <Heading label="PACKAGES" title="Choose your length of stay.">
        Monthly equivalents are for price comparison. Each package shows the
        full price for the stay.
      </Heading>
      {offline && (
        <p className="alert">
          Showing launch prices while the live catalog is unavailable.
        </p>
      )}
      <Rates packages={packages} />
      <div className="card section">
        <h2>What your stay includes</h2>
        <p>
          Each booking is for cabin accommodation. Check the individual cabin
          for bedrooms, water, electricity, mobile coverage, road access, and
          distance to a health facility. Meals, transport, and practical
          learning vary by host. Review the cabin details before requesting a
          stay.
        </p>
        <p>
          Requests are reviewed before confirmation. No payment is collected
          here.
        </p>
      </div>
    </main>
  )
}

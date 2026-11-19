import { CsrfField } from '../csrf-field'
import { applyHost } from '../actions/partners'
import { Checks, Field, Flash, Heading, type PageProps } from '../ui'

export default async function Partners({ searchParams }: PageProps) {
  const query = await searchParams
  return (
    <main className="shell content narrow">
      <Heading label="FARMER PARTNERSHIPS" title="List an idle cabin.">
        Earn from an unused cabin. If you want to teach a skill, tell us what
        you can offer. We review each application before a cabin goes live.
      </Heading>
      <Flash query={query} />
      <form className="card form" action={applyHost}>
        <CsrfField />
        <div className="form-grid">
          <Field label="Contact name" name="name" />
          <Field label="Email address" name="email" type="email" />
          <Field label="Phone number" name="phone" type="tel" />
          <Field label="County" name="county" />
          <Field label="Approximate area" name="area" />
          <Field
            label="Guest capacity"
            name="capacity"
            type="number"
            min={1}
            max={30}
          />
          <Field label="Available from" name="available_from" type="date" />
          <Field label="Available until" name="available_until" type="date" />
        </div>
        <label>
          Amenities
          <textarea
            name="amenities"
            maxLength={2000}
            required
            placeholder="Bedrooms, water, electricity, mobile coverage, and other amenities"
          />
        </label>
        <Field label="Road access" name="road" />
        <fieldset>
          <legend>Activities you can offer</legend>
          <Checks name="activities" />
        </fieldset>
        <button className="button">Submit application</button>
      </form>
    </main>
  )
}

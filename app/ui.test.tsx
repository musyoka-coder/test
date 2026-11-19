// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { CabinDetails, Field, Flash, Rates } from './ui'

afterEach(cleanup)

it('renders labelled required fields and escapes alert text', () => {
  render(
    <>
      <Field name="email" label="Email" type="email" />
      <Flash query={{ error: '<b>Invalid</b>' }} />
    </>,
  )
  expect(screen.getByLabelText('Email').hasAttribute('required')).toBe(true)
  expect(screen.getByRole('status').textContent).toBe('<b>Invalid</b>')
  expect(screen.getByRole('status').querySelector('b')).toBeNull()
})

it('keeps booking duration and cabin in the package link', () => {
  render(<Rates packages={[{ months: 3, price: 45000 }]} cabin="demo" />)
  expect(
    screen.getByRole('link', { name: /Book this stay/i }).getAttribute('href'),
  ).toBe('/book?months=3&cabin=demo')
  expect(screen.getByText(/15,000/)).toBeTruthy()
})

it('renders cabin details and activity pricing status', () => {
  render(
    <CabinDetails
      cabin={{
        id: 'demo',
        host_id: 'host',
        title: 'Cabin',
        county: 'Nakuru',
        area: 'Molo',
        capacity: 2,
        bedrooms: 1,
        water: 'Tank',
        electricity: 'Solar',
        connectivity: 'Limited',
        road: 'Gravel',
        accessibility: 'Step-free',
        health_km: 8,
        amenities: 'Kitchen',
        meals: 'Self-catering',
        transport: 'Self-arranged',
        available_from: '2027-01-01',
        available_until: '2027-05-01',
        published: true,
        cabin_activities: [{ activity: 'Farming', included: true }],
      }}
    />,
  )
  expect(screen.getByText('Farming (included)')).toBeTruthy()
  expect(screen.getByText('8 km')).toBeTruthy()
})

import { configured, db } from '@/lib/db'
import { launch } from '@/lib/site'
import type { Cabin, Package } from './ui'

export async function catalog() {
  if (!configured())
    return { packages: launch, cabins: [] as Cabin[], offline: true }
  const s = await db()
  const [rates, stays] = await Promise.all([
    s
      .from('packages')
      .select('months,price')
      .eq('active', true)
      .order('months'),
    s
      .from('cabins')
      .select('*,cabin_activities(activity,included)')
      .eq('published', true)
      .order('county'),
  ])
  return {
    packages: (rates.data ?? launch) as Package[],
    cabins: (stays.data ?? []) as Cabin[],
    offline: Boolean(rates.error || stays.error),
  }
}

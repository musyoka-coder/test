export const skills = ['Beekeeping', 'Farming', 'Kitchen gardening']
export const launch = [
  { months: 3, price: 45000 },
  { months: 6, price: 84000 },
  { months: 12, price: 156000 },
]
export const money = (amount: number) =>
  'KSh ' +
  new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(amount)
export const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
export function selection(months: unknown, cabin: unknown) {
  const query = new URLSearchParams()
  if (['3', '6', '12'].includes(String(months)))
    query.set('months', String(months))
  if (typeof cabin === 'string' && /^[0-9a-f-]{36}$/i.test(cabin))
    query.set('cabin', cabin)
  return query
}

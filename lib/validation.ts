import { z } from 'zod'
import { skills } from './site'

const string = (max: number, min = 1) => z.string().trim().min(min).max(max)
const integer = (min: number, max: number) =>
  z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(min).max(max))
const email = z.string().trim().max(254).pipe(z.email())
const password = z
  .string()
  .min(8)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72)
const activities = z.array(z.enum(skills)).max(3)
export const id = z.uuid()
const optionalId = z
  .union([id, z.literal('')])
  .transform((value) => value || null)
const months = z.enum(['3', '6', '12']).transform(Number)
const price = integer(1, 2147483647)
const ack = z.literal('on')

export const authInput = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('signup'), email, password }),
  z.object({ mode: z.literal('signin'), email, password }),
  z.object({ mode: z.literal('forgot'), email }),
  z.object({ mode: z.literal('reset'), password }),
])
export const bookingInput = z.object({
  months,
  cabin: optionalId,
  start: z.iso.date(),
  price,
  interests: activities,
  ack,
})
export const acceptanceInput = z.object({ id, ack })
export const hostInput = z
  .object({
    name: string(100, 2),
    email,
    phone: string(25).regex(/^[+0-9 ()-]{7,25}$/),
    county: string(60, 2),
    area: string(120, 2),
    available_from: z.iso.date(),
    available_until: z.iso.date(),
    capacity: integer(1, 30),
    amenities: string(2000, 2),
    road: string(300, 2),
    activities,
  })
  .refine((item) => item.available_until > item.available_from)
export const adminInput = z.discriminatedUnion('action', [
  z.object({ action: z.literal('price'), id: months, price }),
  z.object({
    action: z.literal('host'),
    id,
    status: z.enum(['Approved', 'Declined']),
  }),
  z.object({
    action: z.literal('booking'),
    id,
    status: z.enum(['Confirmed', 'Declined', 'Cancelled']),
    cabin: optionalId.optional().transform((value) => value ?? null),
  }),
  z.object({
    action: z.literal('cabin'),
    id,
    title: string(100, 2),
    bedrooms: integer(1, 30),
    water: string(300),
    electricity: string(300),
    connectivity: z.enum(['Reliable', 'Limited', 'None']),
    accessibility: z.enum(['Step-free', 'Steps or uneven ground']),
    health_km: z
      .string()
      .regex(/^\d{1,4}(\.\d)?$/)
      .transform(Number),
    amenities: string(300),
    meals: string(300),
    transport: string(300),
    directions: string(2000, 4),
    published: z.literal('on').optional(),
  }),
])

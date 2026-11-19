import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function configured() {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY,
  )
}
export async function db() {
  const jar = await cookies()
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (items) => {
          try {
            for (const { name, value, options } of items)
              jar.set(name, value, options)
          } catch {
            /* Rendering a Server Component cannot set cookies. */
          }
        },
      },
    },
  )
}

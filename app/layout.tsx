import { connection } from 'next/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quiet Reset Kenya',
  description:
    'Three, six, or twelve months in a rural Kenyan cabin. Time to focus, learn a practical skill, and build a routine at your own pace.',
}
export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <nav className="shell nav" aria-label="Main navigation">
            <Link className="brand" href="/">
              Quiet Reset<span>KENYA</span>
            </Link>
            <div>
              <Link href="/stays">Stays</Link>
              <Link href="/packages">Packages</Link>
              <Link href="/partners">Hosts</Link>
              <Link className="nav-account" href="/dashboard">
                Account
              </Link>
            </div>
          </nav>
        </header>
        {children}
        <footer>
          <div className="shell footer">
            <Link className="brand" href="/">
              Quiet Reset<span>KENYA</span>
            </Link>
            <p>Long rural stays in Kenya</p>
            <Link href="/partners">List an idle cabin</Link>
          </div>
        </footer>
      </body>
    </html>
  )
}

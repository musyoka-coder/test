import Link from 'next/link'
import { catalog } from './catalog'
import { Rates } from './ui'

export default async function Home() {
 const {packages} = await catalog()
 return <main>
  <section className="hero shell">
    <div className="hero-copy">
     <p className="eyebrow">LONG RURAL STAYS IN KENYA</p>
     <h1>Take time.<br/>Start again.</h1>
     <p>Spend three, six, or twelve months in a rural Kenyan cabin. Make room for focused work, learn a practical skill, or rebuild your routine at your own pace.</p>
     <div className="actions"><Link href="/stays" className="button">Explore stays <span aria-hidden>↗</span></Link><Link href="/partners" className="button outline">Partner with us</Link></div>
    </div>
    <figure className="hero-photo">
     <figcaption>Illustrative cabin photo · Kenyan countryside</figcaption>
    </figure>
  </section>
  <section className="shell lower">
   <p className="eyebrow">THREE LENGTHS OF STAY</p><h2>Choose how long to stay.</h2>
   <p className="intro">Monthly equivalents are for price comparison. Meals, transport, amenities, and learning activities vary by cabin.</p>
   <Rates packages={packages}/>
  </section>
  <section className="host-section"><div className="shell"><p className="eyebrow">FOR FARMERS AND RURAL LANDOWNERS</p><h2>Have a cabin sitting idle?</h2><p>Earn from an unused cabin and, if you choose, teach a guest beekeeping, farming, or kitchen gardening.</p><Link className="button light" href="/partners">List an idle cabin</Link></div></section>
 </main>
}

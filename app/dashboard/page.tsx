import Link from 'next/link'
import { redirect } from 'next/navigation'
import { configured, db } from '@/lib/db'
import { money } from '@/lib/site'
import { acceptCabin, logout } from '../actions'
import { CabinDetails, Flash, Heading, type Cabin, type PageProps } from '../ui'

export default async function Dashboard({searchParams}:PageProps) {
 const query = await searchParams
 if (!configured()) redirect('/account')
 const s = await db()
 const {data:{user}} = await s.auth.getUser()
 if (!user) redirect('/account')
 const [{data:profile},{data:bookings,error},{data:directions}] = await Promise.all([
  s.from('profiles').select('username,is_admin').eq('id',user.id).single(),
  s.from('bookings').select('*,cabins(*,cabin_activities(activity,included))').eq('guest_id',user.id).order('created_at',{ascending:false}),
  s.from('cabin_directions').select('cabin_id,directions')
 ])
 return <main className="shell content">
  <Heading label="GUEST DASHBOARD" title="Your stay requests.">Username · {profile?.username ?? 'Unavailable'}</Heading>
  <Flash query={query}/>
  <div className="actions"><Link className="button" href="/packages">Explore packages</Link>{profile?.is_admin && <Link className="button outline" href="/admin">Admin dashboard</Link>}<form action={logout}><button className="button outline">Sign out</button></form></div>
  <div className="stack section">
   {error && <p className="alert error">Your requests are temporarily unavailable.</p>}
   {!error && !bookings?.length && <p>You haven’t submitted a stay request yet.</p>}
   {bookings?.map(b=>{
    const arrival = b.status==='Confirmed' && directions?.find(d=>d.cabin_id===b.cabin_id)
    const cabin = b.cabins as Cabin | null
    return <article className="card" key={b.id}><p className="eyebrow">{b.status}</p><h2>{b.months} months · {money(b.quote)}</h2><p>{b.start_date} to {b.end_date}</p>
     {cabin && <details><summary>{cabin.title} · {cabin.county} · Stay inclusions</summary><CabinDetails cabin={cabin}/></details>}
     {b.status==='Pending' && <p>Your request is awaiting review. No payment is due.</p>}
     {b.status==='Confirmed' && cabin && (b.accepted_at ? <p>You accepted this cabin assignment.</p> : <form className="form section" action={acceptCabin}>
      <input type="hidden" name="id" value={b.id}/>
      <label className="check"><input name="ack" type="checkbox" required/>I reviewed the cabin’s included activities, meals, transport, and amenities.</label>
      <button className="button outline">Accept cabin assignment</button>
     </form>)}
     {arrival && <div className="section"><h3>Private arrival directions</h3><p className="directions">{arrival.directions}</p></div>}
    </article>
   })}
  </div>
 </main>
}

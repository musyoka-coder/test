import Link from 'next/link'
import { money, skills } from '@/lib/site'

export type Query = Record<string,string | string[] | undefined>
export type PageProps = {searchParams:Promise<Query>}
export type Package = {months:number;price:number}
export type Cabin = {
 id:string; host_id:string; title:string; county:string; area:string; capacity:number; bedrooms:number
 water:string; electricity:string; connectivity:string; road:string; accessibility:string; health_km:number
 amenities:string; meals:string; transport:string; available_from:string; available_until:string; published:boolean
 cabin_activities:{activity:string; included:boolean}[]
}
export const one = (query:Query,key:string) => typeof query[key] === 'string' ? query[key] : ''

export function Heading({label,title,children}:{label:string;title:string;children?:React.ReactNode}) {
 return <div className="heading"><p className="eyebrow">{label}</p><h1>{title}</h1>{children && <p>{children}</p>}</div>
}
export function Flash({query}:{query:Query}) {
 const message = one(query,'error') || one(query,'notice')
 return message ? <p role="status" className={query.error ? 'alert error' : 'alert'}>{message}</p> : null
}
export function Rates({packages,cabin}:{packages:Package[];cabin?:string}) {
 return <div className="grid rates">{packages.map(p=><article className="card rate" key={p.months}>
  <h3>{p.months} months</h3>
  <p className="price">{money(p.price)}</p><p className="subtle">Total for the stay</p>
  <p>{money(p.price/p.months)} / month equivalent</p>
  <Link className="button outline" href={'/book?months='+p.months+(cabin ? '&cabin='+cabin : '')}>Book this stay <span aria-hidden>↗</span></Link>
 </article>)}</div>
}
export function Field({label,name,type='text',initial,required=true,min,max}:{label:string;name:string;type?:string;initial?:string|number;required?:boolean;min?:string|number;max?:string|number}) {
 return <label>{label}<input name={name} type={type} defaultValue={initial} required={required} min={min} max={max} maxLength={type==='text' ? 300 : undefined} step={name==='health_km' ? '0.1' : undefined} /></label>
}
export function Checks({name}:{name:string}) {
 return <div className="checks">{skills.map(skill=><label key={skill}><input type="checkbox" name={name} value={skill}/>{skill}</label>)}</div>
}
export function CabinDetails({cabin}:{cabin:Cabin}) {
 const items = [['Bedrooms',cabin.bedrooms],['Sleeps',cabin.capacity],['Water',cabin.water],['Electricity',cabin.electricity],['Mobile coverage',cabin.connectivity],['Road access',cabin.road],['Accessibility',cabin.accessibility],['Nearest health facility',cabin.health_km+' km'],['Included amenities',cabin.amenities],['Meals',cabin.meals],['Transport',cabin.transport],['Learning activities',cabin.cabin_activities.map(a=>a.activity+' ('+(a.included ? 'included' : 'optional, separate arrangement')+')').join(', ') || 'None offered']]
 return <dl className="details">{items.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
}

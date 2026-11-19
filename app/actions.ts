'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { configured, db } from '@/lib/db'
import { selection, skills } from '@/lib/site'

const value = (form: FormData, key: string) => String(form.get(key) ?? '').trim()
const raw = (form: FormData, key: string) => String(form.get(key) ?? '')
function result(path: string, message: string, good = false): never {
  const url = new URL(path,'https://internal.invalid')
  url.searchParams.set(good ? 'notice' : 'error', message)
  redirect(url.pathname + url.search)
}
async function client(path: string) {
  if (!configured()) result(path,'The booking service is offline. Try again later.')
  return db()
}
async function admin() {
  const s = await client('/admin')
  const {data:{user}} = await s.auth.getUser()
  const {data:allowed} = await s.rpc('is_admin')
  if (!user || !allowed) redirect('/account')
  return s
}
export async function authenticate(form: FormData) {
  const choice = selection(form.get('months'),form.get('cabin'))
  const mode = value(form,'mode')
  const query = new URLSearchParams(choice)
  if (['signup','forgot','reset'].includes(mode)) query.set('mode',mode)
  const path = '/account?' + query
  const s = await client(path)
  const email = value(form,'email')
  const password = raw(form,'password')
  if (mode !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) result(path,'Enter a valid email address.')
  if (mode !== 'forgot' && (password.length < 8 || password.length > 72)) result(path,'Use a password of 8 to 72 characters.')
  const request = await headers()
  const origin = process.env.APP_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://' + (request.get('host') || 'localhost:3000'))
  const callback = new URL('/auth/verify',origin)
  if (mode === 'forgot') {
    callback.searchParams.set('mode','reset')
    const {error} = await s.auth.resetPasswordForEmail(email,{redirectTo:callback.href})
    if (error) result(path,error.message)
    result(path,'If your account exists, a reset link is on its way.',true)
  }
  if (mode === 'reset') {
    const {error} = await s.auth.updateUser({password})
    if (error) result(path,error.message)
    result('/dashboard','Password updated.',true)
  }
  if (mode === 'signup') {
    callback.search = choice.toString()
    const {data,error} = await s.auth.signUp({email,password,options:{emailRedirectTo:callback.href,data:{booking_months:choice.get('months'),booking_cabin:choice.get('cabin')}}})
    if (error) result(path,error.message)
    if (data.session) redirect('/book?' + choice)
    result(path,'Check your email and follow the verification link to continue.',true)
  }
  const {data,error} = await s.auth.signInWithPassword({email,password})
  if (error) result(path,error.message)
  if (!choice.size) {
    const saved = selection(data.user.user_metadata.booking_months,data.user.user_metadata.booking_cabin)
    if (saved.size) redirect('/book?' + saved)
  }
  redirect(choice.size ? '/book?' + choice : '/dashboard')
}
export async function logout() {
  const s = await client('/account')
  await s.auth.signOut()
  redirect('/')
}
export async function requestBooking(form: FormData) {
  const choice = selection(form.get('months'),form.get('cabin'))
  const path = '/book?' + choice + '&start=' + encodeURIComponent(value(form,'start'))
  const s = await client(path)
  if (value(form,'ack') !== 'on') result(path,'Review the stay inclusions before submitting.')
  const {error} = await s.rpc('request_booking',{
    p_months:Number(choice.get('months')),p_cabin:choice.get('cabin'),p_start:value(form,'start'),
    p_price:Number(form.get('price')),p_interests:skills.filter(skill => form.getAll('interests').includes(skill))
  })
  if (error) result(path,error.message)
  result('/dashboard','Booking request submitted. Confirmation is pending.',true)
}
export async function applyHost(form: FormData) {
  const path = '/partners'
  const s = await client(path)
  const {error} = await s.from('host_applications').insert({
    name:value(form,'name'),email:value(form,'email'),phone:value(form,'phone'),county:value(form,'county'),
    area:value(form,'area'),available_from:value(form,'available_from'),available_until:value(form,'available_until'),
    capacity:Number(form.get('capacity')),amenities:value(form,'amenities'),road:value(form,'road'),
    activities:skills.filter(skill => form.getAll('activities').includes(skill))
  })
  if (error) result(path,'Application could not be saved. Check your contact details, capacity, and that the end date follows the start date.')
  result(path,'Application received. We’ll review your cabin details before listing it.',true)
}
export async function manage(form: FormData) {
  const s = await admin()
  const action = value(form,'action')
  const id = value(form,'id')
  let error = null
  if (action === 'price') {
    ({error} = await s.from('packages').update({price:Number(form.get('price'))}).eq('months',id))
  } else if (action === 'host') {
    ({error} = await s.from('host_applications').update({status:value(form,'status')}).eq('id',id).eq('status','Pending'))
  } else if (action === 'booking') {
    ;({error} = await s.rpc('review_booking',{p_id:id,p_status:value(form,'status'),p_cabin:value(form,'cabin') || null}))
  } else if (action === 'cabin') {
    const details = Object.fromEntries(['title','bedrooms','water','electricity','connectivity','accessibility','health_km','amenities','meals','transport'].map(key=>[key,value(form,key)]))
    ;({error} = await s.rpc('save_cabin',{p_host:id,p_details:{...details,published:form.get('published')==='on'},p_directions:value(form,'directions'),p_activities:Object.fromEntries(skills.flatMap(skill => {
      const setting = value(form,skill)
      return setting ? [[skill,setting==='included']] : []
    }))}))
  } else {
    result('/admin','Unknown admin action.')
  }
  if (error) result('/admin',error.message)
  result('/admin','Changes saved.',true)
}

export async function acceptCabin(form: FormData) {
  const path = '/dashboard'
  const s = await client(path)
  if (value(form,'ack') !== 'on') result(path,'Review the stay inclusions first.')
  const {error} = await s.rpc('accept_cabin',{p_id:value(form,'id')})
  if (error) result(path,error.message)
  result(path,'Cabin assignment accepted.',true)
}

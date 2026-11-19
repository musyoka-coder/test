create extension if not exists btree_gist;
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 username text unique not null,
 is_admin boolean not null default false
);
create function public.assign_guest_name() returns trigger language plpgsql security definer set search_path='' as $$
begin
 loop
   insert into public.profiles(id, username)
   values (new.id, 'guest-' || (array['kito','mti','anga','nuru'])[1+floor(random()*4)::int] || '-' || floor(1000+random()*9000)::int || '-' || left(gen_random_uuid()::text, 8))
   on conflict(username) do nothing;
   if found then return new; end if;
 end loop;
end $$;
create trigger assign_guest_name after insert on auth.users for each row execute function public.assign_guest_name();
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and is_admin)
$$;
create table public.packages (
 months integer primary key check(months in(3,6,12)),
 price integer not null check(price>0),
 active boolean not null default true
);
insert into public.packages values (3,45000,true),(6,84000,true),(12,156000,true);
create table public.host_applications (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 name text not null check(length(name) between 2 and 100),
 email text not null check(length(email)<=254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
 phone text not null check(phone ~ '^[+0-9 ()-]{7,25}$'),
 county text not null check(length(county) between 2 and 60),
 area text not null check(length(area) between 2 and 120),
 available_from date not null, available_until date not null check(available_until>available_from),
 capacity integer not null check(capacity between 1 and 30),
 amenities text not null check(length(amenities) between 2 and 2000),
 road text not null check(length(road) between 2 and 300),
 activities text[] not null check(activities <@ array['Beekeeping','Farming','Kitchen gardening']),
 status text not null default 'Pending' check(status in('Pending','Approved','Declined'))
);
create table public.cabins (
 id uuid primary key default gen_random_uuid(),
 host_id uuid not null unique references public.host_applications,
 title text not null check(length(title) between 2 and 100), county text not null, area text not null,
 capacity integer not null check(capacity between 1 and 30),
 bedrooms integer not null check(bedrooms between 1 and 30),
 water text not null, electricity text not null, connectivity text not null check(connectivity in('Reliable','Limited','None')),
 road text not null, accessibility text not null check(accessibility in('Step-free','Steps or uneven ground')),
 health_km numeric not null check(health_km>=0),
 amenities text not null, meals text not null, transport text not null,
 available_from date not null, available_until date not null check(available_until>available_from),
 published boolean not null default false
);
create table public.cabin_directions (
 cabin_id uuid primary key references public.cabins on delete cascade,
 directions text not null check(length(directions) between 4 and 2000)
);
create table public.cabin_activities (
 cabin_id uuid references public.cabins on delete cascade,
 activity text check(activity in('Beekeeping','Farming','Kitchen gardening')),
 included boolean not null,
 primary key(cabin_id,activity)
);
create table public.bookings (
 id uuid primary key default gen_random_uuid(),
 guest_id uuid not null default auth.uid() references public.profiles,
 months integer not null references public.packages,
 cabin_id uuid references public.cabins,
 start_date date not null, end_date date not null,
 quote integer not null check(quote>0),
 interests text[] not null default '{}' check(interests <@ array['Beekeeping','Farming','Kitchen gardening']),
 status text not null default 'Pending' check(status in('Pending','Confirmed','Declined','Cancelled')),
 created_at timestamptz not null default now(),
 check(end_date>start_date),
 check(status<>'Confirmed' or cabin_id is not null),
 exclude using gist (cabin_id with =, daterange(start_date,end_date,'[)') with &&) where (status='Confirmed')
);
alter table public.profiles enable row level security;
alter table public.packages enable row level security;
alter table public.host_applications enable row level security;
alter table public.cabins enable row level security;
alter table public.cabin_directions enable row level security;
alter table public.cabin_activities enable row level security;
alter table public.bookings enable row level security;
revoke all on public.profiles, public.packages, public.host_applications, public.cabins, public.cabin_directions, public.cabin_activities, public.bookings from anon, authenticated;
grant select on public.packages, public.cabins, public.cabin_activities to anon, authenticated;
grant select on public.profiles, public.host_applications, public.cabin_directions, public.bookings to authenticated;
grant insert(name,email,phone,county,area,available_from,available_until,capacity,amenities,road,activities) on public.host_applications to anon, authenticated;
grant update(price,active) on public.packages to authenticated;
grant update(status) on public.host_applications to authenticated;
grant update(published) on public.cabins to authenticated;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy packages_read on public.packages for select using(active or public.is_admin());
create policy packages_admin on public.packages for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy host_submit on public.host_applications for insert with check(status='Pending');
create policy host_read on public.host_applications for select to authenticated using(public.is_admin());
create policy host_review on public.host_applications for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy cabin_read on public.cabins for select using(published or public.is_admin());
create policy cabin_admin on public.cabins for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy activities_read on public.cabin_activities for select using(exists(select 1 from public.cabins c where c.id=cabin_id));
create policy booking_read on public.bookings for select to authenticated using(guest_id=auth.uid() or public.is_admin());
create policy directions_read on public.cabin_directions for select to authenticated using(public.is_admin() or exists(select 1 from public.bookings b where b.cabin_id=cabin_directions.cabin_id and b.guest_id=auth.uid() and b.status='Confirmed'));

create function public.available_cabins(p_months integer, p_start date) returns setof uuid language sql stable security definer set search_path='' as $$
 select c.id from public.cabins c where c.published and p_months in (3,6,12)
 and p_start>=c.available_from and (p_start+make_interval(months=>p_months))::date<=c.available_until
 and not exists(select 1 from public.bookings b where b.cabin_id=c.id and b.status='Confirmed'
 and daterange(b.start_date,b.end_date,'[)') && daterange(p_start,(p_start+make_interval(months=>p_months))::date,'[)'))
$$;
create function public.request_booking(p_months integer,p_start date,p_cabin uuid,p_interests text[],p_price integer) returns void language plpgsql security definer set search_path='' as $$
declare current_price integer;
begin
 if auth.uid() is null then raise exception 'Sign in to request a stay'; end if;
 if p_start is null or p_start<(now() at time zone 'Africa/Nairobi')::date then raise exception 'Choose a start date from today onward'; end if;
 select price into current_price from public.packages where months=p_months and active for share;
 if not found then raise exception 'This package is unavailable'; end if;
 if p_price is distinct from current_price then raise exception 'The package price changed. Review the current price before submitting'; end if;
 if p_cabin is not null and not exists(select 1 from public.available_cabins(p_months,p_start) as a(id) where a.id=p_cabin) then raise exception 'This cabin is unavailable for those dates'; end if;
 insert into public.bookings(guest_id,months,cabin_id,start_date,end_date,quote,interests)
 values(auth.uid(),p_months,p_cabin,p_start,(p_start+make_interval(months=>p_months))::date,current_price,p_interests);
end $$;
create function public.review_booking(p_id uuid,p_status text,p_cabin uuid) returns void language plpgsql security definer set search_path='' as $$
declare b public.bookings;
begin
 if not public.is_admin() then raise exception 'Admin access required'; end if;
 select * into b from public.bookings where id=p_id for update;
 if not found or p_status is null or not ((b.status='Pending' and p_status in('Confirmed','Declined','Cancelled')) or (b.status='Confirmed' and p_status='Cancelled')) then raise exception 'This booking status cannot be changed'; end if;
 if p_status='Confirmed' then
   if p_cabin is null or not exists(select 1 from public.available_cabins(b.months,b.start_date) as a(id) where a.id=p_cabin) then raise exception 'Select an available cabin with no overlapping confirmed stay'; end if;
   if not exists(select 1 from public.cabin_directions where cabin_id=p_cabin) then raise exception 'Add private arrival directions before confirming'; end if;
 end if;
 update public.bookings set status=p_status,cabin_id=case when p_status='Confirmed' then p_cabin else cabin_id end where id=p_id;
exception when exclusion_violation then raise exception 'This cabin already has a confirmed stay on those dates';
end $$;

create function public.save_cabin(p_host uuid,p_details jsonb,p_directions text,p_activities jsonb) returns void language plpgsql security definer set search_path='' as $$
declare h public.host_applications; c public.cabins; saved_id uuid;
begin
 if not public.is_admin() then raise exception 'Admin access required'; end if;
 select * into h from public.host_applications where id=p_host and status='Approved' for update;
 if not found then raise exception 'Approve the host before saving a cabin'; end if;
 c := jsonb_populate_record(null::public.cabins,p_details);
 insert into public.cabins(host_id,title,county,area,capacity,bedrooms,water,electricity,connectivity,road,accessibility,health_km,amenities,meals,transport,available_from,available_until,published)
 values(h.id,c.title,h.county,h.area,h.capacity,c.bedrooms,c.water,c.electricity,c.connectivity,h.road,c.accessibility,c.health_km,c.amenities,c.meals,c.transport,h.available_from,h.available_until,c.published)
 on conflict(host_id) do update set title=excluded.title,bedrooms=excluded.bedrooms,water=excluded.water,electricity=excluded.electricity,connectivity=excluded.connectivity,accessibility=excluded.accessibility,health_km=excluded.health_km,amenities=excluded.amenities,meals=excluded.meals,transport=excluded.transport,published=excluded.published
 returning id into saved_id;
 insert into public.cabin_directions values(saved_id,p_directions) on conflict(cabin_id) do update set directions=excluded.directions;
 delete from public.cabin_activities where cabin_id=saved_id;
 insert into public.cabin_activities select saved_id, a.key, a.value::boolean from jsonb_each_text(p_activities) a where a.key=any(h.activities);
end $$;
revoke execute on function public.assign_guest_name(),public.is_admin(),public.available_cabins(integer,date),public.request_booking(integer,date,uuid,text[],integer),public.review_booking(uuid,text,uuid),public.save_cabin(uuid,jsonb,text,jsonb) from public, anon, authenticated;
grant execute on function public.is_admin(),public.available_cabins(integer,date) to anon, authenticated;
grant execute on function public.request_booking(integer,date,uuid,text[],integer),public.review_booking(uuid,text,uuid),public.save_cabin(uuid,jsonb,text,jsonb) to authenticated;

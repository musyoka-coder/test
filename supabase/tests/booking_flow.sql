begin;
do $test$
declare
  admin_id uuid := gen_random_uuid();
  first_guest uuid := gen_random_uuid();
  second_guest uuid := gen_random_uuid();
  host uuid;
  cabin uuid;
  first_booking uuid;
  second_booking uuid;
  start_day date := current_date + 15;
  count_found integer;
begin
  insert into auth.users(id,email) values
    (admin_id,admin_id || '@example.invalid'),
    (first_guest,first_guest || '@example.invalid'),
    (second_guest,second_guest || '@example.invalid');
  if (select count(distinct username) from public.profiles where id in(admin_id,first_guest,second_guest) and username like 'guest-%') <> 3 then
    raise exception 'Username assignment failed';
  end if;
  update public.profiles set is_admin=true where id=admin_id;

  set local role anon;
  insert into public.host_applications(name,email,phone,county,area,available_from,available_until,capacity,amenities,road,activities)
  values('QA Host','qa@example.invalid','0700000000','Nakuru','QA area',current_date,current_date+700,2,'Kitchen','All-weather road',array['Farming']);
  reset role;
  select id into strict host from public.host_applications where email='qa@example.invalid';

  set local role authenticated;
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  update public.host_applications set status='Approved' where id=host;
  perform public.save_cabin(host,'{"title":"QA Cabin","bedrooms":"1","water":"Piped","electricity":"Solar","connectivity":"Limited","accessibility":"Step-free","health_km":"8","amenities":"Kitchen","meals":"Self-catering","transport":"Self-arranged","published":true}','QA private directions','{"Farming":true}');
  select id into strict cabin from public.cabins where host_id=host and published;

  perform set_config('request.jwt.claim.sub',first_guest::text,true);
  perform public.request_booking(3,start_day,cabin,array['Farming'],45000);
  select id into strict first_booking from public.bookings where guest_id=first_guest and status='Pending';
  if exists(select 1 from public.cabin_directions where cabin_id=cabin) then raise exception 'Directions visible before confirmation'; end if;

  perform set_config('request.jwt.claim.sub',second_guest::text,true);
  perform public.request_booking(3,start_day,cabin,array[]::text[],45000);
  select id into strict second_booking from public.bookings where guest_id=second_guest;
  if exists(select 1 from public.bookings where id=first_booking) then raise exception 'Another guest can see a private booking'; end if;
  if exists(select 1 from public.host_applications where id=host) then raise exception 'Guest can read private host contact'; end if;
  begin
    perform public.review_booking(second_booking,'Confirmed',cabin);
    raise exception 'Admin policy failed';
  exception when raise_exception then
    if sqlerrm <> 'Admin access required' then raise; end if;
  end;

  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  update public.packages set price=46000 where months=3;
  select quote into strict count_found from public.bookings where id=first_booking;
  if count_found <> 45000 then raise exception 'Original quote was modified'; end if;
  perform public.review_booking(first_booking,'Confirmed',cabin);
  begin
    perform public.review_booking(second_booking,'Confirmed',cabin);
    raise exception 'Overlap RPC check failed';
  exception when raise_exception then
    if sqlerrm <> 'Select an available cabin with no overlapping confirmed stay' then raise; end if;
  end;
  reset role;
  begin
    update public.bookings set status='Confirmed' where id=second_booking;
    raise exception 'Overlap exclusion constraint failed';
  exception when exclusion_violation then null;
  end;

  set local role authenticated;
  perform set_config('request.jwt.claim.sub',first_guest::text,true);
  perform public.accept_cabin(first_booking);
  if not exists(select 1 from public.bookings where id=first_booking and accepted_at is not null) then raise exception 'Cabin acceptance failed'; end if;
  if not exists(select 1 from public.cabin_directions where cabin_id=cabin) then raise exception 'Confirmed guest cannot see directions'; end if;
  perform set_config('request.jwt.claim.sub',second_guest::text,true);
  if exists(select 1 from public.cabin_directions where cabin_id=cabin) then raise exception 'Directions visible to another guest'; end if;
end
$test$;
rollback;

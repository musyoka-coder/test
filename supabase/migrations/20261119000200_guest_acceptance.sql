alter table public.bookings add column accepted_at timestamptz;
create function public.accept_cabin(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  update public.bookings
  set accepted_at=coalesce(accepted_at,now())
  where id=p_id and guest_id=auth.uid() and status='Confirmed' and cabin_id is not null;
  if not found then raise exception 'This confirmed cabin assignment is unavailable'; end if;
end $$;
revoke execute on function public.accept_cabin(uuid) from public, anon, authenticated;
grant execute on function public.accept_cabin(uuid) to authenticated;
create policy assigned_cabin_read on public.cabins for select to authenticated using(
  exists(select 1 from public.bookings b where b.cabin_id=cabins.id and b.guest_id=auth.uid() and b.status='Confirmed')
);

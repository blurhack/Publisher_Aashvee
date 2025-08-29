create or replace function public.decrement_available_positions(p_book_id uuid, p_positions int)
returns void
language plpgsql
as $$
begin
  update public.upcoming_books
  set available_positions = greatest(available_positions - p_positions, 0),
      updated_at = now()
  where id = p_book_id;
end; $$;

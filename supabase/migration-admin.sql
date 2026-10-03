-- Admin moderation (added Oct 2026)
-- Add is_admin flag to profiles for content moderation
alter table profiles add column if not exists is_admin boolean not null default false;

-- Helper to check if a user is an admin
create or replace function public.is_admin(p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select coalesce((select is_admin from profiles where id = p_user_id), false);
$$;

-- Allow admins to delete any post
drop policy if exists posts_delete_admin on posts;
create policy posts_delete_admin on posts
  for delete using (public.is_admin(auth.uid()));

-- Set Amanda (Kru) as admin - update the username as needed
update profiles set is_admin = true where username = 'Kru';

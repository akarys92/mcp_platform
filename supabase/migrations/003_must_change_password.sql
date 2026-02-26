-- Add must_change_password flag to public.users.
-- Set to true when admin creates a user with a temp password.
-- Cleared after the user sets their own password.
-- Default false so existing users are unaffected.

alter table public.users
  add column must_change_password boolean not null default false;

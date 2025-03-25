/*
  # Create profiles table with role-based access control

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, not null)
      - `role` (text, not null, default: 'user')
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for authenticated users to read their own profile
    - Add policy for system to create profiles on user signup
*/

create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    role text not null default 'user',
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
    on profiles for select
    to authenticated
    using (auth.uid() = id);

create policy "Enable insert for authenticated users only"
    on profiles for insert
    to authenticated
    with check (auth.uid() = id);

create policy "Enable update for users based on id"
    on profiles for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);
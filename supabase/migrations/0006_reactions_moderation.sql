-- 1) Emoji reactions for the community room (message_reactions is FK'd to the
--    1:1 messages table, so community gets its own).
-- 2) Bad-word rejection for message bodies, English + Khmer, enforced by
--    trigger so the anon key can't sidestep it.
-- 3) Harmful-extension blocklist on attachment uploads, enforced in the
--    storage insert policy.

-- Community reactions --------------------------------------------------------

create table if not exists public.community_reactions (
  message_id uuid not null references public.community_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create index if not exists community_reactions_message_idx
  on public.community_reactions (message_id);

alter table public.community_reactions enable row level security;

drop policy if exists "community reactions readable by members" on public.community_reactions;
create policy "community reactions readable by members"
  on public.community_reactions for select
  using (public.is_community_member() or public.is_admin());

drop policy if exists "community react as self" on public.community_reactions;
create policy "community react as self"
  on public.community_reactions for insert
  with check (
    user_id = auth.uid()
    and (public.is_community_member() or public.is_admin())
  );

drop policy if exists "community unreact as self" on public.community_reactions;
create policy "community unreact as self"
  on public.community_reactions for delete
  using (user_id = auth.uid());

do $$
begin
  alter publication supabase_realtime add table public.community_reactions;
exception when duplicate_object then
  null; -- already in the publication
end $$;

-- Bad words ------------------------------------------------------------------
-- Latin-script entries match whole words (so "class" never trips on "ass");
-- Khmer has no word separators, so those entries match as substrings.
-- Manage the list with plain INSERT/DELETE on public.banned_words.

create table if not exists public.banned_words (
  word text primary key
);

alter table public.banned_words enable row level security;
-- No policies: only the SECURITY DEFINER checker below reads it.

insert into public.banned_words (word) values
  -- English
  ('fuck'), ('fucking'), ('fucker'), ('motherfucker'), ('shit'), ('bullshit'),
  ('bitch'), ('asshole'), ('cunt'), ('dick'), ('dickhead'), ('pussy'),
  ('bastard'), ('whore'), ('slut'), ('retard'), ('faggot'), ('nigger'),
  ('nigga'), ('wanker'), ('prick'), ('cock'),
  -- Khmer
  ('ចុយ'), ('ក្តិត'), ('ក្ដិត'), ('អាចម៍'), ('កូនឆ្កែ'), ('អាឆ្កែ'), ('មីឆ្កែ'),
  ('ខ្តើយ'), ('អាកញ្ចាស'), ('មីកញ្ចាស'), ('អាចង្រៃ'), ('មីចង្រៃ'), ('អាថោក')
on conflict (word) do nothing;

create or replace function public.contains_bad_words(p_text text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_lower text := lower(coalesce(p_text, ''));
begin
  -- Whole-word matching for Latin-script entries.
  if exists (
    select 1 from public.banned_words w
     where w.word ~ '^[a-z]+$'
       and v_lower ~ ('\m' || w.word || '\M')
  ) then
    return true;
  end if;

  -- Substring matching for everything else (Khmer script).
  return exists (
    select 1 from public.banned_words w
     where w.word !~ '^[a-z]+$'
       and position(w.word in v_lower) > 0
  );
end;
$$;

-- BEFORE INSERT OR UPDATE, so both direct sends and the edit RPCs are covered.
-- Clients recognise the literal message 'BAD_WORDS' and localise it.
create or replace function public.reject_bad_words()
returns trigger
language plpgsql
as $$
begin
  if new.deleted_at is null and public.contains_bad_words(new.body) then
    raise exception 'BAD_WORDS';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_reject_bad_words on public.messages;
create trigger messages_reject_bad_words
  before insert or update of body on public.messages
  for each row execute function public.reject_bad_words();

drop trigger if exists community_messages_reject_bad_words on public.community_messages;
create trigger community_messages_reject_bad_words
  before insert or update of body on public.community_messages
  for each row execute function public.reject_bad_words();

-- Harmful attachments --------------------------------------------------------
-- Executables and script formats that could harm whoever downloads them.
-- Keep in sync with BLOCKED_EXTENSIONS in src/lib/supabase/attachments.ts.

create or replace function public.is_allowed_attachment(p_name text)
returns boolean
language sql
immutable
as $$
  select lower(p_name) !~ '\.(exe|msi|bat|cmd|com|scr|pif|vbs|vbe|js|jse|wsf|wsh|ps1|psm1|hta|jar|apk|ipa|app|dll|so|dylib|deb|rpm|bin|run|msc|cpl|gadget|sh|bash|zsh|csh|ksh|php|phtml|asp|aspx|jsp|cgi|htm|html|xhtml|svg)$'
$$;

drop policy if exists "chat attachments writable by participants" on storage.objects;
create policy "chat attachments writable by participants"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-attachments'
    and public.owns_attachment_path(name)
    and public.is_allowed_attachment(name)
  );

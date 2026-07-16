-- Auto-reply to the suggestion chips.
--
-- This has to run in the database, not the client: a visitor's session may only
-- insert sender='visitor' rows (RLS), so it cannot post the admin's answer
-- itself. A SECURITY DEFINER trigger can.

-- The visitor's language, so the auto-reply comes back in the language they're
-- reading the site in.
alter table public.conversations
  add column if not exists lang text not null default 'en'
    check (lang in ('en', 'km'));

-- Set only when the message came from tapping a suggestion chip; free-typed
-- text that happens to match a chip is left alone.
alter table public.messages
  add column if not exists suggestion_key text;

-- Answers ------------------------------------------------------------------

create table if not exists public.auto_replies (
  key text not null,
  lang text not null check (lang in ('en', 'km')),
  body text not null,
  primary key (key, lang)
);

alter table public.auto_replies enable row level security;

-- Readable by anyone signed in; it's the same copy the chips already show.
create policy "auto replies are readable"
  on public.auto_replies for select
  using (auth.uid() is not null);

insert into public.auto_replies (key, lang, body) values
  ('hire', 'en', 'Yes — I''m open to full-time roles and outsourcing. Drop me an email at povlyhoung02@gmail.com or open the Contact page.'),
  ('projects', 'en', 'I''m shipping six products at E-Power CCL — Solar, EAC App, E-Power Maps, E-Power Maps Desktop, E-Power Condo Desktop Management System, and Mobile Billing. Side projects: JRMS, E-Commerce, SS Garage. Open the Projects page for details.'),
  ('stack', 'en', 'Mostly Flutter, Next.js, Node.js, .NET, PostgreSQL, Docker. Full list is on the Skills page.'),
  ('hire', 'km', 'បាទ — ខ្ញុំបើកទទួលការងារពេញម៉ោង និង Outsourcing។ ផ្ញើអ៊ីមែលមក povlyhoung02@gmail.com ឬបើកទំព័រ Contact។'),
  ('projects', 'km', 'ខ្ញុំកំពុងបង្កើតផលិតផលប្រាំមួយនៅ E-Power CCL — Solar, EAC App, E-Power Maps, E-Power Maps Desktop, E-Power Condo Desktop Management System, Mobile Billing។ គម្រោងផ្ទាល់ខ្លួន៖ JRMS, E-Commerce, SS Garage។ បើកទំព័រ Projects សម្រាប់ព័ត៌មានលម្អិត។'),
  ('stack', 'km', 'ភាគច្រើន Flutter, Next.js, Node.js, .NET, PostgreSQL, Docker។ បញ្ជីពេញនៅទំព័រ Skills។')
on conflict (key, lang) do update set body = excluded.body;

-- Trigger ------------------------------------------------------------------

create or replace function public.on_suggestion_auto_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lang text;
  v_body text;
begin
  -- Only visitor-sent chips. The reply this inserts has sender='admin', so it
  -- can't match this condition and recurse.
  if new.sender <> 'visitor' or new.suggestion_key is null then
    return new;
  end if;

  select lang into v_lang from public.conversations where id = new.conversation_id;

  select body into v_body
    from public.auto_replies
   where key = new.suggestion_key
     and lang = coalesce(v_lang, 'en');

  -- Fall back to English if that chip has no translation yet.
  if v_body is null then
    select body into v_body
      from public.auto_replies
     where key = new.suggestion_key and lang = 'en';
  end if;

  if v_body is null then
    return new;   -- unknown key: stay silent rather than guess
  end if;

  insert into public.messages (conversation_id, sender, body, kind, reply_to_id)
  values (new.conversation_id, 'admin', v_body, 'text', new.id);

  return new;
end;
$$;

drop trigger if exists messages_auto_reply on public.messages;
-- Runs after messages_after_insert so the counters settle before the reply
-- lands (triggers on the same event fire in name order).
create trigger messages_auto_reply
  after insert on public.messages
  for each row execute function public.on_suggestion_auto_reply();

-- start_conversation now records the visitor's language ---------------------

drop function if exists public.start_conversation(text, text);

create or replace function public.start_conversation(
  p_name text,
  p_email text,
  p_lang text default 'en'
)
returns table (out_conversation_id uuid, out_access_token uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.conversations%rowtype;
  v_lang text := case when p_lang in ('en', 'km') then p_lang else 'en' end;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_existing
    from public.conversations
   where visitor_id = v_uid
   order by last_message_at desc
   limit 1;

  if found then
    update public.conversations
       set visitor_name = trim(p_name),
           visitor_email = lower(trim(p_email)),
           lang = v_lang
     where id = v_existing.id;
    return query select v_existing.id, v_existing.access_token;
    return;
  end if;

  if (select count(*) from public.conversations where visitor_id = v_uid) >= 3 then
    raise exception 'too many conversations';
  end if;

  return query
    insert into public.conversations (visitor_id, visitor_name, visitor_email, lang)
    values (v_uid, trim(p_name), lower(trim(p_email)), v_lang)
    returning conversations.id, conversations.access_token;
end;
$$;

revoke all on function public.start_conversation(text, text, text) from public;
grant execute on function public.start_conversation(text, text, text) to authenticated;

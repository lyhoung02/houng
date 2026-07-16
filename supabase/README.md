# Live chat backend

Realtime visitor↔admin chat on Supabase, plus a Resend email notification when
you reply. The site is a static export, so there is no server — everything runs
against Supabase directly from the browser, guarded by RLS.

## How it works

- A visitor signs up with **email + password**. Their `auth.uid()` is stored on
  `conversations.visitor_id`, which is what RLS and Realtime key off — so the
  account *is* the identity, and their history follows them to any device they
  sign in on. Nothing is kept in localStorage.
- **Attachments** (photo, file, voice note, round video note) go to the private
  `chat-attachments` bucket under `<conversation_id>/<message_id>/<filename>`.
  The first path segment is what storage RLS authorises on, and reads happen
  through short-lived signed URLs — nothing is publicly reachable.
- **Edit / delete** go through `edit_message()` / `delete_message()` rather than
  an UPDATE policy, so a client can't rewrite `sender`, `kind`, or
  `attachment_path` on its own rows. Delete is a soft delete: the row stays as a
  tombstone for both sides and the stored file is removed.
- **Reactions** live in `message_reactions`, visible to whoever can see the
  message. **Typing indicators** are Realtime broadcast only — they never touch
  the database.
- Messages flow through `public.messages`, streamed over Realtime. RLS means a
  visitor only ever sees their own thread.
- **You** sign in with a real email/password account listed in `public.admins`.
  Tapping the chat avatar **7 times** reveals the admin panel — that tap only
  *reveals* the UI; `is_admin()` + RLS is what actually protects the inbox.
- When you reply, a Database Webhook fires the `notify-visitor` edge function,
  which emails the visitor via Resend with a link back to `/chat/?t=<token>`.
  Opening that link claims the thread onto the new device's anonymous session,
  so the conversation continues live.

## Setup

### 1. Front-end env

```bash
cp .env.local.example .env.local   # fill in URL + anon key
```

Set the same two vars in Cloudflare Pages / AWS Amplify build settings — they're
inlined at build time. Never put the service role key here; it would ship to
every visitor.

### 2. Apply the schema

Paste each file in `migrations/` into the Supabase SQL editor **in order**
(`0001_chat.sql`, then `0002_rich_messages.sql`), or:

```bash
brew install supabase/tap/supabase
supabase login                 # opens a browser — you must run this yourself
supabase link --project-ref <YOUR-PROJECT-REF>
supabase db push
```

### 3. Turn off email confirmation

Dashboard → Authentication → Sign In / Providers → Email → uncheck **Confirm
email**. Visitors sign up with email + password; while confirmation is on,
`signUp()` returns no session and they can't chat until they click a link that
Supabase's built-in SMTP only delivers to your own team address (~2/hour).

To require confirmation instead, configure Resend as custom SMTP under
Authentication → Emails first, or the mails won't arrive. The widget already
handles the no-session case: it shows "check your inbox to confirm".

Anonymous sign-ins are no longer used and can be switched off.

### 4. Make yourself an admin

Create your account (Authentication → Users → Add user, with a password), then:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'you@example.com';
```

### 5. Email notifications

```bash
supabase secrets set \
  RESEND_API_KEY=re_xxx \
  MAIL_FROM="Pov Lyhoung <chat@yourdomain.com>" \
  SITE_URL=https://yourdomain.com \
  WEBHOOK_SECRET=$(openssl rand -hex 32)
supabase functions deploy notify-visitor
```

`MAIL_FROM` must use a domain verified in Resend. Then wire the trigger:

Dashboard → Database → Webhooks → Create:

- Table `public.messages`, event **Insert**
- Type **Supabase Edge Functions** → `notify-visitor`
- HTTP header `x-webhook-secret` = the `WEBHOOK_SECRET` you generated

The function ignores anything that isn't an admin reply, and stamps
`messages.emailed_at` so a webhook retry can't double-send.

## Verifying

1. `npm run dev`, open the chat, register with a real address, send a message.
2. Tap the avatar 7× (within ~3s), sign in as admin, reply.
3. The visitor window should update live, and the email should land with a
   working `/chat/?t=…` link.

# Nokor Social Media — Implementation Flow & Requirements

Nokor is a standalone, mobile-style social mini-app mounted at `/nokor/` inside this static-export portfolio site. It is built entirely client-side against Supabase (Auth, Postgres via PostgREST, Storage, Realtime) — there is **no server code**, no API routes, and no server actions. Authorization is therefore enforced by Supabase Row-Level Security (RLS) and Postgres RPCs; the UI only hides controls.

> **Part I** (§1–7) documents what is implemented today. **Part II** (§8–15) is the forward roadmap: extended requirements for scaling, security, moderation, and real-world social-media functionality, all designed within the same stack constraints.

Built across five commits:

| Commit | Feature |
|---|---|
| `a1c17b2` | Social feed with posts, likes, and comments |
| `c836944` | Profile, tab bar, and direct messaging |
| `79de1ed` | Stories (image and text) |
| `44c04a7` | Rich messaging (attachments, reactions, replies, voice/video notes) |
| `b7ccae5` | Room management (invite links, member roles, ownership transfer) |

---

## 1. Architecture

```
/nokor/  (src/app/(nokor)/nokor/page.tsx — thin server page, robots noindex/nofollow)
   └── NokorApp (client shell)
         ├── AuthPanel (email/password — shown when signed out)
         ├── Header: brand, NokorPrefs (theme/lang), NokorProfileMenu (sign out)
         ├── Views (React state, no router):
         │     home     → NokorFeed (NokorStories + NokorComposer + PostCard list)
         │     activity → NokorActivity (NokorNearby + notification rows)
         │     chat     → NokorChat (rooms + DMs → NokorRoomView / NokorDmView / NokorRoomInfo)
         │     profile  → NokorProfile (+ NokorProfileAbout)
         ├── NokorNavProvider (openProfile / openChat context)
         └── NokorTabBar (fixed bottom bar, center "+" compose button)
```

Key architectural decisions:

- **Standalone shell.** The `(nokor)` route group has no `layout.tsx` and does **not** use `SiteShell` — no portfolio Nav/Footer/ChatWidget. It inherits only the root layout: ThemeProvider, LanguageProvider, `themeBootScript`, and the Khmer brand fonts (Nokora/Angkor).
- **In-memory navigation.** Tabs and open conversations are plain React state — no hash, query, or router. A reload always lands on the home tab. The one URL-driven behavior is the invite link (`/nokor?join=<code>`), read from `window.location.search` (not `useSearchParams`, which would force a Suspense boundary under the static export) and stripped with `history.replaceState` after joining.
- **Cross-component navigation** via `useNokorNav()` context: `openProfile(userId)` and `openChat(userId)` let any nested component (post header, member list, nearby card) jump tabs. `openChat`'s target is consumed exactly once via `onConsumed()`.
- **Graceful degradation.** `getSupabase()` ([client.ts](src/lib/supabase/client.ts)) is a lazy singleton (`persistSession: true`, `autoRefreshToken: true`) that returns `null` when `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset — the static build never crashes; the page shows an "unavailable" notice.
- **i18n.** All UI strings come from the `nokor` block in [messages.ts](src/lib/i18n/messages.ts) (`en` line ~380, `km` line ~945) via `useT()`. The header toggles reuse the portfolio's persisted theme (`houng.theme`) and language (`houng.lang`) providers.
- **Data fetch pattern.** Every hook does one-shot PostgREST queries assembled in memory (batch `.in()` fetches, no joins), refreshed by debounced Realtime `postgres_changes` subscriptions. Optimistic updates (likes, follows) have no rollback — the realtime-triggered refetch reconciles.

### File map

| Layer | Files |
|---|---|
| Route | `src/app/(nokor)/nokor/page.tsx` |
| Shell / nav | `NokorApp.tsx`, `useNokorNav.tsx`, `NokorTabBar.tsx`, `NokorPrefs.tsx`, `NokorProfileMenu.tsx` |
| Feed | `NokorFeed.tsx`, `PostCard.tsx`, `NokorComposer.tsx` — hook `useNokor.ts` |
| Stories | `NokorStories.tsx`, `NokorAddStory.tsx`, `NokorStoryViewer.tsx` — hook `useNokorStories.ts` |
| Rooms | `NokorChat.tsx`, `NokorRoomView.tsx`, `NokorRoomInfo.tsx`, `NokorCreateRoom.tsx` — hook `useNokorRooms.ts` |
| Messaging | `NokorConversation.tsx` (shared UI), `NokorDmView.tsx`, `src/components/chat/Attachment.tsx` (shared renderer) — hook `useNokorChat.ts` |
| Profile / social | `NokorProfile.tsx`, `NokorProfileAbout.tsx`, `NokorActivity.tsx`, `NokorNearby.tsx` — hooks `useNokorSocial.ts`, `useProfile.ts`, `useNokorNearby.ts` |
| Data layer | `client.ts`, `types.ts` (hand-written `Database` type mirroring `supabase/migrations/*.sql`), `attachments.ts` |

---

## 2. Database Schema (Supabase)

### Nokor tables

| Table | Columns | Purpose |
|---|---|---|
| `nokor_posts` | id, user_id, body, image_paths (array), image_path (legacy single), edited_at, created_at | Feed posts |
| `nokor_likes` | post_id, user_id, created_at | Post likes (toggle by pair) |
| `nokor_comments` | id, post_id, user_id, body, reply_to_id, created_at | Comments + one-level replies |
| `nokor_comment_likes` | comment_id, user_id, created_at | Comment likes |
| `nokor_follows` | follower_id, following_id, created_at | Follow graph |
| `nokor_stories` | id, user_id, kind (`image`\|`text`), image_path, caption, background, created_at, expires_at | Ephemeral stories; `caption` doubles as the text-story body; `background` is a preset key for text stories |
| `nokor_story_views` | story_id, user_id | Seen-state + view counts (upsert, idempotent) |
| `nokor_story_hidden` | story_id, user_id | Per-story hide list; written by client, **read only by RLS** |
| `nokor_dm_threads` | id, user_lo, user_hi, created_at, last_message_at | One thread per ordered user pair; created only via RPC |
| `nokor_dm_messages` | id, thread_id, sender_id, body, kind, attachment_path/name/size/mime, duration_ms, reply_to_id, edited_at, deleted_at, created_at | DM messages (soft edit/delete stamps) |
| `nokor_dm_reactions` | message_id, user_id, emoji, created_at | DM emoji reactions |
| `nokor_dm_reads` | thread_id, user_id, last_read_at | DM read watermarks |
| `nokor_rooms` | id, kind (`group`\|`channel`), name, description, photo_path, owner_id, invite_code, created_at, last_message_at | Rooms; `invite_code` is the rotating share-link secret |
| `nokor_room_members` | room_id, user_id, role (`owner`\|`admin`\|`member`), joined_at | Membership + roles |
| `nokor_room_messages` | same rich shape as `nokor_dm_messages` (room_id instead of thread_id) | Room messages |
| `nokor_room_reactions` | message_id, user_id, emoji, created_at | Room reactions |
| `nokor_room_reads` | room_id, user_id, last_read_at | Room read watermarks |
| `nokor_user_locations` | user_id, lat, lng, updated_at | Nearby opt-in coordinates; RLS: user reads only their own row |

### Shared tables (also used by the portfolio/community chat)

| Table | Role in Nokor |
|---|---|
| `profiles` | user_id, username, phone, avatar_path, bio, work, education, hometown, current_city, relationship, website, birthday, gender, languages | All display identity + About card |
| `admins`, `blocked_users` | Shared moderation infrastructure (admin allowlist, block/remove via `admin_*` RPCs) |

(`conversations`, `messages`, `community_*`, and the portfolio content tables are pre-existing and unrelated to Nokor.)

### RPCs (server-side guarded mutations)

| RPC | Purpose |
|---|---|
| `nokor_open_dm(p_other)` → thread id | Get-or-create the DM thread — the only way threads are created |
| `nokor_create_room(p_kind, p_name, p_description?, p_members?)` → room id | Create a group/channel |
| `nokor_add_room_members(p_room, p_members)` | Add members |
| `nokor_set_room_role(p_room, p_user, p_role)` | Promote/demote admin ↔ member |
| `nokor_transfer_room_owner(p_room, p_user)` | Transfer ownership |
| `nokor_remove_room_member(p_room, p_user)` | Kick — also used for "leave" (self), so the owner-must-transfer-first guard is server-side |
| `nokor_join_room(p_code)` → room id | Join via invite code |
| `nokor_room_preview(p_code)` → {id, name, kind, member_count} | Preview before joining (typed but **no UI calls it yet**) |
| `nokor_revoke_room_invite(p_room)` → new code | Rotate invite code, invalidating old links |
| `nokor_nearby_users(p_radius_km)` → {user_id, username, avatar_path, bio, current_city, distance_km, is_new} | Proximity query — **never returns raw coordinates** |

### Storage buckets

| Bucket | Access | Contents / path pattern | Limit |
|---|---|---|---|
| `nokor-media` | public (getPublicUrl) | Post images `{userId}/post-{ts}-{i}.{ext}`, story images `{userId}/story-{ts}.{ext}`, room photos `{meId}/room-{roomId}-{ts}.{ext}` | 5 MB/image (client) |
| `chat-attachments` | private (1-hour signed URLs, cached, refreshed within 60 s of expiry) | Message attachments `<threadId|roomId>/<messageId>/<sanitized-name>` | 25 MB (client, mirrors bucket); extension denylist enforced by the `is_allowed_attachment` storage policy |
| `avatars` | public | Profile avatars `{userId}/avatar-{ts}.{ext}` (timestamped for cache busting) | 2 MB (client) |

---

## 3. Subsystem Flows

### 3.1 Authentication & shell (`useNokor.ts`, `NokorApp.tsx`)

**Flow — sign up / sign in / sign out**
1. Signed-out visitors see only `AuthPanel` (no guest mode). Email/password with `supabase.auth.signUp` (shows "check your email" confirmation notice) or `signInWithPassword`.
2. `onAuthStateChange` sets `userId`/`email`/`authLoaded`; once signed in, the tab views, tab bar, and profile menu render, and the feed loads + subscribes realtime.
3. Sign-out (via the header profile dropdown) clears the session; the hook explicitly drops feed state so the next sign-in starts clean.

**Flow — navigation**
- `tab` is `useState<'home'|'activity'|'chat'|'profile'>('home')`. Tapping the profile tab always resets to your own profile; `openProfile(userId)` from anywhere shows another user's profile (fresh mount via React `key`); `openChat(userId)` deep-links into a DM once.
- The center "+" tab-bar button opens the compose modal (backdrop or ✕ closes).

### 3.2 Feed — posts, likes, comments (`useNokor.ts`, `NokorFeed`, `PostCard`, `NokorComposer`)

**Flow — load feed**
1. Select newest 50 `nokor_posts` (`FEED_LIMIT = 50`, no pagination — older posts are unreachable).
2. Batch-fetch likes, comments (ascending), comment likes, then author `profiles`; assemble `NokorFeedPost[]` in memory (likeCount / likedByMe / nested comments with authors).
3. Realtime channel `nokor-feed` (all events on the 4 feed tables) schedules a full refetch debounced 250 ms.

**Flow — create post**
1. Composer: textarea (maxLength 2000) + image picker (`image/*`, multiple). Client validation: any file > 5 MB rejects the batch; more than 6 images capped with an error; previews via object URLs. Submit needs text or ≥ 1 image.
2. Images upload **sequentially** to `nokor-media` at `{userId}/post-{ts}-{i}.{ext}`; the post aborts on the first upload failure (already-uploaded files are orphaned).
3. Insert `nokor_posts {user_id, body: trimmed, image_paths}`; modal closes and feed refreshes.

**Other post flows**
- **Edit (own only):** inline textarea, body-only (images can't be edited), stamps `edited_at`, shows an "edited" marker.
- **Delete (own only):** `window.confirm`, DB delete (ownership left to RLS), then best-effort storage cleanup of `image_paths` + legacy `image_path`.
- **Like / comment-like:** optimistic flip ±1, insert/delete the pair row, no rollback (realtime reconciles).
- **Comment / reply:** input maxLength 1000; `reply_to_id` gives one visual nesting level — reply chains are flattened to their root via a cycle-guarded walk; orphaned replies render top-level. Comment delete is author-only, with no confirm dialog.
- **Share:** copies `{origin}/nokor#post-{id}` to the clipboard ("copied" notice for 2 s); each `<article>` has the matching DOM id, so the anchor works only if the post is within the loaded 50.
- **Images:** gallery with main view + thumbnail strip + `n/N` badge; per-image save button appends the storage `?download` flag.

### 3.3 Stories (`useNokorStories.ts`, `NokorStories`, `NokorAddStory`, `NokorStoryViewer`)

**Flow — create**
1. The tray's "Create story" card opens `NokorAddStory` (portaled to `document.body` to escape the `.glass` backdrop-filter).
2. **Photo mode:** pick image (≤ 5 MB, checked twice), optional caption (≤ 200 chars). **Text mode:** 9:16 textarea (≤ 200 chars) over one of 6 gradient presets (`indigo` default, `sunset`, `ocean`, `forest`, `gold`, `night`).
3. Expiry select from **1 / 6 / 12 / 24 / 48 hours** (default 24) → `expires_at = now + hours`.
4. Optional **hide-from-followers** checklist (candidates = your followers). After the story insert, one `nokor_story_hidden` row per hidden follower; viewing-side enforcement is pure RLS (the client never reads that table).
5. Image stories upload to `nokor-media` first; insert `nokor_stories`, then refresh.

**Flow — view**
1. Tray groups non-expired stories (`expires_at > now`) by author, sorted: own group first, then groups with unseen stories, then the rest. Unseen = any story id absent from the viewer's `nokor_story_views` rows (indigo avatar ring).
2. Full-screen viewer: per-story progress bars, 5 s auto-advance (`STORY_MS = 5000`, synced with the `.nokor-story-fill` CSS animation), tap zones (left ⅓ prev / right ⅔ next), hold-to-pause (resume restarts the full 5 s), Arrow keys + Escape.
3. Each viewed story upserts `nokor_story_views` (never for your own stories). Authors see a per-story view count; only owners see the delete button (row delete + best-effort storage removal).
4. Realtime channel `nokor-stories` (stories + views tables) refreshes debounced 400 ms. Expired rows are only filtered at fetch time — nothing deletes them or their storage objects.

### 3.4 Rooms — groups & channels (`useNokorRooms.ts`, `NokorChat`, `NokorRoomView`, `NokorRoomInfo`, `NokorCreateRoom`)

**Flow — room list (chat tab)**
1. `nokor_rooms` ordered by `last_message_at` desc (RLS scopes to memberships), merged above DM threads in one list.
2. Per room: my role, member count, last-message preview (body or `📎 <attachment_name>`), photo or 📢/👥 emoji by kind.
3. Realtime channel `nokor-rooms` reloads the list debounced 300 ms.

**Flow — create room**
1. Modal: kind toggle **group** (everyone posts) vs **channel** (broadcast: only owner/admin post; members see a read-only note), optional photo, name (required, ≤ 80), description (≤ 300), initial members multi-selected from your follower/following union.
2. `nokor_create_room` RPC → id; if a photo was picked it uploads after creation (room must exist first) to `nokor-media` under the uploader's folder, then `photo_path` is updated.

**Flow — invite links**
1. Info panel shows `<origin>/nokor?join=<invite_code>` with copy button ("copied" for 2 s).
2. Admin/owner can **reset link** → `nokor_revoke_room_invite` returns a fresh code; old links die.
3. Landing on `/nokor?join=<code>` auto-calls `nokor_join_room`, opens the room on success, and strips the query so refresh doesn't rejoin. Join errors are silent (returns null).

**Flow — member management (Room Info)**
- Role gating: `isAdmin = owner || admin` unlocks photo change, invite reset, add members. A row is manageable when it's not you, not the owner, and (you're owner, or you're admin and the target is a plain member).
- **Add members:** candidates = follower/following union minus current members → `nokor_add_room_members`.
- **Promote/Demote:** toggles admin/member via `nokor_set_room_role` (owner is never assignable here). Badges: owner amber, admin indigo.
- **Transfer ownership:** owner-only, `window.confirm`, `nokor_transfer_room_owner`.
- **Kick:** `window.confirm`, `nokor_remove_room_member`.
- **Leave:** same RPC on self — the server-side guard blocks an owner leaving before transferring (UI shows a hint).
- Tapping a member avatar opens their profile via `openProfile`.

### 3.5 Messaging engine — DMs + rooms (`NokorConversation.tsx`, `useNokorChat.ts`, `useNokorRooms.ts`)

`NokorConversation` is a generic renderer over a `ChatSource` contract (messages, reactions, send/edit/delete/toggleReaction/markRead) implemented twice: `useNokorConversation` (DMs) and `useNokorRoomConversation` (rooms). DMs, groups, and channels therefore share one UI; channels pass `canPost=false` for non-admins (locked composer).

**Flow — DM threads**
1. `useNokorThreads`: `nokor_dm_threads` desc by `last_message_at`; counterpart = the other of `user_lo`/`user_hi`; batch profiles + newest message previews. Channel `nokor-threads` reloads debounced 300 ms.
2. `openWith(otherId)` → `nokor_open_dm` RPC (get-or-create) → open `NokorDmView`.

**Flow — conversation**
1. Load **all** messages ascending (no pagination), reactions, and both read stamps; channel `nokor-dm-<threadId>` (or `nokor-room-<roomId>`) reloads debounced 150 ms; auto-scroll on new messages.
2. **Send:** composer maxLength 4000; needs trimmed text or an attachment draft. Message id minted client-side (`crypto.randomUUID()`) so the attachment can upload **before** the row insert; if the insert fails, the uploaded object is removed.
3. **Attachments:** picked files silently rejected if the extension is on the 46-entry denylist (exe, js, html, svg, sh, php, apk, …); kind derived from MIME (`image`/`audio`/`video`/`file`); ≤ 25 MB; uploaded to private `chat-attachments` at `<threadId|roomId>/<messageId>/<safeName>` (`safeName` keeps `[\w.-]`, last 80 chars). Rendered by the shared [Attachment.tsx](src/components/chat/Attachment.tsx) (image link-out, voice player with duration, round Telegram-style video note, file card) via cached 1-hour signed URLs.
4. **Voice / video notes:** recorder buttons (when supported, hidden while editing) produce `voice-<ts>.webm` / `video-<ts>.webm` drafts with `duration_ms`, sent through the same path.
5. **Replies:** `reply_to_id` + quoted preview resolved from loaded messages (deleted parent shows "deleted"; attachment-only parent shows 📎 + name).
6. **Edit (own, text-body messages only):** trimmed non-empty body, stamps `edited_at`, "edited" marker.
7. **Delete (own, no confirm):** **soft** delete — row kept with `deleted_at`, body blanked, attachment columns nulled, kind reset to `text`; the storage object is hard-removed. Deleted bubbles render an italic "deleted" placeholder with no actions.
8. **Reactions:** six quick emoji (❤️ 😂 👍 😮 😢 🔥) via hover popover; grouped chips with counts toggle any present emoji; toggle = insert/delete the exact `(message_id, user_id, emoji)` row.
9. **Typing:** broadcast-only realtime event (never stored), throttled to 1 ping / 1800 ms, indicator expires 4000 ms after the last ping. Rooms show typing names; DMs show a "typing" subtitle.
10. **Read receipts:** `markRead` upserts `last_read_at` whenever the conversation is open / message count changes; "Seen" renders on your last own message once the counterpart's watermark ≥ its `created_at`.

### 3.6 Profiles & follow graph (`useProfile.ts`, `useNokorSocial.ts`, `NokorProfile`, `NokorProfileAbout`)

**Flow — view profile (own or others)**
1. `useNokorFollow` loads in one `Promise.all`: profile row, follower/following exact head-counts, **all** the user's posts (for the 3-column thumbnail grid + count; engagement not loaded), and whether the viewer follows them.
2. Display name = trimmed username or `user-<first 4 chars of id>`; avatar or 2-letter initials. About card renders only filled fields (work, education, cities, relationship, birthday, gender, phone, website auto-prefixed `https://`, opened with `rel="noreferrer noopener"`); card omitted when empty.
3. Others' profiles show **Follow/Following** (optimistic toggle on `nokor_follows`, never self) and **Message** (`openChat`).

**Flow — edit own profile**
- Form limits (HTML maxLength): username 40, bio 300, work/education 120, cities 80, website 200, phone 30; birthday native date input; gender (`female|male|other|private`) and relationship (`single|in_a_relationship|engaged|married|complicated|private`) selects, both nullable. Save trims, converts empty → NULL (birthday especially — Postgres rejects `''` for dates), and upserts `profiles` keyed by `user_id`.
- **Avatar:** camera overlay → file ≤ 2 MB → upload to `avatars` at `{userId}/avatar-{ts}.{ext}` (timestamp busts caches), save `avatar_path`, best-effort delete the old object.
- (`useProfile` also exposes `changePassword` via `supabase.auth.updateUser`, but only the portfolio chat uses it — no Nokor UI calls it.)

### 3.7 Activity / notifications (`useNokorActivity` in `useNokorSocial.ts`, `NokorActivity`)

- **Fully derived — no notifications table.** Fetches likes and comments on the viewer's posts (excluding own actions) plus new followers, batch-resolves actor profiles, merges and sorts newest-first ("X liked / commented / followed", with comment previews and timeAgo).
- Rows open the actor's profile. No read/unread state; the tab-bar badge plumbing exists (`activityCount`, capped "9+") but is never wired up.
- Realtime channel `nokor-activity` (likes/comments/follows) reloads debounced 400 ms.

### 3.8 Nearby (`useNokorNearby.ts`, `NokorNearby`)

**Strictly opt-in geolocation discovery (not presence):**
1. Card on the activity tab explains the 10 km radius trade-off. **Enable** (explicit user gesture) → `getCurrentPosition` (low accuracy, 10 s timeout, 5 min maximumAge) → upsert one `nokor_user_locations` row. Unsupported browsers and any failure show distinct error states.
2. The existence of your own row (the only one RLS lets you read) is the sharing flag. While sharing, `nokor_nearby_users(p_radius_km: 10)` returns nearby opted-in users with `distance_km` and an `is_new` badge — **raw coordinates are never exposed**.
3. One-tap **Follow** (row removed from suggestions locally), avatar opens the profile.
4. **Turn off** deletes your row — nothing of yours remains stored.

---

## 4. Realtime Channels Summary

| Channel | Tables / events | Debounce |
|---|---|---|
| `nokor-feed` | nokor_posts, nokor_likes, nokor_comments, nokor_comment_likes (all events, unfiltered) | 250 ms |
| `nokor-activity` | nokor_likes, nokor_comments, nokor_follows | 400 ms |
| `nokor-stories` | nokor_stories, nokor_story_views | 400 ms |
| `nokor-threads` | nokor_dm_threads, nokor_dm_messages (unfiltered) | 300 ms |
| `nokor-dm-<threadId>` | nokor_dm_messages (filtered by thread), nokor_dm_reactions (unfiltered), nokor_dm_reads (filtered) + `typing` broadcast | 150 ms |
| `nokor-rooms` | nokor_rooms, nokor_room_members, nokor_room_messages | 300 ms |
| `nokor-room-<roomId>` | nokor_room_messages (filtered by room), nokor_room_reactions (unfiltered) + `typing` broadcast | 150 ms |

All channels are removed and timers cleared on unmount/sign-out. Typing broadcasts: throttle 1800 ms, TTL 4000 ms, own pings ignored.

---

## 5. Limits & Validation Summary

| Item | Limit |
|---|---|
| Feed size | newest 50 posts, no pagination |
| Post body / comment | 2000 / 1000 chars (HTML maxLength) |
| Post images | ≤ 6 per post, ≤ 5 MB each |
| Story text/caption | 200 chars; image ≤ 5 MB; expiry 1/6/12/24/48 h (default 24); auto-advance 5 s |
| Message body | 4000 chars |
| Message attachment | ≤ 25 MB; 46 blocked extensions; filename sanitized to `[\w.-]`, last 80 chars |
| Avatar | ≤ 2 MB |
| Room name / description / photo | 80 / 300 chars, photo ≤ 5 MB |
| Profile fields | username 40, bio 300, work/education 120, cities 80, website 200, phone 30 |
| Nearby radius | 10 km (hardcoded) |
| Signed URL TTL | 3600 s, cached, refreshed within 60 s of expiry |
| Password | min 6 chars (HTML minLength only) |

---

## 6. Security Model & Requirements

Because everything runs client-side with the anon key:

1. **RLS is the real authorization layer.** The client filters by ids only (e.g. edit/delete queries filter by message id alone); ownership, room membership scoping, hidden-story filtering, and location privacy all rest on RLS. The UI merely hides controls.
2. **Privileged mutations go through RPCs** (`nokor_*` functions) so server-side guards apply — e.g. an owner cannot leave a room before transferring ownership; invite-code rotation invalidates old links.
3. **Privacy invariants:** `nokor_nearby_users` never returns coordinates; `nokor_user_locations` rows are readable only by their owner and are deleted on opt-out; `nokor_story_hidden` is enforced entirely by RLS; the `/nokor/` route is `noindex, nofollow`.
4. **Storage:** `chat-attachments` is private (signed URLs; `is_allowed_attachment` policy blocks executable/script/HTML/SVG uploads server-side); `nokor-media` and `avatars` are public buckets — post/story images remain URL-fetchable even when hidden or expired.
5. **Auth is required for everything** — every hook no-ops without a client + `userId`; there is no guest mode.

### Functional requirements (condensed)

- Email/password auth with confirmation email; persistent session; sign-out clears state.
- Feed: create (text and/or ≤ 6 images), edit own (body only, "edited" marker), delete own (confirm + storage cleanup), like, comment, reply (one nesting level), comment-like, comment-delete (own), share link, live updates.
- Stories: image/text creation with expiry choice and hide-from list; grouped tray with unseen rings; auto-advancing viewer with pause/tap/keyboard; view receipts and owner view counts; owner delete.
- DMs: RPC-created threads, full rich messaging (attachments, voice/video notes, replies, reactions, edit, soft delete, typing, seen receipts).
- Rooms: groups + broadcast channels; invite links with rotation and auto-join; roles owner/admin/member with promote/demote, transfer, kick, leave (server-guarded); room photo; same rich messaging; channels lock posting to admins.
- Profiles: rich About fields with enum privacy options; avatar upload; follow/unfollow; message shortcut; post grid.
- Activity: derived likes/comments/followers feed, live-updating.
- Nearby: opt-in single-fix geolocation, 10 km RPC discovery without coordinate exposure, one-tap follow, full opt-out.
- i18n (en/km) for every string; theme + language toggles shared with the portfolio.

---

## 7. Known Gaps & Implementation Notes

- **No pagination anywhere** — feed capped at 50; DM/room conversations load every message; thread previews fetch messages across all threads unbounded.
- **No moderation UX in Nokor** — no mute/block/report; a kicked user can rejoin via a still-valid invite link unless the code is reset; no ban list, pin, or room rename/description edit (only the photo is editable after creation).
- `nokor_room_preview` RPC exists but no join-preview UI calls it.
- The activity badge (`activityCount`, "9+" cap) is built into `NokorTabBar` but never passed by `NokorApp` — badge is always hidden.
- Optimistic like/follow toggles never roll back on DB failure; realtime refetch reconciles.
- Sequential post-image upload aborts on first failure, orphaning already-uploaded files; storage deletions are best-effort throughout ("orphan is harmless").
- Expired stories are filtered at query time only — rows and public storage objects are never cleaned up; a story can expire while open.
- Blocked-extension file picks are rejected **silently**; the check inspects only the final extension.
- Unfiltered realtime subscriptions (reactions, thread list) mean any visible-row change anywhere triggers a reload.
- Legacy `image_path` (single) is still supported alongside `image_paths` (array).
- Character limits are HTML `maxLength` only — hooks trim but mostly don't re-validate length.
- `Date.now()`-based storage paths and client-clock `edited_at` stamps assume a roughly-correct client clock.

---

# Part II — Future Roadmap & Extended Requirements

Everything below stays inside the existing stack: **static Next.js export** (no server code) with all server-side logic in Supabase — RLS policies, Postgres functions/RPCs, triggers, `pg_cron`, and **Supabase Edge Functions** (the one serverless escape hatch for work that needs the service-role key: cleanup, push, account deletion, link unfurling). Every item evolves the existing `nokor_*` tables incrementally; nothing requires a rewrite.

Priorities: **P0** = foundational or fixes a real current defect · **P1** = next milestone · **P2** = later.

---

## 8. Security & Privacy Hardening

### 8.1 Auth hardening — password policy, leaked-password check, CAPTCHA (P0)
Today the 6-char password minimum exists only as an HTML attribute, and sign-up has no bot protection against scripted anon-key abuse.
- The system shall enforce a **minimum password length of 10 server-side** (Supabase Auth setting — one value everywhere), reject passwords found in the HaveIBeenPwned leaked-password corpus, and require a valid **Cloudflare Turnstile** token on `signUp`/`signInWithPassword` (fits the existing Cloudflare Pages deploy).
- Email confirmation before first sign-in stays required; Supabase's built-in auth rate limits (sign-up, token, OTP) get tightened in the same settings pass.
- *Mechanism:* Auth dashboard settings + Turnstile widget in `AuthPanel` passing `options.captchaToken`. No schema changes.

### 8.2 Account recovery & email change (P0)
There is no forgot-password or email-change flow — a locked-out user is locked out forever.
- The system shall offer **Forgot password** (`resetPasswordForEmail` with `redirectTo: /nokor/`), detect the `PASSWORD_RECOVERY` auth event on load and show a set-new-password form before any other view, and support **email change with double-confirmation** (both addresses confirm).
- The existing but unwired `changePassword` capability shall be exposed in Nokor settings.
- *Mechanism:* client-only + Auth config, same pattern as the existing `?join=` handling.

### 8.3 Private media bucket with signed URLs (P0)
`nokor-media` is public, so hidden-from-follower story images, expired story images, and deleted-post images stay URL-fetchable forever — silently breaking the privacy RLS otherwise enforces.
- The system shall flip `nokor-media` to **private** and serve post/story/room images via time-limited signed URLs, reusing the cached signed-URL machinery already built for `chat-attachments`.
- A storage `SELECT` policy backed by `nokor_can_see_media(name)` (SECURITY DEFINER) shall authorize by path pattern: the referencing row must exist, the story must be unexpired, and no `nokor_story_hidden` row may match the caller — deleted-post images become unreadable automatically.
- `avatars` stays public as a documented, low-sensitivity exception.
- *Ripple (sequence together):* every `getPublicUrl` call site moves behind one `mediaUrl()` helper; thumbnails, PWA media caching (cache by storage *path*, not rotating signed URL), and video playback all depend on this helper.

### 8.4 Server-side write rate limiting (P0)
Nothing limits write volume — one authenticated user can flood posts, DMs, or follows at wire speed via raw PostgREST.
- The system shall enforce per-user rolling-window caps in Postgres: posts 10/h, stories 10/h, comments 60/h, DM+room messages 30/min combined, follows 100/h, reports 20/24 h; `nokor_join_room` and `nokor_open_dm` capped at 20 calls/h, and `nokor_open_dm` additionally capped at 20 new threads/day. Admins (`is_admin()`) are exempt.
- *Mechanism:* one canonical `nokor_rate_limits` counter table (RLS on, zero client policies) + `nokor_check_rate(action, limit, window)` called from `BEFORE INSERT` triggers on the six content tables and inside the two RPCs; supporting `(author, created_at)` indexes; `pg_cron` purges buckets older than 48 h. Clients map the `rate_limited` error to a localized "slow down" notice.

### 8.5 Server-stamped timestamps & DB content constraints (P0 — one merged migration)
`created_at`/`edited_at` are client-clock values, and all char/count limits are HTML-only — raw PostgREST accepts anything RLS allows.
- A `nokor_stamp_times()` trigger shall force `created_at = now()` on insert and `edited_at = now()` on body updates for all content tables, ignoring client-supplied values.
- CHECK constraints shall enforce: post body ≤ 2000 and `image_paths` ≤ 6; comment ≤ 1000; message bodies ≤ 4000; story caption ≤ 200, `expires_at` within 1–48 h of `created_at`, `background` in the 6 preset keys; reaction emoji in the fixed 6-emoji set; room name ≤ 80 / description ≤ 300; profile field limits.
- Insert policies shall reject trimmed-empty posts with no images and trimmed-empty messages with no attachment; the migration truncates any existing over-limit rows first so it applies cleanly.

### 8.6 RLS audit pass (P0)
SECURITY DEFINER helpers are the entire authorization layer, and `profiles` exposes **phone and birthday to every authenticated user**.
- The system shall pin `search_path` on every SECURITY DEFINER function, and REVOKE/GRANT EXECUTE consistently on every `nokor_*` RPC (anon revoked, authenticated granted).
- `profiles.phone` and `profiles.birthday` shall move to a **`profiles_private`** table with a self-only SELECT policy (backfill, then drop the columns; `useProfile` reads/writes both tables).
- Automated **pgTAP** tests shall prove the core invariants: non-members can't read room messages, hidden followers can't read hidden stories, nobody reads another user's location row.
- *Coordinate:* the handle/badge triggers (§13) also touch `profiles` — all profile triggers share one `set_config` guard-flag convention and use reset-to-OLD rather than raising, so `useProfile`'s whole-row upsert keeps working.

### 8.7 Invite-link policy & join preview (P1)
Invite codes never expire and joining is a silent auto-action on page load.
- `nokor_rooms` shall gain `invite_expires_at`, `invite_max_uses`, `invite_uses`; `nokor_join_room` shall reject expired/exhausted codes, and `nokor_revoke_room_invite` shall reset the counter when rotating. Owner/admin set expiry (1 d / 7 d / never) and max uses (10 / 100 / ∞) from Room Info.
- Landing on `/nokor?join=<code>` shall show a **preview modal** (name, kind, member count — finally using the existing `nokor_room_preview` RPC) with an explicit Join button instead of silently auto-joining.
- Ban enforcement at join time belongs to §10.4 (room bans), which this depends on.

### 8.8 Private accounts with follow requests (P1)
Every post, story, and profile is currently visible to all authenticated users.
- `profiles.is_private` + `nokor_follows.status ('pending'|'accepted')`, forced by a trigger from the target's privacy setting regardless of client-supplied values.
- SELECT policies on `nokor_posts`/`nokor_stories` shall admit only the owner and accepted followers via a `nokor_can_view_user()` helper; `nokor_nearby_users` excludes private accounts from strangers; only `accepted` rows count as follows anywhere.
- Accept/decline lands in the activity tab via `nokor_respond_follow`. The feed RPC (§11.2) and post-detail view (§12.1) must gate through the same helper.

### 8.9 Account deletion & data export — GDPR posture (P1)
For an app storing DMs, photos, and opt-in location, there is currently no way to delete an account or export data.
- A `nokor-account` **Edge Function** (JWT-verified, then service-role) shall provide: **export** (one JSON of all the caller's rows across `nokor_*` + profile) and **delete** (re-authentication + typed confirmation required; removes all storage objects under the user's prefixes, then `auth.admin.deleteUser()` so FK cascades clear the rows).
- Deletion shall be refused while the user still owns rooms — "transfer or delete your rooms first," mirroring the existing leave guard. A small migration ensures every `nokor_*` user FK is `ON DELETE CASCADE`.

### 8.10 OAuth sign-in (P1) and TOTP 2FA (P2)
- **Google OAuth** via `signInWithOAuth` works under the static export (PKCE is client-side; redirect back to `/nokor/`); verify the lazy profile upsert covers first OAuth sign-in.
- **TOTP 2FA** via `supabase.auth.mfa` (enroll QR in a Security section, challenge step in AuthPanel). Sensitive actions — `nokor_transfer_room_owner`, account deletion — shall require the JWT `aal2` claim when the caller has a verified factor (`nokor_has_mfa()` helper).

### 8.11 Session management (P2)
- Nokor settings shall offer change-password (same server-side policy as sign-up), **"Sign out other devices"** (`signOut({scope: 'others'})` — zero backend), and a session list (created time, user agent, current-device marker) served by a `sessions` action on the same `nokor-account` Edge Function via the GoTrue admin API.

---

## 9. Trust & Safety / Moderation

### 9.1 Enforce the existing sitewide block list (P0)
`admins`/`blocked_users` already works for the portfolio chat, but **no `nokor_*` policy checks it** — a site-blocked user retains full Nokor access, and `admin_remove_user` leaves all their Nokor content intact.
- Every `nokor_*` insert/update policy and storage upload policy shall add `NOT is_blocked()`; every `nokor_*` RPC shall raise `BLOCKED` for a blocked caller.
- A signed-in blocked user shall see a full-screen blocked notice (realtime on their own `blocked_users` row) within seconds, hiding all tabs and composers.
- `admin_remove_user` shall additionally delete the target's Nokor content (posts, comments, likes, follows, stories, messages, memberships, location; rooms they own).

### 9.2 User-level block (P0)
There is no way for one user to protect themselves from another — and since all authorization is RLS, blocking must be a database filter, not a UI hide.
- **`nokor_blocks`** (blocker, blocked; own-rows-only RLS) with atomic `nokor_block_user` / `nokor_unblock_user` RPCs (block also deletes both follow edges); a `nokor_blocked_pair(a,b)` helper referenced by amended SELECT policies on posts/comments/likes/stories → **mutual invisibility** on feed, comments, stories, and activity with no client changes.
- DMs: `nokor_open_dm` raises `BLOCKED`; message insert policy rejects sends into a blocked pair's thread; existing history stays readable with the composer disabled ("unblock to message"). `nokor_nearby_users` never returns a blocked pair. In shared rooms, the viewer sees a collapsed "blocked user" placeholder with tap-to-reveal (client-side, so room history stays coherent).
- Managed from a "Blocked users" list in Settings (§13.3), which consumes this table rather than defining its own.

### 9.3 One-way mute (P1)
Quiet filtering without confrontation — deliberately **client-side only**, because symmetric RLS would leak who muted whom.
- **`nokor_mutes`** (muter-only RLS). Muted users' posts, comments, story groups, activity rows, and Nearby cards are filtered from the muter's assembled arrays; DM threads stay listed but de-emphasized; room messages collapse behind tap-to-reveal. The muted user loses nothing and learns nothing.

### 9.4 Room bans distinct from kicks (P0)
Documented defect: a kicked user rejoins via the still-valid invite link.
- **`nokor_room_bans`** + `nokor_ban_room_member` / `nokor_unban_room_member` RPCs reusing the exact kick permission matrix (admins ban members, only the owner bans admins, nobody bans the owner). `nokor_join_room` and `nokor_add_room_members` raise `BANNED` regardless of invite validity.
- A banned user landing on an invite link sees an explicit "banned from this room" error (with the room name via `nokor_room_preview`) instead of today's silent null. Room Info gains Ban next to Kick plus a Banned list with Unban. A plain kick stays non-banning.

### 9.5 Reports (P0) and the moderation queue (P1)
No user can flag anything today, so the admin has zero signal.
- **`nokor_reports`**: Report actions on posts, comments, DM/room messages, stories, and profiles, recording `target_kind`/`target_id`/`target_user_id`, a fixed reason set (spam, harassment, nudity, violence, hate, scam, other), optional note ≤ 500 chars, and a **body snapshot** at report time so edits/deletes can't destroy evidence. Own-content and duplicate-open reports rejected; reporters read only their own rows; 20 reports/24 h cap. Design the table with nullable `reporter_id` + a `source ('user'|'auto')` column up front so the banned-terms filter (§9.7) needs no breaking migration.
- **Moderation queue** (admin-only view in Nokor, gated by the existing `is_admin()`): list open reports with a realtime badge; per-row actions — dismiss, remove content (`nokor_admin_remove_content`: hard-delete posts/comments/stories, soft-delete messages in the existing deleted-shape), block author sitewide (existing `admin_block_user`), or room-ban the author. For reported messages, `nokor_admin_report_context` returns only that message ± 10 neighbors — **admins get no blanket DM read access**. Every resolution stamps status/resolver/time.

### 9.6 Moderation audit trail & appeals (P2)
- **`nokor_moderation_log`** — immutable, admin-read-only, written from inside the existing definer RPC bodies (block, remove, resolve, ban/unban, kick, invite rotation).
- **`nokor_appeals`** — a sitewide-blocked user may file exactly one open appeal from the blocked screen (the sole write permitted while blocked; coordinate the policy exemption with §9.1), room-banned users one per room; admins decide via `nokor_admin_decide_appeal` which unblocks/unbans and stamps atomically; the appellant sees their appeal status.

### 9.7 Banned-terms filter with auto-flagging (P2)
- Admin-managed **`nokor_banned_terms`** (citext; enable the extension) where each term is `reject` (insert fails with `CONTENT_POLICY`) or `flag` (insert succeeds and an auto-report with `source='auto'` is filed, exempt from the reporter rate cap). Enforced by a `nokor_scan_body()` trigger on posts, comments, and both message tables — raw PostgREST writes are equally covered.

---

## 10. Scalability & Performance

### 10.1 Denormalized counters via triggers (P0)
Counts are currently computed by downloading every like/comment row and filtering arrays; profiles fetch **all** posts just to count them.
- `nokor_posts.like_count/comment_count`, `nokor_comments.like_count`, and a **`nokor_user_stats`** table (post/follower/following counts) maintained by AFTER INSERT/DELETE triggers, backfilled in the same migration. Feed and profile render counts from the rows; `liked_by_me` resolves with one query scoped to on-screen ids. NokorProfile's head-count queries also switch to `nokor_user_stats`.

### 10.2 Cursor-paginated feed via one `nokor_feed` RPC (P0)
`FEED_LIMIT = 50` makes older posts permanently unreachable, and each load is 5 sequential round trips.
- Pages of 20 by keyset cursor `(created_at, id)` with an IntersectionObserver sentinel — every historical post becomes reachable. The RPC (SECURITY INVOKER so RLS applies; must adopt the §8.8 visibility helper) returns posts + author + counters + `liked_by_me` + the 2 newest comments in one call; full threads load on demand via `nokor_post_comments`; the profile grid pages via `nokor_user_posts`.

### 10.3 Windowed conversation loading (P0)
Conversations load every message and reaction on open, and again after every realtime event.
- Open = newest 50 messages; older pages of 50 on scroll-to-top with preserved scroll position; reactions fetched only for the loaded window; out-of-window reply parents resolved by a single row fetch. One `nokor_messages_page` RPC returns messages + reactions + reply snippets per page.

### 10.4 Hot-path composite indexes (P0)
- One additive migration: every pagination ORDER BY and counter path gets a matching btree index (posts by `(created_at desc, id desc)` and `(user_id, created_at desc)`, messages by `(thread_id|room_id, created_at desc)`, likes/comment-likes/follows lookup pairs, `nokor_stories(expires_at)`, thread/room `last_message_at`), absorbing the `(author, created_at)` indexes rate limiting needs. Verified by EXPLAIN showing no seq scans on the paginated paths.

### 10.5 Targeted realtime — private broadcast topics (P0)
The worst multiplicative cost today: unfiltered subscriptions × full refetch — any user's reaction anywhere refetches every connected client.
- No subscription shall be table-wide: DB-side triggers call `realtime.broadcast_changes` to scoped topics — `nokor:dm:<threadId>`, `nokor:room:<roomId>`, and a per-user `nokor:user:<uuid>` inbox topic — all `private: true`, authorized by an RLS policy on `realtime.messages` checking thread participation / room membership (the existing typing broadcast already proves the channel shape).
- Testable invariant: a reaction in thread X produces zero network traffic in a client viewing thread Y.
- *Ripple:* the flags, notifications, and inbox subscriptions assume `postgres_changes` channels — migrate those client subscriptions in the same pass.

### 10.6 Delta-applying client cache (P1)
- Realtime events shall update normalized per-hook Maps (append/merge/remove by id) instead of refetching everything; full refetch remains only for mount and channel error/rejoin recovery. Optimistic toggles gain **rollback on error** (closing the documented no-rollback gap), and loaded pagination pages survive incoming events.

### 10.7 Inbox consolidation (P1)
- Trigger-maintained `last_message_preview/sender/kind` columns on `nokor_dm_threads` and `nokor_rooms`, plus **one `nokor_inbox()` RPC** returning the merged thread+room list with metadata, preview, and per-conversation `unread_count` (from the existing read watermarks, capped 99) — zero message rows fetched at list time. This RPC is the **single source of truth for previews and unread counts**; the chat-tab badge and "New messages" divider (§12.3) consume it. Live updates via the per-user topic re-render only the affected row.

### 10.8 Image downscaling & thumbnails (P1)
A 20-post feed page can currently pull 100 MB of originals on mobile.
- Client-side re-encode before upload (`createImageBitmap` + canvas): posts/stories max 1920 px long edge, avatars max 512 px, WebP/JPEG ~0.85. List surfaces request width-appropriate variants (avatar ≤ 200 px, grid ≤ 400 px, feed ≤ 1080 px) via an uploaded **`-thumb.webp` sibling by default** (Supabase image transforms are a paid feature and break on private buckets — the thumb fallback works everywhere and stays signed-URL-compatible). All delivery goes through the single `mediaUrl(path, width)` helper from §8.3. `loading="lazy"` + explicit aspect-ratio boxes prevent pagination layout shift.

### 10.9 Scheduled cleanup — the canonical job (P1)
Expired stories and orphaned uploads currently live forever in public storage.
- One **`nokor-cleanup` Edge Function** (service role), scheduled nightly via `pg_cron` + `pg_net`: hard-delete stories expired > 24 h (FK cascade clears views/hidden — add the cascades if missing) and their storage objects; sweep `nokor-media` objects older than 24 h referenced by no row (the grace window protects in-flight composes). Idempotent; logs deletion counts per run.

### 10.10 Parallel, failure-tolerant multi-image upload (P2)
- Concurrent uploads (max ~3 in flight, `Promise.allSettled`); on any failure, delete the succeeded objects before surfacing the error — zero orphans per attempt; per-image n/N progress in the composer. The nightly sweep remains the crash backstop.

### 10.11 Membership-aware room realtime (P2)
- Room metadata and membership changes ride the room's broadcast topic; a kicked user gets a `removed` event on their user topic that force-closes the room view. The room list stops subscribing to `nokor_room_messages` entirely once the inbox topic delivers previews.

---

## 11. Modern UX & Real-World Social Features

### 11.1 Hash-based URL routing & durable deep links (P0)
Reload currently loses all navigation state, and share links only work inside the newest-50 window.
- Routes `#/home`, `#/activity`, `#/chat`, `#/chat/dm/<id>`, `#/chat/room/<id>`, `#/profile/<userId>`, `#/post/<postId>`, `#/tag/<tag>`, `#/search/<q>`, `#/saved` — restored on load and on back/forward (`hashchange`); hash never reaches the server, so it's static-export-safe. Keep supporting the already-copied `#post-<id>` share format as an alias for the post-detail route.
- A **`NokorPostDetail`** view fetches any post by id (making every post ever created shareable), with a localized "post unavailable" state for missing/RLS-blocked ids — gated by the same visibility helper as §8.8 once private accounts land. The `?join=` invite flow continues unchanged.

### 11.2 Persisted notifications with a wired badge (P0)
The activity feed is derived on every load, and the tab-bar badge plumbing exists but is never fed. This table is also the prerequisite for mentions and push.
- **`nokor_notifications`** (recipient, actor, kind `like|comment|reply|follow|mention`, target refs, `read_at`) written **only by triggers** on likes/comments/follows (never for self-actions; un-like/un-follow deletes the row); recipient-only RLS.
- Paginated activity via a keyset `nokor_activity` RPC (pages of 30, actor profiles joined server-side); realtime filtered to `user_id=eq.<viewer>`; opening the tab calls `nokor_mark_notifications_read()`; `NokorApp` finally passes the unread count into `NokorTabBar`'s existing `activityCount` prop ("9+" cap).

### 11.3 Unread message counts (P0)
Read watermarks already exist but nothing tells the user they have unread messages.
- Per-conversation unread badges (capped "99+"), bolded unread previews, a chat-tab total badge, and a "New messages" divider above the first unread message — all **sourced from the `nokor_inbox()` RPC** (§10.7), zeroed by the existing `markRead` upsert.

### 11.4 Full-text search (P1)
Content older than the feed window is effectively lost; the only way to find a user is to already know them.
- One `nokor_search(q)` RPC (SECURITY INVOKER) unioning: posts via a generated `tsvector` column + GIN (`websearch_to_tsquery`, ranked by relevance then recency, 20/type); people via `pg_trgm` similarity on username (typo-tolerant); rooms via ILIKE among the caller's memberships. **Khmer note:** tsvector's `simple` config can't segment Khmer (no word boundaries) — the trigram path carries Khmer post search too. Debounced search view at `#/search/<q>`; results navigate via the hash router.

### 11.5 @mentions & #hashtags (P1)
- Composer/comment `@` autocomplete (follower/following union + username search) inserting `@username` and recording the chosen `user_id` in **`nokor_mentions`** (RLS: only on content you authored — client-resolved, so advisory) → `kind='mention'` notifications via trigger.
- Hashtags extracted **server-side** by trigger (`#[\p{L}\p{N}_]+`, lowercased, max 10) into **`nokor_post_tags`**; bodies render mentions/tags as links (`#/profile/…`, `#/tag/…`); the tag view lists newest-first tagged posts; deleting a post cascades both tables.

### 11.6 Bookmarks (P1)
- **`nokor_bookmarks`** mirroring the proven `nokor_likes` pair-table shape, but **private** (owner-only RLS, no counts shown). Toggle on PostCard with optimistic flip; a `#/saved` view fetches bookmarked posts by id — escaping the feed window; post deletion cascades.

### 11.7 PWA — manifest, service worker, offline shell (P1)
- Hand-written `public/nokor/manifest.webmanifest` (standalone display, light/dark theme colors, 192/512 icons) + `public/nokor-sw.js` (scope `/nokor/`): precache the app shell, network-first navigations with shell fallback, cache-first media with a 200-entry LRU **keyed by storage path** (survives the §8.3 signed-URL flip), never cache PostgREST/Auth/Realtime. Offline banner via `online`/`offline` events; contextual install prompt card. The static export serves `public/` verbatim — no build plugin needed. Prerequisite for push.

### 11.8 Web Push via Edge Function (P1)
Realtime only works while the tab is open — without push, DMs and mentions go unseen for hours.
- **`nokor_push_subscriptions`** (owner-only RLS; endpoint unique; opt-in/out from `NokorPrefs`). A `nokor-push` Edge Function (VAPID keys in secrets) invoked by **Database Webhooks** on `nokor_notifications` and `nokor_dm_messages` inserts: resolves recipients, **skips DMs already read per the watermark**, sends localized payloads with hash-route deep links, prunes 404/410 endpoints. `notificationclick` focuses an existing tab (`clients.matchAll` + navigate) or opens the deep link. Depends on §11.2 and §11.7.

### 11.9 Accessibility & interaction polish (P1)
- **Bug fix hiding here — do first:** the story viewer shall open each group at the **first unseen story** (the seen-set is already loaded; only the index is wrong).
- `prefers-reduced-motion`: no story auto-advance (manual nav, static progress), non-essential animations disabled. All modals: focus trap, focus restore, Escape, `role="dialog"`/`aria-modal`. Tab bar as `tablist` with `aria-selected` and count-bearing labels ("Chat, 3 unread"); localized `aria-label`s on every icon-only button; `aria-live="polite"` for toasts; 44×44 px minimum targets; full keyboard operability.

### 11.10 Polls (P2)
- `nokor_polls` / `nokor_poll_options` / `nokor_poll_votes` (composite PK = one vote per user), voting through `nokor_vote_poll` (checks `closes_at` and option consistency). Votes carry an **own-row-only SELECT policy**; aggregate counts are served exclusively by the definer RPC `nokor_poll_results` — "aggregate-only reads" is not expressible as a policy. 2–4 options ≤ 60 chars, durations 1 h/1 d/3 d; percentage bars after voting/close; live via the feed channel.

### 11.11 Short video posts (P2)
- One video per post (`video/mp4|webm`), mutually exclusive with images: nullable `video_path`/`video_poster_path` on `nokor_posts`; client-side poster-frame grab; muted-autoplay at ≥ 60% visibility with pause off-screen, tap-to-unmute, reduced-motion → poster until tapped. **Honest limits:** ≤ 60 s is client-side only (no transcoding); the 50 MB bucket cap is the only server-enforceable bound. Playback URLs go through `mediaUrl()` (§8.3).

### 11.12 Link preview cards (P2)
- Client-side unfurling is impossible (CORS) — a `nokor-link-preview` **Edge Function** (JWT-required) fetches OG metadata with strict SSRF guards (≤ 3 redirects, 5 s timeout, ≤ 512 KB, HTML only, refuse private/loopback/link-local addresses), cached 7 days in `nokor_link_previews` (nightly purge > 30 d). Composer shows a dismissible preview before posting; cards open with `rel="noopener noreferrer"`; hotlinking the cached image is an accepted solo-dev tradeoff.

---

## 12. Platform & Product Foundations

### 12.1 Unique @handles (P0)
`profiles.username` is free-text and **non-unique** — users can impersonate each other, and mentions, search, and share links all depend on stable identity.
- `profiles.handle`: unique case-insensitively (functional index on `lower(handle)`), 3–30 chars, `^[a-z0-9_]+$`, stored lowercase; a reserved list (`nokor_reserved_handles`: admin, nokor, support, api, …); ≤ 2 changes per rolling 30 days (`nokor_handle_changes` log).
- Settable **only** via `nokor_set_handle` RPC + live `nokor_check_handle` availability check; a BEFORE UPDATE trigger on `profiles` **resets handle to OLD** unless the RPC's `set_config` guard flag is present (raise would break `useProfile`'s whole-row upsert — same convention as the badge trigger). Backfill assigns slugified deduplicated handles; `username` remains the display name; `@handle` renders beside names everywhere.

### 12.2 Onboarding (P1)
New sign-ups currently land on an empty feed as `user-xxxx` with nobody to follow.
- A first-run wizard (gate: no handle or `profiles.onboarded_at` null): mandatory handle claim → optional avatar → optional follow suggestions from `nokor_suggested_users` (top accounts by follower count/recency, excluding self/followed/blocked — depends on §12.1 and §9.2). Completing or skipping stamps `onboarded_at` exactly once, on any device.

### 12.3 Settings center (P1)
Nokor has no settings surface at all.
- A Settings view with sections: **Account** (email, password, handle, sessions), **Privacy** (private account §8.8, who-can-DM-me: everyone|people-I-follow, read receipts on/off), **Notifications** (per-category toggles feeding §11.2/§11.8), **Blocked users** (managing §9.2's `nokor_blocks` — not a second table).
- Preferences persist server-side in **`nokor_settings.prefs` (jsonb, owner-only RLS)** and apply across devices. Read-receipts-off suppresses both sending and seeing "Seen" (v1: client honors the pref before `markRead` exposure and rendering).

### 12.4 Feature flags (P1)
A static export on two hosts has no way to dark-launch or kill a misbehaving feature without redeploy.
- **`nokor_flags`** (key, enabled, rollout_pct; authenticated read, admins write — reusing the existing `admins` table). Deterministic per-user bucketing (`FNV-1a(userId + key) % 100`), effective on running clients within 60 s (localStorage-cached fetch + realtime on the table — added to the publication, and migrated with §10.5). Proving case: gate Nearby at 100%.

### 12.5 Client error reporting (P1)
Errors currently vanish in users' browsers — the doc already documents silent failure paths.
- **`nokor_client_events`**: INSERT-only for users (own rows), admin-only SELECT; captures `window.onerror`, `unhandledrejection`, and a React ErrorBoundary around the tab views — name, message, stack ≤ 4 KB, tab, build SHA (`NEXT_PUBLIC_COMMIT_SHA` injected at build), UA. **Scrubbed** (never bodies/tokens/emails), throttled to 5/min client-side, auto-deleted after 30 days via `pg_cron`. Plain PostgREST — no Edge Function needed.

### 12.6 Privacy-friendly analytics (P2)
- Aggregate-only counters, no trackers, matching Nokor's privacy invariants: `nokor_metrics_daily` (day × metric upserts) + `nokor_dau` keyed by `sha256(user_id || day)` so cross-day linkage is impossible. One definer RPC `nokor_track(metric)` with a **hardcoded allowlist**; fire-and-forget calls at existing action sites; admin-only reads; 12-month prune.

### 12.7 Verified / creator badges (P2)
- `profiles.badge ('verified'|'creator'|null)`, grantable only via `admin_set_badge` RPC; the profiles trigger resets client-supplied badge values to OLD (shared guard convention with §12.1). One `NokorBadge` component rendered beside the handle on the five identity surfaces.

### 12.8 Versioned schema contract (P0 — do before the migration wave)
`types.ts` is hand-written to mirror the migrations — silent drift with a deployed static client is inevitable and currently undetectable.
- Generate `types.ts` via `supabase gen types typescript` (`npm run gen:types`); CI fails on diff against the committed file. A **`nokor_meta`** table stores an integer schema version bumped by every client-visible migration; the client compares its compiled version at boot and shows a non-blocking "new version available — reload" banner on mismatch. Do the one-time generated-types migration **before** the Part II schema wave, not after.

### 12.9 Backup & disaster recovery (P0)
All data lives in one Supabase project; Postgres backups don't cover Storage.
- Enable PITR (paid tier) or verify daily backups (free tier), with a committed restore runbook and one restore drill against a scratch project. Nightly `backup-storage` Edge Function pages new/changed objects from all three buckets to **Cloudflare R2** (S3 API; the Cloudflare account already exists for Pages), logging each run to an admin-readable `nokor_backup_log`.

### 12.10 i18n scaling (P2)
- Split the `nokor` block into per-locale modules (`NokorMessages = typeof nokorEn` preserves the missing-key typecheck), dynamic-`import()` non-default locales (static-export-safe code splitting), default from `navigator.language`, sync the choice via `nokor_settings.prefs`, and replace hand-rolled timeAgo with `Intl.RelativeTimeFormat`/`NumberFormat`. Acceptance: adding a locale = one module + one list entry.

---

## 13. Cross-Cutting Dependencies & Sequencing

Duplicate designs were resolved to a single owner:

| Concern | Canonical owner | Folded in / dropped |
|---|---|---|
| Notifications table | §11.2 (`nokor_notifications`, badge, mention-ready) | scalability's variant dropped; its keyset `nokor_activity` RPC kept |
| User blocks | §9.2 (`nokor_blocks` + RPCs + policy amendments) | Settings (§12.3) consumes it |
| Room bans | §9.4 (dedicated ban RPCs) | invite-policy (§8.7) keeps only TTL/caps/preview |
| Rate limiting | §8.4 (counter table + `nokor_check_rate`) | trust-safety trigger variant dropped; its `nokor_open_dm` guard, admin exemption, and indexes carried over |
| Cleanup job | §10.9 (`nokor-cleanup`) | security's duplicate dropped; its FK-cascade audit kept |
| Sessions | §8.11 (composed into `nokor-account`) | platform variant dropped |
| Unread counts | §10.7 (`nokor_inbox` is the single source) | §11.3 keeps only the badge/divider UI |
| Content CHECKs | §8.5 (one merged migration) | trust-safety's truncate-violators pass + non-empty policies merged in |

Sequencing constraints that cut across sections:

1. **Schema contract first** (§12.8): regenerate types before the migration wave, then bump versions per migration.
2. **The private-bucket flip (§8.3) ripples** into thumbnails (§10.8), PWA media caching (§11.7), and video playback (§11.11) — ship the `mediaUrl()` helper with the flip so those are one-file changes.
3. **Targeted realtime (§10.5) removes `postgres_changes` channels** that flags (§12.4), notifications (§11.2), and inbox (§10.7) subscriptions assume — migrate those client subscriptions in the same pass.
4. **Three features add triggers on `profiles`** (handles §12.1, badges §12.7, private split §8.6) while `useProfile` does whole-row upserts — one shared `set_config` guard convention, reset-to-OLD (never raise), and a check of portfolio-side profile readers.
5. **Password policy is one value (10), set once** — §8.1 and §8.2 share the same Auth settings pass.
6. Dependency chains: notifications → mentions → push (with PWA); handles → onboarding → mentions autocomplete; blocks → settings → onboarding suggestions; counters → feed RPC → delta cache; reports → mod queue → appeals/banned-terms.

---

## 14. Phased Roadmap

**Phase 1 — Foundations & defect fixes (all P0)**
Schema contract + generated types (§12.8) · backups (§12.9) · auth hardening + recovery (§8.1–8.2) · private media bucket + `mediaUrl()` (§8.3) · rate limiting (§8.4) · server stamps + CHECKs (§8.5) · RLS audit + `profiles_private` (§8.6) · sitewide-block enforcement (§9.1) · user blocks (§9.2) · room bans (§9.4) · reports (§9.5) · counters + feed pagination + conversation windowing + indexes + targeted realtime (§10.1–10.5) · hash routing + post detail (§11.1) · notifications + badge (§11.2) · unread counts UI (§11.3) · first-unseen story fix (§11.9) · unique handles (§12.1).

**Phase 2 — Product maturity (P1)**
Invite policy + join preview (§8.7) · private accounts (§8.8) · account deletion/export (§8.9) · OAuth (§8.10) · moderation queue (§9.5) · mutes (§9.3) · delta cache (§10.6) · inbox RPC (§10.7) · thumbnails (§10.8) · cleanup job (§10.9) · search (§11.4) · mentions/hashtags (§11.5) · bookmarks (§11.6) · PWA (§11.7) · push (§11.8) · accessibility (§11.9) · onboarding (§12.2) · settings center (§12.3) · feature flags (§12.4) · error reporting (§12.5).

**Phase 3 — Growth & polish (P2)**
2FA (§8.10) · session UI (§8.11) · audit log + appeals (§9.6) · banned terms (§9.7) · parallel uploads (§10.10) · room realtime scoping (§10.11) · polls (§11.10) · video posts (§11.11) · link previews (§11.12) · analytics (§12.6) · badges (§12.7) · i18n scaling (§12.10).

### New schema at a glance (Part II cumulative)

| Kind | Additions |
|---|---|
| Tables | `nokor_user_stats`, `nokor_rate_limits`, `profiles_private`, `nokor_room_bans`, `nokor_blocks`, `nokor_mutes`, `nokor_reports`, `nokor_moderation_log`, `nokor_appeals`, `nokor_banned_terms`, `nokor_notifications`, `nokor_post_tags`, `nokor_mentions`, `nokor_bookmarks`, `nokor_push_subscriptions`, `nokor_polls` (+options/votes), `nokor_link_previews`, `nokor_settings`, `nokor_flags`, `nokor_client_events`, `nokor_metrics_daily`, `nokor_dau`, `nokor_reserved_handles`, `nokor_handle_changes`, `nokor_meta`, `nokor_backup_log` |
| Columns | counters on posts/comments; `profiles.handle/is_private/badge/onboarded_at`; `nokor_follows.status`; room invite TTL/uses; thread/room last-message previews; `nokor_posts` search vector, video paths, link-preview hash |
| Edge Functions | `nokor-account` (export/delete/sessions), `nokor-cleanup`, `nokor-push`, `nokor-link-preview`, `backup-storage` |
| Jobs | pg_cron: cleanup, rate-bucket purge, error-log retention, link-preview purge, analytics prune, nightly backup |

The end state remains a **fully static client + Supabase backend**: every new server behavior is a policy, trigger, RPC, cron job, or Edge Function — no Node server ever enters the architecture.

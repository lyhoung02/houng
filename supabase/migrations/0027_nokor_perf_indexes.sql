-- Nokor hot-path indexes for keyset pagination and viewer-scoped lookups.
--
-- Purely additive. Indexes already present from earlier migrations are not
-- repeated: nokor_posts_created_at_idx (created_at desc),
-- nokor_comments_post_idx (post_id, created_at),
-- nokor_follows_following_idx (following_id),
-- nokor_dm_messages_thread_idx (thread_id, created_at),
-- nokor_room_messages_room_idx (room_id, created_at),
-- nokor_stories_expires_idx (expires_at). Follower/like/comment-like paths that
-- are the leading column of an existing primary key are already covered.

-- Feed keyset on (created_at, id) and the per-author profile grid.
create index if not exists nokor_posts_created_id_idx
  on public.nokor_posts (created_at desc, id desc);
create index if not exists nokor_posts_user_created_idx
  on public.nokor_posts (user_id, created_at desc);

-- "Did I like these?" scoped to the viewer (the PKs lead with post_id /
-- comment_id, so a user-leading index is what these queries need).
create index if not exists nokor_likes_user_post_idx
  on public.nokor_likes (user_id, post_id);
create index if not exists nokor_comment_likes_user_idx
  on public.nokor_comment_likes (user_id, comment_id);

-- Inbox ordering by recency.
create index if not exists nokor_dm_threads_last_msg_idx
  on public.nokor_dm_threads (last_message_at desc);
create index if not exists nokor_rooms_last_msg_idx
  on public.nokor_rooms (last_message_at desc);

-- Schema contract ------------------------------------------------------------

insert into public.nokor_meta (key, value) values ('schema_version', '27')
on conflict (key) do update set value = excluded.value;

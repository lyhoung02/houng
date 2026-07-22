export type Sender = "visitor" | "admin";

/** Attachment-bearing kinds all carry attachment_path; "text" never does. */
export type MessageKind = "text" | "image" | "file" | "audio" | "video";

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender: Sender;
  body: string;
  created_at: string;
  emailed_at: string | null;
  kind: MessageKind;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  attachment_mime: string | null;
  duration_ms: number | null;
  reply_to_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  /** Set when the message came from a suggestion chip; drives the auto-reply. */
  suggestion_key: string | null;
};

export type Reaction = {
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export type Relationship =
  | "single"
  | "in_a_relationship"
  | "engaged"
  | "married"
  | "complicated"
  | "private";

export type Gender = "female" | "male" | "other" | "private";

/** Cambodia geo gazetteer rows (migration 0033). */
export type KhProvince = { code: string; name_km: string; name_en: string; type: string | null };
export type KhDistrict = KhProvince & { province_code: string };
export type KhCommune = KhDistrict & { district_code: string };
export type KhVillage = KhCommune & { commune_code: string };

/** Admin-granted profile badge (migration 0031). */
export type NokorBadgeKind = "verified" | "creator";

/** Signup metadata → auth.users.raw_user_meta_data → profile row (trigger,
 *  migration 0036). Keys must match what handle_new_user() reads. */
export type NokorSignUpMeta = {
  first_name: string;
  last_name: string;
  gender: Gender | null;
  phone: string | null;
  current_province_code: string | null;
  current_district_code: string | null;
  current_commune_code: string | null;
  current_village_code: string | null;
  /** Denormalised display string for the selected address. */
  current_city: string | null;
};

export type Profile = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  phone: string | null;
  avatar_path: string | null;
  bio: string | null;
  work: string | null;
  education: string | null;
  hometown: string | null;
  current_city: string | null;
  /** Structured Cambodia address codes (migration 0033). current_city/hometown
   *  hold the denormalised display string; these re-select the dropdowns. */
  current_province_code: string | null;
  current_district_code: string | null;
  current_commune_code: string | null;
  current_village_code: string | null;
  home_province_code: string | null;
  home_district_code: string | null;
  home_commune_code: string | null;
  home_village_code: string | null;
  relationship: Relationship | null;
  website: string | null;
  /** ISO date (yyyy-mm-dd). */
  birthday: string | null;
  gender: Gender | null;
  languages: string[] | null;
  badge: NokorBadgeKind | null;
  created_at: string;
  updated_at: string;
};

export type CommunityMessage = {
  id: string;
  user_id: string | null;
  body: string;
  kind: MessageKind;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  attachment_mime: string | null;
  duration_ms: number | null;
  reply_to_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  /** Stamped by a DB trigger from public.admins — clients can't set it. */
  from_admin: boolean;
  /** Join notices etc. — inserted by triggers, rendered as a centered line. */
  is_system: boolean;
  created_at: string;
};

export type NokorPost = {
  id: string;
  user_id: string;
  body: string;
  image_path: string | null;
  image_paths: string[];
  /** A short video post (migration 0032); mutually exclusive with images. */
  video_path: string | null;
  /** Trigger-maintained counters (migration 0026). */
  like_count: number;
  comment_count: number;
  /** Trigger-maintained unique-viewer count (migration 0034). */
  view_count: number;
  created_at: string;
  edited_at: string | null;
};

export type NokorPostView = {
  post_id: string;
  user_id: string;
  created_at: string;
};

export type NokorLike = {
  post_id: string;
  user_id: string;
  created_at: string;
};

export type NokorComment = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  reply_to_id: string | null;
  /** Trigger-maintained counter (migration 0026). */
  like_count: number;
  created_at: string;
};

export type NokorCommentLike = {
  comment_id: string;
  user_id: string;
  created_at: string;
};

export type NokorFollow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

/** Trigger-maintained per-user aggregates (migration 0026). */
export type NokorUserStats = {
  user_id: string;
  post_count: number;
  follower_count: number;
  following_count: number;
};

export type NokorReportKind =
  | "post"
  | "comment"
  | "dm_message"
  | "room_message"
  | "story"
  | "profile";
export type NokorReportReason =
  | "spam"
  | "harassment"
  | "nudity"
  | "violence"
  | "hate"
  | "scam"
  | "other";

/** A user (or auto) report on a piece of content (migration 0030). */
export type NokorReport = {
  id: string;
  reporter_id: string | null;
  target_kind: NokorReportKind;
  target_id: string;
  target_user_id: string | null;
  reason: NokorReportReason;
  note: string | null;
  snapshot: string | null;
  source: "user" | "auto";
  status: "open" | "resolved" | "dismissed";
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type NokorStoryKind = "image" | "text";

export type NokorStory = {
  id: string;
  user_id: string;
  /** Null for text stories. */
  image_path: string | null;
  /** Image caption, or the body text of a text story. */
  caption: string | null;
  kind: NokorStoryKind;
  /** Background preset key for text stories. */
  background: string | null;
  created_at: string;
  expires_at: string;
};

export type NokorStoryView = {
  story_id: string;
  user_id: string;
  created_at: string;
};

export type NokorStoryHidden = {
  story_id: string;
  user_id: string;
  created_at: string;
};

export type NokorDmThread = {
  id: string;
  user_lo: string;
  user_hi: string;
  created_at: string;
  last_message_at: string;
};

/** A small copy of a story kept on a story-reply DM so the quote still renders
 *  after the original story expires or is deleted. */
export type NokorStorySnapshot = {
  kind: "image" | "text";
  caption: string | null;
  image_path: string | null;
  background: string | null;
  author_id: string;
};

export type NokorDmMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  kind: MessageKind;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  attachment_mime: string | null;
  duration_ms: number | null;
  reply_to_id: string | null;
  story_id: string | null;
  story_snapshot: NokorStorySnapshot | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type NokorDmReaction = {
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export type NokorDmRead = {
  thread_id: string;
  user_id: string;
  last_read_at: string;
};

export type NokorRoomKind = "group" | "channel";
export type NokorRoomRole = "owner" | "admin" | "member";

export type NokorRoom = {
  id: string;
  kind: NokorRoomKind;
  name: string;
  description: string | null;
  photo_path: string | null;
  owner_id: string;
  /** Share-link secret; rotating it invalidates old links. */
  invite_code: string;
  created_at: string;
  last_message_at: string;
};

export type NokorRoomPreview = {
  id: string;
  name: string;
  kind: NokorRoomKind;
  member_count: number;
};

export type NokorRoomMember = {
  room_id: string;
  user_id: string;
  role: NokorRoomRole;
  joined_at: string;
};

export type NokorRoomMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  kind: MessageKind;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  attachment_mime: string | null;
  duration_ms: number | null;
  reply_to_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type NokorRoomReaction = {
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export type NokorRoomRead = {
  room_id: string;
  user_id: string;
  last_read_at: string;
};

export type NokorUserLocation = {
  user_id: string;
  lat: number;
  lng: number;
  updated_at: string;
};

/** Row shape returned by the nokor_nearby_users RPC — never carries coords. */
export type NokorNearbyUser = {
  user_id: string;
  username: string | null;
  avatar_path: string | null;
  bio: string | null;
  current_city: string | null;
  distance_km: number;
  is_new: boolean;
};

export type Conversation = {
  id: string;
  visitor_id: string | null;
  visitor_name: string;
  visitor_email: string;
  access_token: string;
  created_at: string;
  last_message_at: string;
  unread_for_admin: number;
  unread_for_visitor: number;
  /** Language the visitor registered in; picks the auto-reply translation. */
  lang: "en" | "km";
  /** Read receipts: a message is seen once the other side's stamp passes it. */
  visitor_last_read_at: string;
  admin_last_read_at: string;
};

type MessageInsert = Pick<ChatMessage, "conversation_id" | "sender" | "body"> &
  Partial<
    Pick<
      ChatMessage,
      | "id"
      | "kind"
      | "attachment_path"
      | "attachment_name"
      | "attachment_size"
      | "attachment_mime"
      | "duration_ms"
      | "reply_to_id"
      | "suggestion_key"
    >
  >;

/**
 * Hand-written to match supabase/migrations/*.sql. Regenerate with
 * `supabase gen types typescript --linked` if the schema changes.
 */
export type Database = {
  public: {
    Tables: {
      conversations: {
        Row: Conversation;
        Insert: Partial<Conversation>;
        Update: Partial<Conversation>;
        Relationships: [];
      };
      messages: {
        Row: ChatMessage;
        Insert: MessageInsert;
        Update: Partial<ChatMessage>;
        Relationships: [];
      };
      message_reactions: {
        Row: Reaction;
        Insert: Pick<Reaction, "message_id" | "user_id" | "emoji">;
        Update: Partial<Reaction>;
        Relationships: [];
      };
      admins: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string };
        Update: Partial<{ user_id: string }>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Pick<Profile, "user_id"> & Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      community_members: {
        Row: { user_id: string; joined_at: string };
        Insert: { user_id: string };
        Update: Partial<{ user_id: string }>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          sort_order: number;
          key: string;
          title_en: string;
          title_km: string;
          desc_en: string;
          desc_km: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      site_profile: {
        Row: {
          id: number;
          name: string;
          initials: string;
          age: number | null;
          title: string;
          subtitle: string;
          location: string;
          email: string;
          work_email: string;
          phones: string[];
          address: string;
          pitch: string;
          long_pitch: string;
          stats: { label: string; value: string }[];
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          sort_order: number;
          slug: string;
          name: string;
          tagline: string;
          description: string;
          roles: ("Backend" | "Frontend" | "Maintenance")[];
          stack: string[];
          logo: string;
          accent: string;
          highlights: string[];
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      personal_projects: {
        Row: {
          id: string;
          sort_order: number;
          slug: string;
          name: string;
          tagline: string;
          description: string;
          stack: string[];
          logo: string;
          accent: string;
          status: "Research" | "Active" | "Shipped";
          highlights: string[];
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      internal_projects: {
        Row: {
          id: string;
          sort_order: number;
          slug: string;
          period: string;
          name: string;
          tagline: string;
          description: string;
          stack: string[];
          difficulty: "Challenging" | "Hard" | "Foundational";
          accent: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      skill_groups: {
        Row: { id: string; sort_order: number; title: string; items: string[] };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      archive_items: {
        Row: {
          id: string;
          sort_order: number;
          slug: string;
          title: string;
          issuer: string;
          date: string;
          kind: "Transcript" | "Degree" | "Certificate";
          logo: string;
          image: string | null;
          href: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      experiences: {
        Row: {
          id: string;
          sort_order: number;
          role: string;
          company: string;
          period: string;
          location: string;
          logo: string;
          logo_mode: "image" | "wordmark";
          bullets: string[];
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      education_items: {
        Row: {
          id: string;
          sort_order: number;
          title: string;
          org: string;
          period: string;
          detail: string;
          logo: string;
          major: string | null;
          result: string | null;
          courses: string[] | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      blocked_users: {
        Row: { user_id: string; reason: "blocked" | "removed"; created_at: string };
        Insert: { user_id: string; reason?: "blocked" | "removed" };
        Update: Partial<{ user_id: string; reason: "blocked" | "removed" }>;
        Relationships: [];
      };
      community_reads: {
        Row: { user_id: string; last_read_at: string };
        Insert: { user_id: string; last_read_at?: string };
        Update: Partial<{ user_id: string; last_read_at: string }>;
        Relationships: [];
      };
      community_reactions: {
        Row: Reaction;
        Insert: Pick<Reaction, "message_id" | "user_id" | "emoji">;
        Update: Partial<Reaction>;
        Relationships: [];
      };
      community_messages: {
        Row: CommunityMessage;
        Insert: Pick<CommunityMessage, "user_id" | "body"> &
          Partial<
            Pick<
              CommunityMessage,
              | "id"
              | "kind"
              | "attachment_path"
              | "attachment_name"
              | "attachment_size"
              | "attachment_mime"
              | "duration_ms"
              | "reply_to_id"
            >
          >;
        Update: Partial<CommunityMessage>;
        Relationships: [];
      };
      nokor_posts: {
        Row: NokorPost;
        Insert: Pick<NokorPost, "user_id"> &
          Partial<Pick<NokorPost, "id" | "body" | "image_path" | "image_paths" | "video_path">>;
        Update: Partial<NokorPost>;
        Relationships: [];
      };
      nokor_likes: {
        Row: NokorLike;
        Insert: Pick<NokorLike, "post_id" | "user_id">;
        Update: Partial<NokorLike>;
        Relationships: [];
      };
      nokor_post_views: {
        Row: NokorPostView;
        Insert: Pick<NokorPostView, "post_id" | "user_id">;
        Update: never;
        Relationships: [];
      };
      nokor_comments: {
        Row: NokorComment;
        Insert: Pick<NokorComment, "post_id" | "user_id" | "body"> &
          Partial<Pick<NokorComment, "id" | "reply_to_id">>;
        Update: Partial<NokorComment>;
        Relationships: [];
      };
      nokor_comment_likes: {
        Row: NokorCommentLike;
        Insert: Pick<NokorCommentLike, "comment_id" | "user_id">;
        Update: Partial<NokorCommentLike>;
        Relationships: [];
      };
      nokor_follows: {
        Row: NokorFollow;
        Insert: Pick<NokorFollow, "follower_id" | "following_id">;
        Update: Partial<NokorFollow>;
        Relationships: [];
      };
      nokor_user_stats: {
        Row: NokorUserStats;
        // Rows are written only by SECURITY DEFINER triggers, never the client.
        Insert: never;
        Update: never;
        Relationships: [];
      };
      nokor_reports: {
        Row: NokorReport;
        Insert: Pick<
          NokorReport,
          "reporter_id" | "target_kind" | "target_id" | "target_user_id" | "reason"
        > &
          Partial<Pick<NokorReport, "note" | "snapshot" | "source">>;
        Update: Partial<NokorReport>;
        Relationships: [];
      };
      nokor_stories: {
        Row: NokorStory;
        Insert: Pick<NokorStory, "user_id"> &
          Partial<
            Pick<
              NokorStory,
              "id" | "image_path" | "caption" | "kind" | "background" | "expires_at"
            >
          >;
        Update: Partial<NokorStory>;
        Relationships: [];
      };
      nokor_story_views: {
        Row: NokorStoryView;
        Insert: Pick<NokorStoryView, "story_id" | "user_id">;
        Update: Partial<NokorStoryView>;
        Relationships: [];
      };
      nokor_story_hidden: {
        Row: NokorStoryHidden;
        Insert: Pick<NokorStoryHidden, "story_id" | "user_id">;
        Update: Partial<NokorStoryHidden>;
        Relationships: [];
      };
      nokor_dm_threads: {
        Row: NokorDmThread;
        Insert: Partial<NokorDmThread>;
        Update: Partial<NokorDmThread>;
        Relationships: [];
      };
      nokor_dm_messages: {
        Row: NokorDmMessage;
        Insert: Pick<NokorDmMessage, "thread_id" | "sender_id"> &
          Partial<
            Pick<
              NokorDmMessage,
              | "id"
              | "body"
              | "kind"
              | "attachment_path"
              | "attachment_name"
              | "attachment_size"
              | "attachment_mime"
              | "duration_ms"
              | "reply_to_id"
              | "story_id"
              | "story_snapshot"
            >
          >;
        Update: Partial<NokorDmMessage>;
        Relationships: [];
      };
      nokor_dm_reactions: {
        Row: NokorDmReaction;
        Insert: Pick<NokorDmReaction, "message_id" | "user_id" | "emoji">;
        Update: Partial<NokorDmReaction>;
        Relationships: [];
      };
      nokor_dm_reads: {
        Row: NokorDmRead;
        Insert: Pick<NokorDmRead, "thread_id" | "user_id"> & Partial<Pick<NokorDmRead, "last_read_at">>;
        Update: Partial<NokorDmRead>;
        Relationships: [];
      };
      nokor_rooms: {
        Row: NokorRoom;
        Insert: Pick<NokorRoom, "kind" | "name" | "owner_id"> &
          Partial<Pick<NokorRoom, "id" | "description" | "photo_path">>;
        Update: Partial<NokorRoom>;
        Relationships: [];
      };
      nokor_room_members: {
        Row: NokorRoomMember;
        Insert: Pick<NokorRoomMember, "room_id" | "user_id"> & Partial<Pick<NokorRoomMember, "role">>;
        Update: Partial<NokorRoomMember>;
        Relationships: [];
      };
      nokor_room_messages: {
        Row: NokorRoomMessage;
        Insert: Pick<NokorRoomMessage, "room_id" | "sender_id"> &
          Partial<
            Pick<
              NokorRoomMessage,
              | "id"
              | "body"
              | "kind"
              | "attachment_path"
              | "attachment_name"
              | "attachment_size"
              | "attachment_mime"
              | "duration_ms"
              | "reply_to_id"
            >
          >;
        Update: Partial<NokorRoomMessage>;
        Relationships: [];
      };
      nokor_room_reactions: {
        Row: NokorRoomReaction;
        Insert: Pick<NokorRoomReaction, "message_id" | "user_id" | "emoji">;
        Update: Partial<NokorRoomReaction>;
        Relationships: [];
      };
      nokor_room_reads: {
        Row: NokorRoomRead;
        Insert: Pick<NokorRoomRead, "room_id" | "user_id"> & Partial<Pick<NokorRoomRead, "last_read_at">>;
        Update: Partial<NokorRoomRead>;
        Relationships: [];
      };
      nokor_user_locations: {
        Row: NokorUserLocation;
        Insert: Pick<NokorUserLocation, "user_id" | "lat" | "lng">;
        Update: Partial<NokorUserLocation>;
        Relationships: [];
      };
      kh_provinces: {
        Row: KhProvince;
        Insert: KhProvince;
        Update: Partial<KhProvince>;
        Relationships: [];
      };
      kh_districts: {
        Row: KhDistrict;
        Insert: KhDistrict;
        Update: Partial<KhDistrict>;
        Relationships: [];
      };
      kh_communes: {
        Row: KhCommune;
        Insert: KhCommune;
        Update: Partial<KhCommune>;
        Relationships: [];
      };
      kh_villages: {
        Row: KhVillage;
        Insert: KhVillage;
        Update: Partial<KhVillage>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      nokor_email_for_phone: {
        Args: { phone_arg: string };
        Returns: string | null;
      };
      nokor_my_sessions: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          created_at: string;
          updated_at: string;
          user_agent: string | null;
          ip: string | null;
          is_current: boolean;
        }[];
      };
      nokor_my_login_history: {
        Args: Record<string, never>;
        Returns: {
          action: string | null;
          ip: string | null;
          created_at: string;
        }[];
      };
      start_conversation: {
        Args: { p_name: string; p_email: string; p_lang?: string };
        Returns: { out_conversation_id: string; out_access_token: string }[];
      };
      claim_conversation: {
        Args: { p_token: string };
        Returns: string;
      };
      mark_visitor_read: {
        Args: { p_conversation_id: string };
        Returns: void;
      };
      edit_message: {
        Args: { p_message_id: string; p_body: string };
        Returns: void;
      };
      delete_message: {
        Args: { p_message_id: string };
        Returns: string | null;
      };
      edit_community_message: {
        Args: { p_message_id: string; p_body: string };
        Returns: void;
      };
      delete_community_message: {
        Args: { p_message_id: string };
        Returns: string | null;
      };
      is_community_member: {
        Args: Record<never, never>;
        Returns: boolean;
      };
      nokor_open_dm: {
        Args: { p_other: string };
        Returns: string;
      };
      nokor_create_room: {
        Args: {
          p_kind: NokorRoomKind;
          p_name: string;
          p_description?: string | null;
          p_members?: string[];
        };
        Returns: string;
      };
      nokor_nearby_users: {
        Args: { p_radius_km?: number };
        Returns: NokorNearbyUser[];
      };
      nokor_add_room_members: {
        Args: { p_room: string; p_members: string[] };
        Returns: void;
      };
      nokor_set_room_role: {
        Args: { p_room: string; p_user: string; p_role: "admin" | "member" };
        Returns: void;
      };
      nokor_transfer_room_owner: {
        Args: { p_room: string; p_user: string };
        Returns: void;
      };
      nokor_remove_room_member: {
        Args: { p_room: string; p_user: string };
        Returns: void;
      };
      nokor_join_room: {
        Args: { p_code: string };
        Returns: string;
      };
      nokor_room_preview: {
        Args: { p_code: string };
        Returns: NokorRoomPreview[];
      };
      nokor_revoke_room_invite: {
        Args: { p_room: string };
        Returns: string;
      };
      is_blocked: {
        Args: Record<never, never>;
        Returns: boolean;
      };
      admin_block_user: {
        Args: { p_user_id: string };
        Returns: void;
      };
      admin_unblock_user: {
        Args: { p_user_id: string };
        Returns: void;
      };
      admin_remove_user: {
        Args: { p_user_id: string };
        Returns: void;
      };
      is_admin: {
        Args: Record<never, never>;
        Returns: boolean;
      };
      can_see_message: {
        Args: { p_message_id: string };
        Returns: boolean;
      };
      owns_message: {
        Args: { p_message_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

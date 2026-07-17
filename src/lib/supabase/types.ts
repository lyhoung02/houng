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

export type Profile = {
  user_id: string;
  username: string | null;
  phone: string | null;
  avatar_path: string | null;
  bio: string | null;
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
  created_at: string;
  edited_at: string | null;
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

export type NokorDmThread = {
  id: string;
  user_lo: string;
  user_hi: string;
  created_at: string;
  last_message_at: string;
};

export type NokorDmMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
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
          Partial<Pick<NokorPost, "id" | "body" | "image_path" | "image_paths">>;
        Update: Partial<NokorPost>;
        Relationships: [];
      };
      nokor_likes: {
        Row: NokorLike;
        Insert: Pick<NokorLike, "post_id" | "user_id">;
        Update: Partial<NokorLike>;
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
      nokor_dm_threads: {
        Row: NokorDmThread;
        Insert: Partial<NokorDmThread>;
        Update: Partial<NokorDmThread>;
        Relationships: [];
      };
      nokor_dm_messages: {
        Row: NokorDmMessage;
        Insert: Pick<NokorDmMessage, "thread_id" | "sender_id" | "body"> &
          Partial<Pick<NokorDmMessage, "id">>;
        Update: Partial<NokorDmMessage>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
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

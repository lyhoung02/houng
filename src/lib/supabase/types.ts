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

/**
 * Hand-written on purpose. This is NOT generated, and it must not be
 * regenerated: this app has no database tooling and cannot change the schema.
 * It declares only the few columns the inbox reads.
 *
 * If you need a column that isn't here, ask a developer — it is added in the
 * main butler-da repository, not this one.
 */

export type ConversationStatus = 'ai_active' | 'needs_human' | 'staff_handling' | 'resolved';

export type WhatsAppConversation = {
  id: string;
  hotel_id: string;
  room_number: string | null;
  guest_phone: string;
  status: ConversationStatus;
  created_at: string;
  last_message_at: string;
};

export type WhatsAppMessage = {
  id: string;
  conversation_id: string;
  sender_role: string;
  content: string;
  sent_by_user_id: string | null;
  created_at: string;
};

export type Hotel = {
  hotel_id: string;
  name: string | null;
};

export type UserRole = {
  user_id: string;
  role: string;
};

type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      whatsapp_conversations: Table<WhatsAppConversation>;
      whatsapp_messages: Table<WhatsAppMessage>;
      hotels: Table<Hotel>;
      user_roles: Table<UserRole>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { whatsapp_conversation_status: ConversationStatus };
    CompositeTypes: Record<string, never>;
  };
};

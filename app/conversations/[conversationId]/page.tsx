import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getFreeFormWindow } from '@/lib/freeFormWindow';
import { STATUS_CLASSES, STATUS_LABELS } from '@/lib/conversationStatus';
import { ConversationActions } from '@/components/ConversationActions';
import { WhatsAppMessage } from '@/types/database';

const senderLabel = (message: WhatsAppMessage) => {
  if (message.sender_role === 'guest') return 'Guest';
  if (message.sender_role === 'ai') return 'AI';
  return message.sent_by_user_id ? 'Butler Support' : 'Staff';
};

export default async function ConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const supabase = createClient();

  const [{ data: conversation }, { data: messages }] = await Promise.all([
    supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('id', params.conversationId)
      .maybeSingle(),
    supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', params.conversationId)
      .order('created_at', { ascending: true }),
  ]);

  if (!conversation) {
    return (
      <main>
        <Link href="/" className="text-sm underline">
          ← All conversations
        </Link>
        <p className="mt-8 rounded border border-slate-200 bg-white p-6 text-slate-600">
          This conversation is no longer available. Settled conversations are removed automatically
          after a period of inactivity.
        </p>
      </main>
    );
  }

  const { data: hotel } = await supabase
    .from('hotels')
    .select('name')
    .eq('hotel_id', conversation.hotel_id)
    .maybeSingle();

  const freeFormWindow = getFreeFormWindow(messages ?? []);

  return (
    // Bottom padding keeps the last messages clear of the fixed reply bar.
    <main className="pb-40">
      <Link href="/" className="text-sm underline">
        ← All conversations
      </Link>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{conversation.guest_phone}</h1>
          <p className="text-sm text-slate-500">
            {hotel?.name ?? conversation.hotel_id} · Room {conversation.room_number ?? '—'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded px-2 py-1 text-xs ${STATUS_CLASSES[conversation.status]}`}>
            {STATUS_LABELS[conversation.status]}
          </span>
          <ConversationActions
            conversationId={conversation.id}
            isWindowOpen={freeFormWindow.isOpen}
            lastGuestMessageAt={freeFormWindow.lastGuestMessageAt}
          />
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-3">
        {(messages ?? []).map((message) => {
          const isGuest = message.sender_role === 'guest';
          return (
            <div
              key={message.id}
              className={`flex flex-col ${isGuest ? 'items-start' : 'items-end'}`}
            >
              <p className="text-xs font-semibold text-slate-500">{senderLabel(message)}</p>
              <p
                className={`max-w-[80%] whitespace-pre-wrap rounded-lg p-3 ${
                  isGuest ? 'bg-white border border-slate-200' : 'bg-slate-900 text-white'
                }`}
              >
                {message.content}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(message.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </main>
  );
}

import { WhatsAppMessage } from '@/types/database';

const WINDOW_HOURS = 24;

export type FreeFormWindow = { isOpen: boolean; lastGuestMessageAt: string | null };

/**
 * Whether WhatsApp will currently deliver free text to this guest. Based on the
 * guest's own last message — never the conversation's last activity, which
 * staff and AI replies also advance.
 *
 * This is for disabling the composer before anything is typed. butler-da checks
 * again when the reply is sent, since a window can close while a page is open.
 */
export const getFreeFormWindow = (messages: WhatsAppMessage[]): FreeFormWindow => {
  const lastGuestMessage = messages
    .filter((message) => message.sender_role === 'guest')
    .reduce<WhatsAppMessage | null>(
      (latest, message) =>
        !latest || message.created_at > latest.created_at ? message : latest,
      null,
    );

  if (!lastGuestMessage) return { isOpen: false, lastGuestMessageAt: null };

  const expiresAt =
    new Date(lastGuestMessage.created_at).getTime() + WINDOW_HOURS * 60 * 60 * 1000;

  return { isOpen: expiresAt > Date.now(), lastGuestMessageAt: lastGuestMessage.created_at };
};

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ConversationActionsProps = {
  conversationId: string;
  isWindowOpen: boolean;
  lastGuestMessageAt: string | null;
};

const readError = (payload: unknown): string | undefined =>
  typeof payload === 'object' &&
  payload !== null &&
  'error' in payload &&
  typeof payload.error === 'string'
    ? payload.error
    : undefined;

const post = async (path: string, body: unknown) => {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json().catch(() => ({}));
  return { ok: response.ok, error: readError(payload) };
};

export const ConversationActions = ({
  conversationId,
  isWindowOpen,
  lastGuestMessageAt,
}: ConversationActionsProps) => {
  const router = useRouter();
  const [reply, setReply] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<{ ok: boolean; error?: string }>) => {
    setIsBusy(true);
    setError(null);
    const { ok, error: actionError } = await action();
    setIsBusy(false);
    if (!ok) {
      setError(actionError ?? 'Something went wrong.');
      return false;
    }
    router.refresh();
    return true;
  };

  const handleSend = async () => {
    if (!reply.trim()) return;
    const sent = await run(() =>
      post(`/api/conversations/${conversationId}/reply`, { body: reply }),
    );
    if (sent) setReply('');
  };

  const handleStatus = (status: 'resolved' | 'ai_active') =>
    run(() => post(`/api/conversations/${conversationId}/status`, { status }));

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleStatus('ai_active')}
          disabled={isBusy}
          className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
        >
          Hand back to AI
        </button>
        <button
          type="button"
          onClick={() => handleStatus('resolved')}
          disabled={isBusy}
          className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
        >
          Mark resolved
        </button>
      </div>

      {isWindowOpen ? (
        <div className="flex gap-2">
          <input
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a reply…"
            aria-label="Reply"
            className="flex-1 rounded border border-slate-300 px-3 py-2"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isBusy}
            className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          >
            Send
          </button>
        </div>
      ) : (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {lastGuestMessageAt
            ? `This guest last wrote on ${new Date(lastGuestMessageAt).toLocaleString()}. WhatsApp only allows a reply within 24 hours of a guest's own message, so you can't message them until they write again.`
            : "This guest hasn't written yet, so they can't be messaged."}
        </p>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
};

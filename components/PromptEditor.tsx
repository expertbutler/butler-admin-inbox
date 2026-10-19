'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isRecord, JsonResponse, readString } from '@/lib/payload';

// Mirrors butler-da's limit so the admin finds out while typing, not on save.
const MAX_PROMPT_LENGTH = 20000;

const UNEXPECTED_RESPONSE = 'butler-da sent back an unexpected response.';

type Conflict = { existingText: string; reason: string };

type PromptAction = 'save' | 'rewrite' | 'add';

const isConflict = (value: unknown): value is Conflict =>
  readString({ payload: value, key: 'existingText' }) !== undefined &&
  readString({ payload: value, key: 'reason' }) !== undefined;

const readConflicts = (payload: unknown): Conflict[] => {
  const conflicts = isRecord(payload) ? payload.conflicts : undefined;
  return Array.isArray(conflicts) ? conflicts.filter(isConflict) : [];
};

const sendJson = async ({
  path,
  method,
  body,
}: {
  path: string;
  method: 'POST' | 'PUT';
  body: unknown;
}): Promise<JsonResponse> => {
  const response = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json().catch(() => ({}));
  return { status: response.status, payload };
};

export const PromptEditor = ({ initialPrompt }: { initialPrompt: string }) => {
  const router = useRouter();
  // The prompt as last loaded or saved. butler-da only accepts a change made on top of the
  // version it currently holds, so this is sent with every write.
  const [savedPrompt, setSavedPrompt] = useState(initialPrompt);
  const [draft, setDraft] = useState(initialPrompt);
  const [rule, setRule] = useState('');
  // The admin's own wording, kept while they re-run To Prompt on the AI's version of it.
  const [originalRule, setOriginalRule] = useState<string | null>(null);
  const [lastRewrittenRule, setLastRewrittenRule] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [busyAction, setBusyAction] = useState<PromptAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  const isDirty = draft !== savedPrompt;
  const isBusy = busyAction !== null;
  // Save and Add Rule replace the prompt with butler-da's response, and To Prompt and Add Rule
  // replace the rule, so anything typed into them meanwhile would be lost.
  const isPromptLocked = busyAction === 'save' || busyAction === 'add';
  const isRuleLocked = busyAction === 'rewrite' || busyAction === 'add';

  const runAction = async ({
    action,
    request,
  }: {
    action: PromptAction;
    request: () => Promise<JsonResponse>;
  }) => {
    setBusyAction(action);
    setError(null);
    const response = await request().catch(() => null);
    setBusyAction(null);

    if (!response) {
      setError('Could not reach the server.');
      return null;
    }
    if (response.status === 409) {
      setIsStale(true);
      return null;
    }
    if (response.status !== 200) {
      setError(readString({ payload: response.payload, key: 'error' }) ?? 'Something went wrong.');
      return null;
    }
    return response.payload;
  };

  const acceptSavedPrompt = (payload: unknown) => {
    const personaPrompt = readString({ payload, key: 'personaPrompt' });
    if (personaPrompt === undefined) {
      setError(UNEXPECTED_RESPONSE);
      return false;
    }
    setSavedPrompt(personaPrompt);
    setDraft(personaPrompt);
    // Otherwise the router cache can remount this page with the old prompt on the way back,
    // and the next save would be rejected as stale.
    router.refresh();
    return true;
  };

  const resetRule = () => {
    setRule('');
    setOriginalRule(null);
    setLastRewrittenRule(null);
    setConflicts([]);
  };

  const handleRuleChange = (nextRule: string) => {
    setRule(nextRule);
    // Conflicts describe the rewrite as returned; the original stays so it can still be copied.
    if (nextRule !== lastRewrittenRule) setConflicts([]);
  };

  const handleSave = async () => {
    const payload = await runAction({
      action: 'save',
      request: () =>
        sendJson({
          path: '/api/prompt',
          method: 'PUT',
          body: { personaPrompt: draft, expectedPersonaPrompt: savedPrompt },
        }),
    });
    if (payload !== null) acceptSavedPrompt(payload);
  };

  const handleRewrite = async () => {
    // Conflicts belong to the previous rewrite; a failed attempt shouldn't leave them showing.
    setConflicts([]);
    const payload = await runAction({
      action: 'rewrite',
      request: () =>
        sendJson({
          path: '/api/prompt/rule-rewrite',
          method: 'POST',
          body: { rule, personaPrompt: draft },
        }),
    });
    if (payload === null) return;
    const rewrittenRule = readString({ payload, key: 'rewrittenRule' });
    if (rewrittenRule === undefined) {
      setError(UNEXPECTED_RESPONSE);
      return;
    }
    const isRewritingARewrite = originalRule !== null && rule === lastRewrittenRule;
    setOriginalRule(isRewritingARewrite ? originalRule : rule);
    setLastRewrittenRule(rewrittenRule);
    setRule(rewrittenRule);
    setConflicts(readConflicts(payload));
  };

  const handleAddRule = async () => {
    const payload = await runAction({
      action: 'add',
      request: () =>
        sendJson({
          path: '/api/prompt/rules',
          method: 'POST',
          body: { rule, expectedPersonaPrompt: savedPrompt },
        }),
    });
    if (payload === null || !acceptSavedPrompt(payload)) return;
    resetRule();
  };

  const hasRule = rule.trim() !== '';
  // butler-da appends the trimmed rule after a newline, and rejects the result past the limit.
  const promptLengthWithRule = savedPrompt.length + 1 + rule.trim().length;
  const isRuleTooLong = promptLengthWithRule > MAX_PROMPT_LENGTH;

  return (
    <div className="mt-6 flex flex-col gap-8">
      {isStale ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>
            The prompt was changed elsewhere. Reload to get the latest version — unsaved edits
            here will be lost.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded border border-amber-300 bg-white px-3 py-1"
          >
            Reload
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="flex flex-col gap-2">
        <label htmlFor="persona-prompt" className="text-sm font-semibold">
          Persona prompt
        </label>
        <textarea
          id="persona-prompt"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          readOnly={isPromptLocked}
          maxLength={MAX_PROMPT_LENGTH}
          rows={20}
          className="rounded border border-slate-300 p-3 font-mono text-sm"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isBusy || isStale}
            className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {busyAction === 'save' ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setDraft(savedPrompt)}
            disabled={!isDirty || isBusy}
            className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
          >
            Discard changes
          </button>
          <span className="ml-auto text-xs text-slate-400">
            {draft.length} / {MAX_PROMPT_LENGTH}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor="new-rule" className="text-sm font-semibold">
          New rule
        </label>
        <textarea
          id="new-rule"
          value={rule}
          onChange={(event) => handleRuleChange(event.target.value)}
          readOnly={isRuleLocked}
          rows={3}
          placeholder="e.g. Never promise a late checkout; say reception will confirm it."
          className="rounded border border-slate-300 p-3 text-sm"
        />

        {originalRule !== null ? (
          <div className="flex items-start gap-2 text-sm text-slate-500">
            <p className="flex-1 whitespace-pre-wrap">Original: {originalRule}</p>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(originalRule)}
              className="rounded border border-slate-300 px-2 py-1 text-xs"
            >
              Copy
            </button>
          </div>
        ) : null}

        {conflicts.length > 0 ? (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">This rule may conflict with the existing prompt:</p>
            <ul className="mt-2 flex flex-col gap-2">
              {conflicts.map((conflict, index) => (
                <li key={index}>
                  <q className="italic">{conflict.existingText}</q> — {conflict.reason}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRewrite}
            disabled={!hasRule || isBusy}
            className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
          >
            {busyAction === 'rewrite' ? 'Rewording…' : 'To Prompt'}
          </button>
          <button
            type="button"
            onClick={handleAddRule}
            disabled={!hasRule || isRuleTooLong || isDirty || isBusy || isStale}
            className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {busyAction === 'add' ? 'Adding…' : 'Add Rule'}
          </button>
          {isDirty ? (
            <span className="text-xs text-slate-500">
              Save or discard your prompt edits before adding a rule.
            </span>
          ) : null}
          {hasRule && isRuleTooLong ? (
            <span className="ml-auto text-xs text-red-600">
              Adding this rule would make the prompt {promptLengthWithRule} / {MAX_PROMPT_LENGTH}{' '}
              characters.
            </span>
          ) : null}
        </div>
      </section>
    </div>
  );
};

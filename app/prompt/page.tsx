import { callButlerDa } from '@/lib/butlerDa';
import { readString } from '@/lib/payload';
import { PromptEditor } from '@/components/PromptEditor';

export default async function PromptPage() {
  const { payload } = await callButlerDa({ path: '/api/admin/whatsapp/prompt', method: 'GET' });
  const personaPrompt = readString({ payload, key: 'personaPrompt' });

  return (
    <main>
      <h1 className="text-2xl font-bold">AI Prompt</h1>
      <p className="mt-1 text-sm text-slate-500">
        The persona prompt the WhatsApp concierge uses for every hotel. Changes apply to live
        conversations as soon as they are saved.
      </p>

      {personaPrompt === undefined ? (
        <p className="mt-8 rounded border border-red-200 bg-red-50 p-6 text-red-700">
          {readString({ payload, key: 'error' }) ?? "The prompt couldn't be loaded."}
        </p>
      ) : (
        <PromptEditor initialPrompt={personaPrompt} />
      )}
    </main>
  );
}

import { NextResponse } from 'next/server';
import { callButlerDa } from '@/lib/butlerDa';

// butler-da waits on OpenAI here. It gives OpenAI ~30s and answers with a JSON 504 after that,
// well inside this limit; 60s matches butler-da's own ceiling for the rare slower case.
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const { status, payload } = await callButlerDa({
    path: '/api/admin/whatsapp/prompt/rule-rewrite',
    body,
  });

  return NextResponse.json(payload, { status });
}

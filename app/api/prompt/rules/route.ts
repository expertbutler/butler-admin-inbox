import { NextResponse } from 'next/server';
import { callButlerDa } from '@/lib/butlerDa';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const { status, payload } = await callButlerDa({
    path: '/api/admin/whatsapp/prompt/rules',
    body,
  });

  return NextResponse.json(payload, { status });
}

import { NextResponse } from 'next/server';
import { callButlerDa } from '@/lib/butlerDa';

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));

  const { status, payload } = await callButlerDa({
    path: '/api/admin/whatsapp/prompt',
    method: 'PUT',
    body,
  });

  return NextResponse.json(payload, { status });
}

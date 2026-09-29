import { NextResponse } from 'next/server';
import { callButlerDa } from '@/lib/butlerDa';

export async function POST(
  request: Request,
  { params }: { params: { conversationId: string } },
) {
  const body = await request.json().catch(() => ({}));

  const { status, payload } = await callButlerDa({
    path: `/api/admin/whatsapp/conversations/${params.conversationId}/status`,
    body,
  });

  return NextResponse.json(payload, { status });
}

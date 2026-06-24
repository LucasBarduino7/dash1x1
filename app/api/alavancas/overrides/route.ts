// API dos overrides de Realizado das Alavancas (persistência compartilhada via Blob).
// Protegida pela sessão Auth.js (mesma allowlist do dashboard).

import { auth } from '@/auth';
import { readOverrides, writeOverrides } from '@/lib/alavancas-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const overrides = await readOverrides();
  return Response.json({ overrides });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const input = (body as { overrides?: unknown })?.overrides;
  if (!input || typeof input !== 'object') {
    return new Response('Missing overrides', { status: 400 });
  }

  const overrides = await writeOverrides(input as Record<string, number>);
  return Response.json({ overrides });
}

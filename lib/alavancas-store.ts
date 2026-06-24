// Persistência compartilhada dos overrides de Realizado das Alavancas.
// Guarda um único JSON no Vercel Blob (privado) — vale pra todos os usuários.

import { get, put } from '@vercel/blob';

const PATHNAME = 'alavancas-overrides.json';

export type Overrides = Record<string, number>;

function sanitize(data: unknown): Overrides {
  if (!data || typeof data !== 'object') return {};
  const out: Overrides = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    const n = Number(v);
    if (k && Number.isFinite(n)) out[k] = n;
  }
  return out;
}

export async function readOverrides(): Promise<Overrides> {
  try {
    const res = await get(PATHNAME, { access: 'private', useCache: false });
    if (!res?.stream) return {};
    const text = await new Response(res.stream).text();
    return sanitize(JSON.parse(text));
  } catch {
    // Blob ainda não existe (primeira vez) ou JSON inválido → sem overrides.
    return {};
  }
}

export async function writeOverrides(data: Overrides): Promise<Overrides> {
  const clean = sanitize(data);
  await put(PATHNAME, JSON.stringify(clean), {
    access: 'private',
    contentType: 'application/json',
    allowOverwrite: true,
    addRandomSuffix: false,
  });
  return clean;
}

import { NextResponse } from 'next/server';

// Recebe a pesquisa de satisfação e encaminha pra um webhook (ex: n8n → planilha).
// Configure PESQUISA_WEBHOOK_URL no .env / Vercel. Sem ele, só registra no log.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = { ...body, recebidoEm: new Date().toISOString() };
    const webhook = process.env.PESQUISA_WEBHOOK_URL;

    if (webhook) {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } else {
      console.log('[pesquisa] sem PESQUISA_WEBHOOK_URL — resposta:', JSON.stringify(payload));
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}

// Proxy (antes "middleware" no Next ≤ 15).
// Basic Auth multi-user — protege todo o dashboard.
// Usuários definidos em BASIC_AUTH_USERS no formato: user1:senha1,user2:senha2

import { NextResponse, type NextRequest } from 'next/server';

function parseUsers(env: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!env) return map;
  for (const pair of env.split(',')) {
    const [u, p] = pair.split(':');
    if (u && p) map.set(u.trim(), p.trim());
  }
  return map;
}

/** Constant-time string comparison (evita timing attacks). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function proxy(request: NextRequest) {
  // Liberar healthcheck e assets (matcher já filtra os estáticos do _next)
  const { pathname } = request.nextUrl;
  if (pathname === '/api/health') return NextResponse.next();

  const users = parseUsers(process.env.BASIC_AUTH_USERS);

  // Sem credenciais configuradas? Bloqueia totalmente — fail-closed.
  if (users.size === 0) {
    return new NextResponse(
      'BASIC_AUTH_USERS não está configurado no ambiente. Defina como "user1:senha1,user2:senha2".',
      { status: 503 },
    );
  }

  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Basic ')) {
    return new NextResponse('Acesso restrito ao Dash 1x1 — Grupo Scale.', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Dash 1x1"' },
    });
  }

  let decoded: string;
  try {
    decoded = atob(auth.slice(6));
  } catch {
    return new NextResponse('Cabeçalho de autenticação inválido.', {
      status: 400,
    });
  }

  const sep = decoded.indexOf(':');
  if (sep === -1) {
    return new NextResponse('Cabeçalho de autenticação malformado.', {
      status: 400,
    });
  }
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  const expected = users.get(user);
  if (!expected || !safeEqual(pass, expected)) {
    return new NextResponse('Credenciais inválidas.', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Dash 1x1"' },
    });
  }

  // OK — registra quem entrou
  const res = NextResponse.next();
  res.headers.set('x-auth-user', user);
  return res;
}

export const config = {
  // Aplica em tudo, exceto assets estáticos do Next
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

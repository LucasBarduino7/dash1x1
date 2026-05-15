// Proxy (Next.js 16): protege rotas exigindo sessão Auth.js.
// Quem não está logado é redirecionado pro /login.

import { auth } from '@/auth';

export default auth((req) => {
  // Liberar rotas públicas: callback do OAuth, login, healthcheck
  const { pathname } = req.nextUrl;
  const PUBLIC_PATHS = ['/login', '/api/auth', '/api/health'];
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return;

  // Sem sessão → redireciona pro login
  if (!req.auth) {
    const url = new URL('/login', req.nextUrl.origin);
    if (pathname !== '/') url.searchParams.set('callbackUrl', pathname);
    return Response.redirect(url, 307);
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

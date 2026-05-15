// Auth.js v5 — Google OAuth com allowlist de emails autorizados.
// Apenas e-mails listados em AUTHORIZED_EMAILS conseguem entrar.

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

function getAllowedEmails(): Set<string> {
  const raw = process.env.AUTHORIZED_EMAILS ?? '';
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user }) {
      const allowed = getAllowedEmails();
      const email = (user.email ?? '').toLowerCase();
      if (allowed.size === 0) {
        // Sem AUTHORIZED_EMAILS = fail-closed (ninguém entra).
        return false;
      }
      return allowed.has(email);
    },
    async authorized({ auth: session }) {
      // Usado pelo proxy: true = passa, false = redireciona pro signIn
      return !!session;
    },
    async session({ session, token }) {
      // Adiciona o email no client (útil pro header)
      if (token?.email && session.user) {
        session.user.email = token.email;
      }
      return session;
    },
  },
});

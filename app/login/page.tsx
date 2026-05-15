import { redirect } from 'next/navigation';
import { auth, signIn } from '@/auth';

type SearchParams = Promise<{ callbackUrl?: string; error?: string }>;

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    'Este e-mail Google não está autorizado a acessar o dashboard. Fale com o administrador.',
  Configuration:
    'Erro de configuração na autenticação. Verifique se as variáveis de ambiente estão corretas.',
  Verification: 'Não conseguimos verificar sua identidade. Tente novamente.',
  Default: 'Não foi possível fazer login. Tente novamente.',
};

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;

  // Se já está logado, manda direto pro dashboard (ou pra rota desejada)
  if (session?.user) {
    redirect(callbackUrl ?? '/');
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 backdrop-blur">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
              Grupo Scale · Marcos Machado
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">
              Dashboard 1x1
            </h1>
            <p className="mt-3 text-sm text-zinc-400">
              Acesso restrito. Entre com sua conta Google autorizada.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
              {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default}
            </div>
          )}

          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: callbackUrl ?? '/' });
            }}
            className="mt-8"
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700/70 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Entrar com Google
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-zinc-500">
            Apenas e-mails autorizados pelo administrador conseguem acessar.
          </p>
        </div>
      </div>
    </main>
  );
}

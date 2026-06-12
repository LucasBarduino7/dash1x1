import { LogOut } from 'lucide-react';
import { auth, signOut } from '@/auth';

export async function UserBadge() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;

  return (
    <form
      action={async () => {
        'use server';
        await signOut({ redirectTo: '/login' });
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        title={`Sair (${email})`}
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{email}</span>
      </button>
    </form>
  );
}

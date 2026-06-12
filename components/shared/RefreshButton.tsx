'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { cn } from '@/lib/shared/cn';

export function RefreshButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      onClick={() => start(() => router.refresh())}
      disabled={pending}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-tiffany-500/40 bg-tiffany-500/10 px-3 py-1.5 text-xs font-medium text-tiffany-700 transition-colors hover:bg-tiffany-500/20 disabled:opacity-60',
      )}
    >
      <RefreshCw className={cn('h-3.5 w-3.5', pending && 'animate-spin')} />
      {pending ? 'Atualizando…' : 'Atualizar'}
    </button>
  );
}

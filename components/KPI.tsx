import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

type Tone = 'brand' | 'good' | 'warn' | 'bad' | 'neutral' | 'blue';

const TONE_BG: Record<Tone, string> = {
  brand: 'from-violet-500/30 to-violet-500/5 border-violet-500/30',
  good: 'from-emerald-500/30 to-emerald-500/5 border-emerald-500/30',
  warn: 'from-amber-500/30 to-amber-500/5 border-amber-500/30',
  bad: 'from-rose-500/30 to-rose-500/5 border-rose-500/30',
  blue: 'from-sky-500/30 to-sky-500/5 border-sky-500/30',
  neutral: 'from-zinc-500/20 to-zinc-500/5 border-zinc-700/50',
};

const TONE_ICON: Record<Tone, string> = {
  brand: 'text-violet-300 bg-violet-500/10',
  good: 'text-emerald-300 bg-emerald-500/10',
  warn: 'text-amber-300 bg-amber-500/10',
  bad: 'text-rose-300 bg-rose-500/10',
  blue: 'text-sky-300 bg-sky-500/10',
  neutral: 'text-zinc-300 bg-zinc-500/10',
};

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
};

export function KPI({ label, value, hint, icon: Icon, tone = 'neutral', size = 'md' }: Props) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-sm',
        TONE_BG[tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
          <p
            className={cn(
              'mt-2 font-semibold tracking-tight tabular-nums text-zinc-50',
              size === 'lg' && 'text-3xl',
              size === 'md' && 'text-2xl',
              size === 'sm' && 'text-xl',
            )}
          >
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn('rounded-xl p-2', TONE_ICON[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

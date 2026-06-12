import { cn } from '@/lib/shared/cn';
import type { LucideIcon } from 'lucide-react';

type Tone = 'brand' | 'good' | 'warn' | 'bad' | 'neutral' | 'blue';

// Tema claro (estilo Claude): card branco, leve tinta da cor + borda colorida.
const TONE_BG: Record<Tone, string> = {
  brand: 'from-[#0abab5]/10 to-white border-[#d2f4f2]',
  good: 'from-emerald-500/10 to-white border-emerald-200',
  warn: 'from-amber-500/10 to-white border-amber-200',
  bad: 'from-rose-500/10 to-white border-rose-200',
  blue: 'from-sky-500/10 to-white border-sky-200',
  neutral: 'from-stone-200/40 to-white border-[#e3eceb]',
};

const TONE_ICON: Record<Tone, string> = {
  brand: 'text-[#099a96] bg-[#0abab5]/15',
  good: 'text-emerald-700 bg-emerald-500/12',
  warn: 'text-amber-700 bg-amber-500/15',
  bad: 'text-rose-700 bg-rose-500/12',
  blue: 'text-sky-700 bg-sky-500/12',
  neutral: 'text-stone-600 bg-stone-500/10',
};

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  /** Selo de classificação (Excelente/Ótimo/…) conforme média de mercado */
  ratingLabel?: string;
};

export function KPI({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
  size = 'md',
  ratingLabel,
}: Props) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm',
        TONE_BG[tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-[#5b6b69]">{label}</p>
          <p
            className={cn(
              'mt-2 font-semibold tracking-tight tabular-nums text-[#0f1716]',
              size === 'lg' && 'text-3xl',
              size === 'md' && 'text-2xl',
              size === 'sm' && 'text-xl',
            )}
          >
            {value}
          </p>
          {ratingLabel && (
            <span
              className={cn(
                'mt-2 inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold',
                TONE_ICON[tone],
              )}
            >
              {ratingLabel}
            </span>
          )}
          {hint && <p className="mt-1.5 text-xs text-[#5b6b69]">{hint}</p>}
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

import { cn } from '@/lib/shared/cn';

export function Card({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-zinc-200 bg-white p-5 backdrop-blur',
        className,
      )}
    >
      {(title || right) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            {title && (
              <span className="mt-1 h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-tiffany-400 to-tiffany-600" />
            )}
            <div>
              {title && <h2 className="text-base font-semibold text-zinc-900">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
            </div>
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

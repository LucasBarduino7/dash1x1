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
        'rounded-2xl border border-[#e3eceb] bg-white p-5 shadow-sm',
        className,
      )}
    >
      {(title || right) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold text-[#0f1716]">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-[#5b6b69]">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

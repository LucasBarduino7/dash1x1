type Item = { label: string; value: number; hint?: string };

export function BarList({
  items,
  emptyText = 'Sem dados no período.',
}: {
  items: Item[];
  emptyText?: string;
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-[#8a9492]">{emptyText}</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-[#0f1716]">{it.label}</span>
            <span className="tabular-nums text-[#5b6b69]">
              {it.value}
              {it.hint ? ` · ${it.hint}` : ''}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#f1f6f5]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0abab5] to-[#81d8d0]"
              style={{ width: `${(it.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

// Tabela de Alavancas com Realizado editável. Edição é COMPARTILHADA (salva no
// servidor via /api/alavancas/overrides → Vercel Blob) e recalcula falta / % /
// R$ por dia ao vivo pra todo mundo.

import { useMemo, useRef, useState } from 'react';
import { RotateCcw, Check, Loader2, AlertTriangle } from 'lucide-react';
import { brl } from '@/lib/shared/format';

const pctFmt = (v: number) => `${Math.round(v * 100)}%`;
const roasFmt = (v: number) => `${v.toFixed(2).replace('.', ',')}×`;

export type AlavancaItem = {
  nome: string;
  projetado: number;
  midia: number;
  realizado: number;
  auto: boolean;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type Props = {
  alavancas: AlavancaItem[];
  diasRestantes: number;
  meta: number;
  initialOverrides: Record<string, number>;
};

export function AlavancasBoard({ alavancas, diasRestantes, meta, initialOverrides }: Props) {
  // overrides[nome] = realizado manual; ausência = usa o valor ao vivo do servidor.
  const [overrides, setOverrides] = useState<Record<string, number>>(initialOverrides);
  const [save, setSave] = useState<SaveState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Salva no servidor com debounce (só persiste o resultado final da digitação).
  const persist = (next: Record<string, number>) => {
    if (timer.current) clearTimeout(timer.current);
    setSave('saving');
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/alavancas/overrides', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ overrides: next }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setSave('saved');
        setTimeout(() => setSave((s) => (s === 'saved' ? 'idle' : s)), 2000);
      } catch {
        setSave('error');
      }
    }, 600);
  };

  const apply = (next: Record<string, number>) => {
    setOverrides(next);
    persist(next);
  };

  const setRealizado = (nome: string, valor: number) => apply({ ...overrides, [nome]: valor });
  const limparOverrides = () => apply({});

  const has = (nome: string) => Object.prototype.hasOwnProperty.call(overrides, nome);

  // Recalcula linhas + totais sempre que algum realizado muda.
  const { linhas, tot } = useMemo(() => {
    const linhas = alavancas.map((a) => {
      const realizado = has(a.nome) ? overrides[a.nome] : a.realizado;
      const falta = Math.max(0, a.projetado - realizado);
      const pct = a.projetado > 0 ? Math.min(1, realizado / a.projetado) : 0;
      return {
        ...a,
        realizado,
        falta,
        pct,
        batido: a.projetado > 0 && realizado >= a.projetado,
        porDia: falta / diasRestantes,
        roasAtual: a.midia > 0 ? realizado / a.midia : null,
        editado: has(a.nome),
      };
    });

    const realizado = linhas.reduce((s, a) => s + a.realizado, 0);
    const midia = linhas.reduce((s, a) => s + a.midia, 0);
    const falta = Math.max(0, meta - realizado);
    const tot = {
      projetado: meta,
      midia,
      realizado,
      falta,
      porDia: falta / diasRestantes,
      pct: meta > 0 ? Math.min(1, realizado / meta) : 0,
      roas: midia > 0 ? realizado / midia : null,
    };
    return { linhas, tot };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alavancas, overrides, diasRestantes, meta]);

  const temOverrides = Object.keys(overrides).length > 0;

  return (
    <>
      {/* Resumo enxuto */}
      <div className="mb-6 flex flex-wrap items-center gap-x-10 gap-y-3 rounded-2xl border border-zinc-200 bg-gradient-to-br from-tiffany-500/10 to-transparent p-5">
        <Stat label="Meta do mês" value={brl(tot.projetado)} />
        <Stat label="Realizado" value={brl(tot.realizado)} sub={pctFmt(tot.pct)} />
        <Stat label="Falta" value={brl(tot.falta)} />
        <Stat label="Por dia" value={brl(tot.porDia)} sub={`${diasRestantes} dias`} accent />
        <Stat label="ROAS atual" value={tot.roas != null ? roasFmt(tot.roas) : '—'} />
      </div>

      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-xs text-zinc-500">Clique no Realizado pra editar — o total e o R$/dia recalculam na hora.</p>
          <SaveBadge state={save} />
        </div>
        {temOverrides && (
          <button
            onClick={limparOverrides}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            <RotateCcw className="h-3 w-3" />
            Voltar ao ao vivo
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-medium">Alavanca</th>
              <th className="px-4 py-3 text-right font-medium">Projetado</th>
              <th className="px-4 py-3 text-right font-medium">Mídia</th>
              <th className="px-4 py-3 text-right font-medium">ROAS</th>
              <th className="px-4 py-3 text-right font-medium">Realizado</th>
              <th className="px-4 py-3 text-right font-medium">Forecasting</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((a) => (
              <tr key={a.nome} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900">{a.nome}</span>
                    {a.auto && !a.editado && (
                      <span className="rounded bg-tiffany-500/10 px-1.5 py-0.5 text-[10px] font-medium text-tiffany-700">
                        ao vivo
                      </span>
                    )}
                    {a.editado && (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        editado
                      </span>
                    )}
                  </div>
                  {a.projetado > 0 && (
                    <div className="mt-1.5 h-1.5 w-40 max-w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full ${a.batido ? 'bg-emerald-500' : 'bg-tiffany-500'}`}
                        style={{ width: `${Math.max(2, a.pct * 100)}%` }}
                      />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-700">
                  {a.projetado > 0 ? brl(a.projetado) : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-700">
                  {a.midia > 0 ? brl(a.midia) : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-500">
                  {a.roasAtual != null ? roasFmt(a.roasAtual) : '—'}
                </td>
                <td className="px-4 py-2 text-right">
                  <RealizadoInput value={a.realizado} onChange={(v) => setRealizado(a.nome, v)} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {a.projetado === 0 ? (
                    <span className="text-zinc-300">—</span>
                  ) : a.batido ? (
                    <span className="font-medium text-emerald-600">✓ batido</span>
                  ) : (
                    <span className="font-medium text-tiffany-700">{brl(a.porDia)}/dia</span>
                  )}
                </td>
              </tr>
            ))}
            <tr className="bg-tiffany-500/[0.07]">
              <td className="px-4 py-3 font-semibold text-zinc-900">Scale · total</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-zinc-900">{brl(tot.projetado)}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-zinc-900">{brl(tot.midia)}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-zinc-500">
                {tot.roas != null ? roasFmt(tot.roas) : '—'}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-zinc-900">{brl(tot.realizado)}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-tiffany-700">
                {tot.porDia > 0 ? `${brl(tot.porDia)}/dia` : '✓ batido'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Forecasting = (Meta − Realizado) ÷ {diasRestantes} dias restantes — quanto precisa entrar por
        dia pra bater os {brl(meta)}. Realizado de 1x1, Social Selling e Workshop vem ao vivo dos
        dashboards (até você editar). Edições são salvas no servidor e valem pra todos.
      </p>
    </>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === 'idle') return null;
  if (state === 'saving')
    return (
      <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
        <Loader2 className="h-3 w-3 animate-spin" /> salvando…
      </span>
    );
  if (state === 'saved')
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <Check className="h-3 w-3" /> salvo
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-600">
      <AlertTriangle className="h-3 w-3" /> erro ao salvar
    </span>
  );
}

function RealizadoInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState<string | null>(null);
  const display = text ?? brl(value);

  return (
    <input
      inputMode="numeric"
      value={display}
      onFocus={() => setText(String(Math.round(value)))}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const n = Number(raw.replace(/[^\d-]/g, ''));
        if (!isNaN(n)) onChange(n);
      }}
      onBlur={() => setText(null)}
      className="w-32 rounded-lg border border-transparent bg-transparent px-2 py-1 text-right font-medium tabular-nums text-zinc-900 transition-colors hover:border-zinc-200 hover:bg-zinc-50 focus:border-tiffany-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-tiffany-400/30"
    />
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-2xl font-semibold tabular-nums ${accent ? 'text-tiffany-700' : 'text-zinc-900'}`}>
        {value}
        {sub && <span className="ml-1.5 text-xs font-medium text-zinc-400">{sub}</span>}
      </p>
    </div>
  );
}

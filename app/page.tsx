import { TrendingUp } from 'lucide-react';
import { PageBanner } from '@/components/shared/PageBanner';
import { AlavancasBoard } from '@/components/alavancas/AlavancasBoard';
import { getAlavancas } from '@/lib/alavancas';
import { readOverrides } from '@/lib/alavancas-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProjecoesPage() {
  const [d, overrides] = await Promise.all([getAlavancas(), readOverrides()]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:py-10">
      <PageBanner src="/banner-projecoes.png" alt="Alavancas · Grupo Scale" />

      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-tiffany-500/10 text-tiffany-600">
          <TrendingUp className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Alavancas</h1>
          <p className="text-sm text-zinc-500">Metas e projeções do Scale · {d.mesLabel}</p>
        </div>
      </div>

      <AlavancasBoard
        alavancas={d.alavancas.map((a) => ({
          nome: a.nome,
          projetado: a.projetado,
          midia: a.midia,
          realizado: a.realizado,
          auto: a.auto,
        }))}
        diasRestantes={d.diasRestantes}
        meta={d.totAlav.projetado}
        initialOverrides={overrides}
      />
    </main>
  );
}

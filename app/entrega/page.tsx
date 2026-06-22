'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Download, Sparkles, Star } from 'lucide-react';
import { ENTREGAVEIS, SKILLS, type Entregavel, type SkillItem } from '@/data/entrega';

const ORANGE = '#F47A20';
const NAVY = '#1B2138';

type Tab = 'entregaveis' | 'skills' | 'pesquisa';

const TABS: { key: Tab; label: string; icon: typeof Download }[] = [
  { key: 'entregaveis', label: 'Entregáveis', icon: Download },
  { key: 'skills', label: 'Skills', icon: Sparkles },
  { key: 'pesquisa', label: 'Pesquisa', icon: Star },
];

export default function EntregaPage() {
  const [tab, setTab] = useState<Tab>('entregaveis');

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FBE3D4] via-[#FDF2EC] to-white">
      {/* Camadas decorativas (referência do banner) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-44 -top-40 h-[520px] w-[520px] rounded-full bg-[#EC7A4E]/30 blur-3xl" />
        <div className="absolute -right-40 top-24 h-[460px] w-[460px] rounded-full bg-[#F6A876]/25 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(244,122,32,0.16),transparent_62%)]" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-white/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-5 py-8 md:py-12">
        {/* Banner header */}
        <Image
          src="/banner-obrigado.png"
          alt="Obrigado pela sua participação · Agência Com.IA"
          width={1920}
          height={480}
          priority
          className="mb-8 h-auto w-full rounded-2xl shadow-[0_10px_40px_-12px_rgba(244,122,32,0.45)]"
        />

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {TABS.map((t) => {
            const active = t.key === tab;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition"
                style={
                  active
                    ? { background: ORANGE, color: '#fff', boxShadow: '0 8px 20px -8px rgba(244,122,32,0.6)' }
                    : { background: 'rgba(255,255,255,0.7)', color: NAVY, border: '1px solid rgba(27,33,56,0.12)' }
                }
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'entregaveis' && <Entregaveis />}
        {tab === 'skills' && <Skills />}
        {tab === 'pesquisa' && <Pesquisa />}

        <footer className="mt-12 text-center text-xs" style={{ color: 'rgba(27,33,56,0.5)' }}>
          Agência Com.IA · Grupo Scale
        </footer>
      </div>
    </main>
  );
}

function Titulo({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-6 text-center">
      <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: NAVY }}>
        {children}
      </h2>
      {sub && <p className="mx-auto mt-2 max-w-xl text-sm" style={{ color: 'rgba(27,33,56,0.65)' }}>{sub}</p>}
    </div>
  );
}

// ---------- Entregáveis ----------

function Entregaveis() {
  return (
    <section>
      <Titulo sub="Tudo que você precisa pra colocar em prática o que viu no workshop.">
        Seus <span style={{ color: ORANGE }}>entregáveis</span>
      </Titulo>
      <div className="space-y-3">
        {ENTREGAVEIS.map((e) => (
          <CardLink key={e.titulo} item={e} icon={Download} />
        ))}
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section>
      <Titulo sub="Ferramentas e automações de IA pra turbinar sua agência.">
        <span style={{ color: ORANGE }}>Skills</span> liberadas
      </Titulo>
      <div className="space-y-3">
        {SKILLS.map((s) => (
          <CardLink key={s.nome} item={{ titulo: s.nome, descricao: s.descricao, url: s.url ?? '' }} icon={Sparkles} />
        ))}
      </div>
    </section>
  );
}

function CardLink({ item, icon: Icon }: { item: Entregavel; icon: typeof Download }) {
  const disponivel = !!item.url;
  const inner = (
    <div
      className="group flex items-center gap-4 rounded-2xl border bg-white/70 p-5 backdrop-blur transition"
      style={{ borderColor: 'rgba(27,33,56,0.1)' }}
    >
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl"
        style={{ background: 'rgba(244,122,32,0.12)', color: ORANGE }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        {item.tag && (
          <span
            className="mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: 'rgba(244,122,32,0.12)', color: ORANGE }}
          >
            {item.tag}
          </span>
        )}
        <p className="font-bold" style={{ color: NAVY }}>{item.titulo}</p>
        {item.descricao && (
          <p className="mt-0.5 text-sm" style={{ color: 'rgba(27,33,56,0.6)' }}>{item.descricao}</p>
        )}
      </div>
      {disponivel ? (
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-white transition group-hover:brightness-110"
          style={{ background: ORANGE }}
        >
          Acessar <ArrowUpRight className="h-4 w-4" />
        </span>
      ) : (
        <span className="shrink-0 rounded-full px-4 py-2 text-sm font-medium" style={{ background: 'rgba(27,33,56,0.06)', color: 'rgba(27,33,56,0.5)' }}>
          em breve
        </span>
      )}
    </div>
  );

  if (!disponivel) return inner;
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="block hover:-translate-y-0.5 transition-transform">
      {inner}
    </a>
  );
}

// ---------- Pesquisa de satisfação ----------

function Pesquisa() {
  const [nota, setNota] = useState<number | null>(null);
  const [gostou, setGostou] = useState('');
  const [melhorar, setMelhorar] = useState('');
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (nota === null) {
      setErro('Dê uma nota de 0 a 10 primeiro 🙂');
      return;
    }
    setErro('');
    setEnviando(true);
    try {
      const res = await fetch('/api/pesquisa', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nota, gostou, melhorar, nome }),
      });
      if (!res.ok) throw new Error();
      setEnviado(true);
    } catch {
      setErro('Não foi possível enviar. Tenta de novo em instantes.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <section className="rounded-3xl border bg-white/70 p-10 text-center backdrop-blur" style={{ borderColor: 'rgba(27,33,56,0.1)' }}>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full" style={{ background: 'rgba(244,122,32,0.12)', color: ORANGE }}>
          <Star className="h-8 w-8" fill={ORANGE} />
        </div>
        <h2 className="text-3xl font-extrabold" style={{ color: NAVY }}>Valeu demais! 🧡</h2>
        <p className="mt-2 text-sm" style={{ color: 'rgba(27,33,56,0.65)' }}>
          Sua resposta foi registrada. Seu feedback ajuda a gente a melhorar cada vez mais.
        </p>
      </section>
    );
  }

  return (
    <section>
      <Titulo sub="Leva 30 segundos e ajuda muito a Agência Com.IA a evoluir.">
        Pesquisa de <span style={{ color: ORANGE }}>satisfação</span>
      </Titulo>

      <form onSubmit={enviar} className="space-y-6 rounded-3xl border bg-white/70 p-6 backdrop-blur md:p-8" style={{ borderColor: 'rgba(27,33,56,0.1)' }}>
        <div>
          <label className="block text-base font-bold" style={{ color: NAVY }}>
            De 0 a 10, o quanto você recomendaria o workshop?
          </label>
          <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-11">
            {Array.from({ length: 11 }, (_, n) => {
              const active = nota === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNota(n)}
                  className="aspect-square rounded-xl text-sm font-bold transition"
                  style={
                    active
                      ? { background: ORANGE, color: '#fff' }
                      : { background: 'rgba(27,33,56,0.05)', color: NAVY }
                  }
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <Campo label="O que você mais gostou?" value={gostou} onChange={setGostou} placeholder="Conta pra gente o que mais te marcou..." />
        <Campo label="O que podemos melhorar?" value={melhorar} onChange={setMelhorar} placeholder="Sugestões são super bem-vindas..." />

        <div>
          <label className="block text-base font-bold" style={{ color: NAVY }}>Seu nome (opcional)</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Como podemos te chamar?"
            className="mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2"
            style={{ borderColor: 'rgba(27,33,56,0.15)', color: NAVY }}
          />
        </div>

        {erro && <p className="text-sm font-medium text-rose-600">{erro}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-xl py-4 text-base font-bold text-white transition hover:brightness-110 disabled:opacity-60"
          style={{ background: ORANGE, boxShadow: '0 12px 30px -10px rgba(244,122,32,0.6)' }}
        >
          {enviando ? 'Enviando...' : 'Enviar resposta'}
        </button>
      </form>
    </section>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-base font-bold" style={{ color: NAVY }}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-2 w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2"
        style={{ borderColor: 'rgba(27,33,56,0.15)', color: NAVY }}
      />
    </div>
  );
}

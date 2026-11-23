import { useEffect, useState } from 'react';
import { Bot, ClipboardList, ShieldCheck, Zap, Lock, CreditCard, Check } from 'lucide-react';
import usePageSEO from '@/hooks/usePageSEO';
import { calculateOperatorPrice, type OperatorPlanSlug } from '@/lib/licensedOperatorPricing';
import { BF_PROMO_CODE, BF_PROMO_DEADLINE, BF_PROMO_PRICE_CENTS } from '@/lib/blackFridayPromo';
import { fbqTrack } from '@/lib/metaPixel';

const brl = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function useCountdown(target: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  return {
    ended: diff === 0,
    parts: [
      ['dias', Math.floor(diff / 86400000)],
      ['horas', Math.floor(diff / 3600000) % 24],
      ['min', Math.floor(diff / 60000) % 60],
      ['seg', Math.floor(diff / 1000) % 60],
    ] as [string, number][],
  };
}

const PLANS: { slug: OperatorPlanSlug; name: string; icon: typeof Bot; desc: string; features: string[]; featured?: boolean }[] = [
  { slug: 'ouvidoria', name: 'Ouvidoria com IA', icon: Bot, featured: true, desc: 'Canal com a SOnIA: acolhimento, triagem e classificação automáticas.',
    features: ['Canal de denúncias com IA (SOnIA)', 'Triagem e classificação automática', 'Anonimato garantido (LGPD)', 'Protocolo e acompanhamento', 'Painel de gestão'] },
  { slug: 'ouvidoria-smart', name: 'Ouvidoria Smart', icon: ClipboardList, desc: 'Formulário anônimo com protocolo e chave de acesso.',
    features: ['Formulário anônimo', 'Protocolo + chave de acesso', 'Anonimato garantido (LGPD)', 'Painel de gestão', 'Sem IA'] },
];

export default function BlackFridayOuvidoria() {
  usePageSEO({
    title: 'Black Friday Ouvidoria SOIA | R$ 9,90/mês nos 3 primeiros meses',
    description: 'Black Friday SOIA: canal de ouvidoria e denúncias anônimas com IA por R$ 9,90/mês nos 3 primeiros meses. Conforme NR-01 e LGPD.',
  });
  const { ended, parts } = useCountdown(BF_PROMO_DEADLINE);
  const [employees, setEmployees] = useState('50');
  const count = Math.max(1, Math.round(Number(employees) || 0));

  const go = (slug: OperatorPlanSlug, name: string) => {
    try { fbqTrack('InitiateCheckout', { content_name: `${name} — Black Friday`, content_category: 'ouvidoria', currency: 'BRL', value: 9.9 }); } catch { /* noop */ }
    window.location.href = `/contratar?plano=${slug}&ciclo=monthly&vidas=${count}&promo=${BF_PROMO_CODE}`;
  };

  return (
    <div className="min-h-screen bg-bf-bg text-bf-fg overflow-hidden relative">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(hsl(var(--bf-neon))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--bf-neon))_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-bf-neon/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full bg-bf-hot/20 blur-3xl" />

      <header className="relative z-10 max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <a href="/ouvidoria"><img src="/lovable-uploads/Logo_SOIA.png" alt="SOIA" className="h-9 brightness-0 invert" /></a>
        <span className="font-mono text-xs text-bf-muted">// black_friday.2026</span>
      </header>

      <section className="relative z-10 max-w-6xl mx-auto px-4 pt-10 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-bf-neon/40 bg-bf-neon/10 font-mono text-xs tracking-widest text-bf-neon mb-8">
          <Zap className="h-3.5 w-3.5" /> OFERTA POR TEMPO LIMITADO
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
          BLACK<span className="text-transparent bg-clip-text bg-gradient-to-r from-bf-neon to-bf-hot">FRIDAY</span>
        </h1>
        <p className="mt-6 text-xl md:text-2xl text-bf-muted max-w-2xl mx-auto">
          Qualquer plano de ouvidoria com IA por apenas
        </p>
        <p className="mt-2 text-7xl md:text-8xl font-black text-bf-neon drop-shadow-[0_0_30px_hsl(var(--bf-neon)/0.5)]">
          R$ 9,90<span className="text-2xl md:text-3xl text-bf-fg font-bold">/mês</span>
        </p>
        <p className="mt-2 text-xs text-bf-muted">*nos 3 primeiros meses</p>

        <div className="mt-10 flex justify-center gap-3">
          {ended ? (
            <p className="font-mono text-bf-hot">Oferta encerrada.</p>
          ) : parts.map(([l, v]) => (
            <div key={l} className="w-20 md:w-24 py-3 rounded-xl border border-bf-neon/30 bg-bf-surface/80 backdrop-blur">
              <div className="font-mono text-3xl md:text-4xl font-bold">{String(v).padStart(2, '0')}</div>
              <div className="text-[10px] uppercase tracking-widest text-bf-muted">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-20">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <label htmlFor="bf-emp" className="text-sm text-bf-muted">Quantos colaboradores sua empresa tem?</label>
          <input id="bf-emp" type="number" min={1} value={employees} onChange={(e) => setEmployees(e.target.value)}
            className="w-28 rounded-lg bg-bf-surface border border-bf-neon/30 px-3 py-2 text-center font-mono text-bf-fg focus:outline-none focus:border-bf-neon" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map((p) => {
            const regular = calculateOperatorPrice(p.slug, count, 'monthly').monthlyCents;
            const Icon = p.icon;
            return (
              <div key={p.slug} className={`relative rounded-2xl p-7 bg-bf-surface/80 backdrop-blur border ${p.featured ? 'border-bf-neon shadow-[0_0_40px_-10px_hsl(var(--bf-neon)/0.6)]' : 'border-bf-fg/10'}`}>
                {p.featured && <span className="absolute -top-3 left-7 px-3 py-0.5 rounded-full bg-bf-neon text-bf-bg text-[11px] font-bold uppercase">Mais completo</span>}
                <Icon className="h-8 w-8 text-bf-neon mb-4" />
                <h2 className="text-2xl font-bold">{p.name}</h2>
                <p className="text-sm text-bf-muted mt-1 mb-5">{p.desc}</p>
                <p className="text-sm text-bf-muted line-through">{brl(regular)}/mês</p>
                <p className="text-5xl font-black text-bf-neon">{brl(BF_PROMO_PRICE_CENTS)}<span className="text-lg text-bf-fg">/mês</span></p>
                <p className="text-[11px] text-bf-muted mt-1">*nos 3 primeiros meses. Depois, {brl(regular)}/mês.</p>
                <ul className="mt-6 space-y-2">
                  {p.features.map((f) => <li key={f} className="flex gap-2 text-sm"><Check className="h-4 w-4 text-bf-neon shrink-0 mt-0.5" />{f}</li>)}
                </ul>
                <button disabled={ended} onClick={() => go(p.slug, p.name)}
                  className="mt-7 w-full rounded-xl py-3.5 font-bold bg-gradient-to-r from-bf-neon to-bf-hot text-bf-bg hover:opacity-90 disabled:opacity-40 transition">
                  Garantir por R$ 9,90
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-12 grid sm:grid-cols-3 gap-4 text-sm">
          {[[ShieldCheck, 'NR-01 e LGPD', 'Canal pronto para a fiscalização.'], [Lock, '100% anônimo', 'Sem login, nome ou e-mail do denunciante.'], [CreditCard, 'Cancele quando quiser', 'Sem multa, direto com a gente.']].map(([I, t, d]: any) => (
            <div key={t} className="rounded-xl border border-bf-fg/10 bg-bf-surface/60 p-5">
              <I className="h-5 w-5 text-bf-hot mb-2" /><p className="font-semibold">{t}</p><p className="text-bf-muted">{d}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[11px] text-bf-muted text-center max-w-3xl mx-auto leading-relaxed">
          Condições: oferta válida para novas assinaturas mensais dos planos Ouvidoria e Ouvidoria Smart contratadas até 30/11/2026, com pagamento por cartão de crédito.
          R$ 9,90/mês nos 3 primeiros meses. A partir do 4º mês, a cobrança passa automaticamente ao valor normal do plano conforme o número de colaboradores, salvo cancelamento antes da 4ª cobrança.
        </p>
      </section>
    </div>
  );
}

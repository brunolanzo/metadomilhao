import Link from 'next/link';
import { ArrowRight, PieChart, Tags, Users, BadgeCheck, ShieldCheck, LayoutDashboard, ArrowLeftRight, TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';
import { Footer } from '@/components/layout/footer';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Meta do Milhão',
  url: 'https://metadomilhao.com.br',
  description: 'Controle financeiro familiar 100% gratuito. Gerencie gastos, receitas, orçamentos e metas da sua família com dashboard, gráficos e categorias personalizáveis.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
  },
  author: {
    '@type': 'Person',
    name: 'Bruno Lanzo',
  },
  inLanguage: 'pt-BR',
  browserRequirements: 'Requires JavaScript',
  softwareVersion: '1.0',
  aggregateRating: undefined,
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <header className="border-b border-border px-6 py-6 mt-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-black font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-lg">Meta do Milhão</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Criar conta
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex items-center justify-center px-6 py-16">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Controle financeiro
            <br />
            <span className="text-primary">familiar simplificado</span>
          </h1>
          <p className="text-lg text-muted mb-10 max-w-lg mx-auto">
            Gerencie gastos e ganhos da sua família em um só lugar.
            Categorias customizáveis, gráficos claros e controle total.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary text-black px-8 py-3 rounded-lg text-base font-semibold hover:bg-primary-hover transition-colors"
          >
            Começar agora
            <ArrowRight size={20} />
          </Link>

          {/* Trust badges */}
          <div className="mt-12 flex items-center justify-center gap-8 sm:gap-12">
            <div className="flex items-center gap-2">
              <BadgeCheck size={22} className="text-success" strokeWidth={1.5} />
              <span className="text-sm font-medium text-foreground">100% Gratuito</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={22} className="text-success" strokeWidth={1.5} />
              <span className="text-sm font-medium text-foreground">Seguro</span>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Tags size={24} className="text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-medium">Categorias livres</h3>
              <p className="text-sm text-muted">Crie e personalize suas próprias categorias de gastos e ganhos.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <PieChart size={24} className="text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-medium">Visão clara</h3>
              <p className="text-sm text-muted">Dashboard com gráficos e resumo mensal dos seus gastos.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users size={24} className="text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-medium">Em família</h3>
              <p className="text-sm text-muted">Compartilhe o controle financeiro com todos os membros da família.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Demo Section */}
      <section className="px-6 py-16 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Conheça por dentro</h2>
          <p className="text-muted text-center mb-12 max-w-lg mx-auto">Veja como o Meta do Milhão organiza suas finanças de forma simples e visual.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dashboard Demo */}
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <LayoutDashboard size={20} className="text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-semibold">Dashboard</h3>
                  <p className="text-xs text-muted">Resumo completo do seu mês</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wallet size={16} className="text-primary" strokeWidth={1.5} />
                    <span className="text-sm">Saldo do mês</span>
                  </div>
                  <span className="text-sm font-bold text-success">R$ 2.450,00</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-success" strokeWidth={1.5} />
                    <span className="text-sm">Receitas</span>
                  </div>
                  <span className="text-sm font-bold text-success">R$ 8.500,00</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={16} className="text-danger" strokeWidth={1.5} />
                    <span className="text-sm">Despesas</span>
                  </div>
                  <span className="text-sm font-bold text-danger">R$ 6.050,00</span>
                </div>
              </div>
            </div>

            {/* Transactions Demo */}
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ArrowLeftRight size={20} className="text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-semibold">Transações</h3>
                  <p className="text-xs text-muted">Registro detalhado de movimentações</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { desc: 'Salário', value: 'R$ 7.000,00', type: 'income', cat: 'Renda', color: '#22C55E' },
                  { desc: 'Aluguel', value: 'R$ 2.200,00', type: 'expense', cat: 'Moradia', color: '#EF4444' },
                  { desc: 'Supermercado', value: 'R$ 850,00', type: 'expense', cat: 'Alimentação', color: '#F59E0B' },
                  { desc: 'Freelance', value: 'R$ 1.500,00', type: 'income', cat: 'Renda Extra', color: '#22C55E' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      <div>
                        <p className="text-sm font-medium">{t.desc}</p>
                        <p className="text-[11px] text-muted">{t.cat}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                      {t.type === 'expense' ? '-' : '+'}{t.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories Demo */}
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tags size={20} className="text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-semibold">Categorias</h3>
                  <p className="text-xs text-muted">Organize com suas próprias categorias</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Alimentação', color: '#F59E0B', budget: 'R$ 650 / R$ 800' },
                  { name: 'Transporte', color: '#3B82F6', budget: 'R$ 320 / R$ 500' },
                  { name: 'Moradia', color: '#EF4444', budget: 'R$ 2.200 / R$ 2.500' },
                  { name: 'Lazer', color: '#8B5CF6', budget: 'R$ 180 / R$ 300' },
                ].map((c, i) => (
                  <div key={i} className="p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-sm font-medium">{c.name}</span>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ backgroundColor: c.color, width: `${(i + 1) * 20 + 15}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted mt-1">{c.budget}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Family Demo */}
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users size={20} className="text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-semibold">Perfil Familiar</h3>
                  <p className="text-xs text-muted">Gerencie sua família e metas</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-background rounded-lg">
                  <p className="text-xs text-muted mb-1">Família</p>
                  <p className="text-sm font-semibold text-primary">Família Silva</p>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Carlos Silva', role: 'Admin' },
                    { name: 'Ana Silva', role: 'Membro' },
                    { name: 'Pedro Silva', role: 'Membro' },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{m.name[0]}</span>
                        </div>
                        <span className="text-sm">{m.name}</span>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${m.role === 'Admin' ? 'bg-primary/10 text-primary' : 'bg-border text-muted'}`}>
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={14} className="text-primary" strokeWidth={1.5} />
                    <span className="text-sm font-medium">Meta de março</span>
                  </div>
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-success" style={{ width: '72%' }} />
                  </div>
                  <p className="text-[10px] text-muted mt-1">72% atingido — R$ 7.200 / R$ 10.000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

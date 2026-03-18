import Link from 'next/link';
import { ArrowRight, PieChart, Tags, Users } from 'lucide-react';
import { Footer } from '@/components/layout/footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
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
      <main className="flex-1 flex items-center justify-center px-6">
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

          {/* Features */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8">
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
      <Footer />
    </div>
  );
}

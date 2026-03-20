import Link from 'next/link';
import { ArrowRight, ArrowLeft, Heart, Target, Users, Copy, Sparkles } from 'lucide-react';
import { Footer } from '@/components/layout/footer';
import { WhatsAppShareButton } from '@/components/whatsapp-share-button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre o Projeto',
  description:
    'Conheça a história por trás do Meta do Milhão. Um projeto criado por Bruno Lanzo para ajudar famílias brasileiras a organizarem suas finanças de forma simples e gratuita.',
};

export default function SobrePage() {
  const pixKey = 'bruno.lanzo@gmail.com';

  return (
    <div className="min-h-screen flex flex-col">
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
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              Voltar
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-6 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart size={40} className="text-primary" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Sobre o{' '}
              <span className="text-primary">Meta do Milhão</span>
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Um projeto nascido do desejo de ajudar famílias brasileiras a conquistarem
              sua liberdade financeira, de forma simples e acessível.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="px-6 py-12 bg-card/30">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="flex gap-6">
              <div className="hidden sm:flex shrink-0 w-12 h-12 rounded-lg bg-primary/10 items-center justify-center mt-1">
                <Sparkles size={24} className="text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-4">Como tudo começou</h2>
                <p className="text-muted leading-relaxed mb-4">
                  Meu nome é Bruno Lanzo, e como muitas pessoas, já passei por momentos
                  em que as contas no fim do mês simplesmente não fechavam. Eu sabia
                  quanto ganhava, mas não fazia ideia de para onde o dinheiro ia.
                </p>
                <p className="text-muted leading-relaxed mb-4">
                  Tentei planilhas, tentei apps pagos, tentei anotar num caderno. Nada
                  funcionava de verdade para a realidade da minha família. Os apps eram
                  complicados demais ou cobravam mensalidade. As planilhas ficavam
                  desatualizadas. O caderno... bom, o caderno se perdia.
                </p>
                <p className="text-muted leading-relaxed">
                  Foi aí que decidi criar algo diferente: uma ferramenta simples, visual
                  e gratuita, pensada especialmente para famílias brasileiras que querem
                  organizar suas finanças sem complicação.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="hidden sm:flex shrink-0 w-12 h-12 rounded-lg bg-primary/10 items-center justify-center mt-1">
                <Target size={24} className="text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-4">A missão</h2>
                <p className="text-muted leading-relaxed mb-4">
                  O Meta do Milhão nasceu com uma missão clara: democratizar o controle
                  financeiro. Acredito que toda família merece ter acesso a ferramentas
                  de qualidade para cuidar do seu dinheiro, independente da renda.
                </p>
                <p className="text-muted leading-relaxed">
                  Por isso o site é e sempre será 100% gratuito. Sem planos pagos, sem
                  funcionalidades escondidas atrás de um paywall, sem pegadinhas. Todas as
                  funcionalidades estão disponíveis para todos, do dashboard completo à
                  importação de extratos bancários.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="hidden sm:flex shrink-0 w-12 h-12 rounded-lg bg-primary/10 items-center justify-center mt-1">
                <Users size={24} className="text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-4">Para quem é</h2>
                <p className="text-muted leading-relaxed mb-4">
                  O Meta do Milhão é para você que quer saber exatamente para onde seu
                  dinheiro vai. Para a família que quer definir metas e acompanhar o
                  progresso juntos. Para quem está começando a vida financeira e para quem
                  já tem experiência mas precisa de uma ferramenta prática.
                </p>
                <p className="text-muted leading-relaxed">
                  Não importa se você ganha um salário mínimo ou dez. Organização
                  financeira é para todos, e o primeiro passo é ter visibilidade sobre
                  suas receitas e despesas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Donation CTA */}
        <section className="px-6 py-16 md:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart size={32} className="text-primary fill-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ajude a manter o projeto vivo</h2>
            <p className="text-muted mb-8 max-w-lg mx-auto">
              Manter o Meta do Milhão gratuito tem um custo. Servidores, domínio e horas
              de desenvolvimento. Se o projeto te ajudou de alguma forma, considere fazer
              uma doação via PIX. Qualquer valor faz diferença.
            </p>

            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm mx-auto mb-8">
              <p className="text-xs text-muted mb-2">Chave PIX (e-mail)</p>
              <code className="block text-foreground font-mono text-sm bg-background px-4 py-3 rounded-lg border border-border mb-2">
                {pixKey}
              </code>
              <p className="text-xs text-muted">
                Destinatário: <strong className="text-foreground">Bruno Lanzo</strong>
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary text-black px-8 py-3 rounded-lg text-base font-semibold hover:bg-primary-hover transition-colors"
            >
              Voltar para o início
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppShareButton />
    </div>
  );
}

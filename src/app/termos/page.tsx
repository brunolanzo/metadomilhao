import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={16} />
          Voltar ao início
        </Link>

        <h1 className="text-3xl font-bold mb-2">Termos e Condições</h1>
        <p className="text-sm text-muted mb-8">Última atualização: 17 de março de 2026</p>

        <div className="space-y-6 text-sm text-muted leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar o Meta do Milhão, você concorda com estes Termos e Condições.
              Caso não concorde com algum dos termos aqui descritos, recomendamos que não utilize a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Descrição do Serviço</h2>
            <p>
              O Meta do Milhão é uma plataforma gratuita de controle financeiro familiar que permite o
              registro e acompanhamento de receitas e despesas, definição de metas financeiras e
              orçamentos por categoria. O serviço é oferecido &quot;como está&quot;, sem garantias de
              disponibilidade ininterrupta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Cadastro e Conta</h2>
            <p>
              Para utilizar a plataforma, é necessário criar uma conta com e-mail válido. Você é
              responsável por manter a confidencialidade de suas credenciais de acesso e por todas
              as atividades realizadas em sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Uso Adequado</h2>
            <p>
              Você se compromete a utilizar a plataforma apenas para fins de controle financeiro
              pessoal e familiar. É proibido utilizar o serviço para atividades ilegais, disseminar
              conteúdo malicioso ou tentar comprometer a segurança da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Dados e Responsabilidade</h2>
            <p>
              Os dados financeiros inseridos na plataforma são de responsabilidade do usuário.
              O Meta do Milhão não se responsabiliza por decisões financeiras tomadas com base
              nas informações exibidas na plataforma. Recomendamos sempre consultar um profissional
              financeiro qualificado para decisões importantes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Gratuidade e Doações</h2>
            <p>
              O Meta do Milhão é um serviço gratuito. Doações são voluntárias e não garantem
              funcionalidades adicionais, suporte prioritário ou qualquer tipo de vantagem na
              utilização da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Modificações</h2>
            <p>
              Reservamos o direito de modificar estes termos a qualquer momento. Alterações
              significativas serão comunicadas através da plataforma. O uso continuado após
              as modificações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Contato</h2>
            <p>
              Em caso de dúvidas sobre estes termos, entre em contato pelo e-mail{' '}
              <a href="mailto:bruno.lanzo@gmail.com" className="text-primary hover:underline">
                bruno.lanzo@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

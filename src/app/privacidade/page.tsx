import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={16} />
          Voltar ao início
        </Link>

        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-sm text-muted mb-8">Última atualização: 17 de março de 2026</p>

        <div className="space-y-6 text-sm text-muted leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Informações Coletadas</h2>
            <p>
              Coletamos apenas as informações necessárias para o funcionamento da plataforma:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>E-mail e nome (para criação da conta)</li>
              <li>Dados financeiros inseridos por você (transações, categorias, metas)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Como Usamos seus Dados</h2>
            <p>
              Seus dados são utilizados exclusivamente para:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Autenticação e acesso à plataforma</li>
              <li>Exibição do seu controle financeiro pessoal e familiar</li>
              <li>Geração de relatórios e gráficos dentro da plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Compartilhamento de Dados</h2>
            <p>
              Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros.
              Seus dados financeiros são visíveis apenas para você e os membros da sua família
              cadastrados na plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Armazenamento e Segurança</h2>
            <p>
              Seus dados são armazenados de forma segura utilizando Supabase, com criptografia
              em trânsito (HTTPS) e em repouso. Utilizamos políticas de segurança em nível de
              linha (RLS) para garantir que apenas usuários autorizados acessem os dados da
              sua família.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Cookies</h2>
            <p>
              Utilizamos cookies essenciais apenas para manter sua sessão de autenticação ativa.
              Não utilizamos cookies de rastreamento, publicidade ou analytics de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Seus Direitos</h2>
            <p>
              Você tem o direito de:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Acessar todos os dados armazenados sobre você</li>
              <li>Solicitar a correção de dados incorretos</li>
              <li>Solicitar a exclusão completa da sua conta e dados</li>
              <li>Exportar seus dados (via funcionalidade de relatórios)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Alterações nesta Política</h2>
            <p>
              Esta política pode ser atualizada periodicamente. Alterações significativas serão
              comunicadas através da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Contato</h2>
            <p>
              Para questões sobre privacidade, entre em contato pelo e-mail{' '}
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

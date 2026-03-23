import Link from 'next/link';

export const metadata = {
  title: 'Exclusão de Dados | Meta do Milhão',
  description: 'Solicite a exclusão dos seus dados pessoais do Meta do Milhão.',
};

export default function ExclusaoDadosPage() {
  return (
    <div className="min-h-screen px-4 py-16 max-w-2xl mx-auto">
      <Link href="/" className="text-primary hover:underline text-sm">
        ← Voltar ao início
      </Link>

      <h1 className="text-3xl font-bold mt-6 mb-8">Exclusão de Dados</h1>

      <div className="space-y-6 text-muted leading-relaxed">
        <p>
          O Meta do Milhão respeita seu direito à privacidade e à exclusão dos seus dados pessoais,
          conforme previsto na Lei Geral de Proteção de Dados (LGPD).
        </p>

        <h2 className="text-xl font-semibold text-foreground">Como solicitar a exclusão</h2>
        <p>
          Para solicitar a exclusão completa dos seus dados, envie um email para{' '}
          <a href="mailto:contato@metadomilhao.com.br" className="text-primary hover:underline">
            contato@metadomilhao.com.br
          </a>{' '}
          com o assunto <strong>&quot;Exclusão de dados&quot;</strong> e informe o email da sua conta.
        </p>

        <h2 className="text-xl font-semibold text-foreground">O que será excluído</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Seu perfil e dados pessoais (nome, email)</li>
          <li>Todas as suas transações financeiras</li>
          <li>Categorias personalizadas</li>
          <li>Metas financeiras</li>
          <li>Vínculos familiares</li>
          <li>Dados de autenticação (incluindo login via Google ou Facebook)</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground">Prazo</h2>
        <p>
          A exclusão será realizada em até <strong>15 dias úteis</strong> após o recebimento da
          solicitação. Você receberá uma confirmação por email quando o processo for concluído.
        </p>

        <h2 className="text-xl font-semibold text-foreground">Login via Facebook</h2>
        <p>
          Se você se cadastrou usando o Facebook, pode também remover o acesso do Meta do Milhão
          diretamente nas{' '}
          <strong>Configurações do Facebook → Aplicativos e sites</strong>. Ao remover,
          seus dados serão automaticamente marcados para exclusão.
        </p>
      </div>
    </div>
  );
}

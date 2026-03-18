'use client';

import { useState } from 'react';
import { Heart, X, Copy, Check, MessageCircle } from 'lucide-react';

export function DonationBanner() {
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const pixKey = 'bruno.lanzo@gmail.com';

  function handleCopy() {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* Fixed banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-primary/90 via-yellow-500/90 to-primary/90 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 text-center">
          <Heart size={16} className="text-red-600 shrink-0 fill-red-600 animate-pulse" />
          <p className="text-black text-sm font-medium">
            <span className="hidden sm:inline">Este site é <strong>100% gratuito</strong> e depende da sua doação para continuar evoluindo. Invista no seu futuro financeiro!</span>
            <span className="sm:hidden"><strong>Gratuito!</strong> Ajude a manter o site vivo</span>
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="ml-2 shrink-0 px-5 py-2 bg-black text-primary font-bold text-sm rounded-full hover:bg-black/80 transition-colors cursor-pointer"
          >
            Doar via PIX
          </button>
        </div>
      </div>

      {/* Spacer to push content below the fixed banner */}
      <div className="h-11" />

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            {/* Close */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart size={32} className="text-primary fill-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Apoie o Meta do Milhão</h2>
              <p className="text-sm text-muted mt-2">
                Sua contribuição mantém o site gratuito e nos ajuda a criar novas funcionalidades para a sua evolução financeira.
              </p>
            </div>

            {/* PIX info */}
            <div className="bg-background rounded-xl p-4 mb-4">
              <p className="text-xs text-muted mb-1 text-center">Chave PIX (e-mail)</p>
              <div className="flex items-center gap-2 justify-center">
                <code className="text-foreground font-mono text-sm bg-card px-3 py-2 rounded-lg border border-border text-center">
                  {pixKey}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-primary text-black hover:bg-primary/80 transition-colors cursor-pointer"
                  title="Copiar chave PIX"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              {copied && (
                <p className="text-xs text-success text-center mt-2">Chave copiada!</p>
              )}
              <p className="text-xs text-muted text-center mt-2">
                Destinatário: <strong className="text-foreground">Bruno Lanzo</strong>
              </p>
            </div>

            {/* Motivational message */}
            <p className="text-center text-sm text-muted mb-6">
              Qualquer valor faz a diferença.<br />Obrigado por acreditar neste projeto!
            </p>

            {/* Support link */}
            <div className="border-t border-border pt-4">
              <a
                href="mailto:bruno.lanzo@gmail.com?subject=Meta do Milhão - Dúvida/Sugestão"
                className="flex items-center justify-center gap-2 text-xs text-muted/60 hover:text-muted transition-colors"
              >
                <MessageCircle size={14} />
                Dúvidas e Sugestões? Fale diretamente com o criador
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

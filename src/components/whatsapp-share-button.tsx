'use client';

import { MessageCircle } from 'lucide-react';

export function WhatsAppShareButton() {
  const message = encodeURIComponent(
    'Conhece o Meta do Milhão? Um site 100% gratuito para controle financeiro familiar! 🎯💰 https://metadomilhao.com.br'
  );
  const whatsappUrl = `https://wa.me/?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105"
      aria-label="Compartilhar no WhatsApp"
    >
      <MessageCircle size={26} strokeWidth={1.5} />
    </a>
  );
}

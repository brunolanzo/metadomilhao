'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-black font-bold text-[10px]">M</span>
            </div>
            <span className="text-sm text-muted">Meta do Milhão</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/termos" className="text-muted hover:text-foreground transition-colors">
              Termos e Condições
            </Link>
            <Link href="/privacidade" className="text-muted hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-muted/60 flex items-center gap-1">
            Feito com <Heart size={12} className="text-red-500 fill-red-500" /> por Bruno Lanzo
          </p>
        </div>
      </div>
    </footer>
  );
}

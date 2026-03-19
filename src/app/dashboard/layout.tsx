'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Footer } from '@/components/layout/footer';
import { NotificationBell } from '@/components/notifications';
import { Onboarding } from '@/components/onboarding';
import { useCheckInvites } from '@/lib/hooks/use-check-invites';
import { Menu, Check } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { inviteMessage } = useCheckInvites();

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-black font-bold text-xs">M</span>
            </div>
            <span className="font-semibold">Meta do Milhão</span>
          </div>
          <NotificationBell />
        </header>

        {/* Desktop notification bell */}
        <div className="hidden md:flex justify-end px-8 pt-6">
          <NotificationBell />
        </div>

        {inviteMessage && (
          <div className="mx-4 md:mx-8 mt-4 flex items-center gap-2 text-sm text-success p-3 rounded-lg bg-success/10">
            <Check size={16} strokeWidth={1.5} />
            {inviteMessage}
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
        <Footer />
        <Onboarding />
      </div>
    </div>
  );
}

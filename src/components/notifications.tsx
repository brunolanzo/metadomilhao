'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, getMonthRange } from '@/lib/utils';
import { Bell, AlertTriangle, Target, Repeat } from 'lucide-react';

interface Notification {
  id: string;
  type: 'budget' | 'goal' | 'recurring';
  title: string;
  message: string;
  severity: 'warning' | 'danger';
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotifications() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return;

    const familyId = membership.family_id;
    const { start, end } = getMonthRange();
    const alerts: Notification[] = [];

    // 1. Budget alerts (>= 80%)
    const { data: budgets } = await supabase
      .from('category_budgets')
      .select('*, category:categories(name, color)')
      .eq('family_id', familyId);

    if (budgets) {
      const { data: txs } = await supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('family_id', familyId)
        .eq('type', 'expense')
        .gte('date', start)
        .lte('date', end);

      const spendMap: Record<string, number> = {};
      (txs || []).forEach((t) => {
        if (t.category_id) {
          spendMap[t.category_id] = (spendMap[t.category_id] || 0) + Number(t.amount);
        }
      });

      budgets.forEach((b: { category_id: string; monthly_limit: number; category: { name: string } }) => {
        const spent = spendMap[b.category_id] || 0;
        const pct = (spent / Number(b.monthly_limit)) * 100;
        if (pct >= 100) {
          alerts.push({
            id: `budget-over-${b.category_id}`,
            type: 'budget',
            title: 'Orçamento estourado',
            message: `${b.category?.name}: ${formatCurrency(spent)} de ${formatCurrency(Number(b.monthly_limit))} (${Math.round(pct)}%)`,
            severity: 'danger',
          });
        } else if (pct >= 80) {
          alerts.push({
            id: `budget-warn-${b.category_id}`,
            type: 'budget',
            title: 'Orçamento próximo do limite',
            message: `${b.category?.name}: ${formatCurrency(spent)} de ${formatCurrency(Number(b.monthly_limit))} (${Math.round(pct)}%)`,
            severity: 'warning',
          });
        }
      });
    }

    // 2. Goal alert
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const { data: goal } = await supabase
      .from('goals')
      .select('*')
      .eq('family_id', familyId)
      .eq('month', currentMonth)
      .maybeSingle();

    if (goal) {
      const { data: monthTxs } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('family_id', familyId)
        .gte('date', start)
        .lte('date', end);

      if (monthTxs) {
        const inc = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const exp = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
        const savings = inc - exp;
        const targetAmt = Number(goal.target_amount);
        const dayOfMonth = new Date().getDate();
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const monthProgress = dayOfMonth / daysInMonth;

        // If we're past 50% of the month and savings is under 30% of target
        if (monthProgress > 0.5 && savings < targetAmt * 0.3) {
          alerts.push({
            id: 'goal-risk',
            type: 'goal',
            title: 'Meta em risco',
            message: `Economia atual: ${formatCurrency(savings)} de ${formatCurrency(targetAmt)} (${Math.round((savings / targetAmt) * 100)}%)`,
            severity: savings < 0 ? 'danger' : 'warning',
          });
        }
      }
    }

    // 3. Upcoming recurring transactions (next 3 days)
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const futureStr = `${threeDaysLater.getFullYear()}-${String(threeDaysLater.getMonth() + 1).padStart(2, '0')}-${String(threeDaysLater.getDate()).padStart(2, '0')}`;

    const { data: upcoming } = await supabase
      .from('transactions')
      .select('description, date, amount, type')
      .eq('family_id', familyId)
      .eq('is_recurring', true)
      .eq('is_provisional', true)
      .gte('date', todayStr)
      .lte('date', futureStr)
      .order('date')
      .limit(5);

    (upcoming || []).forEach((t) => {
      alerts.push({
        id: `recurring-${t.date}-${t.description}`,
        type: 'recurring',
        title: 'Conta recorrente próxima',
        message: `${t.description || 'Transação recorrente'}: ${formatCurrency(Number(t.amount))} em ${new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}`,
        severity: 'warning',
      });
    });

    setNotifications(alerts);
  }

  const iconForType = (type: string) => {
    switch (type) {
      case 'budget': return AlertTriangle;
      case 'goal': return Target;
      case 'recurring': return Repeat;
      default: return Bell;
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
      >
        <Bell size={20} strokeWidth={1.5} />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger text-white text-[10px] flex items-center justify-center font-medium">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-border bg-background shadow-lg z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium">Notificações</p>
          </div>
          {notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((n) => {
                const Icon = iconForType(n.type);
                return (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-card transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.severity === 'danger' ? 'bg-danger/10' : 'bg-primary/10'}`}>
                      <Icon size={14} className={n.severity === 'danger' ? 'text-danger' : 'text-primary'} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{n.title}</p>
                      <p className="text-xs text-muted mt-0.5">{n.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted">Nenhuma notificação</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

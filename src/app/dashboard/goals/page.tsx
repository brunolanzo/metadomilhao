'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatCurrency, formatMonthLabel, toLocalDateString } from '@/lib/utils';
import { Plus, Pencil, Trash2, Target, TrendingUp } from 'lucide-react';
import type { Goal } from '@/types/database';

interface GoalWithProgress extends Goal {
  income: number;
  expense: number;
  savings: number;
  progress: number; // percentage
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [amountCents, setAmountCents] = useState(0);
  const [goalMonth, setGoalMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: membership } = await supabase
      .from('family_members')
      .select('family_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership) { setLoading(false); return; }

    setFamilyId(membership.family_id);
    setIsAdmin(membership.role === 'admin');

    // Load goals
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('family_id', membership.family_id)
      .order('month', { ascending: false });

    if (!goalsData) { setLoading(false); return; }

    // For each goal, calculate income/expense from transactions
    const goalsWithProgress: GoalWithProgress[] = await Promise.all(
      goalsData.map(async (goal) => {
        const [year, month] = goal.month.split('-').map(Number);
        const start = toLocalDateString(new Date(year, month - 1, 1));
        const end = toLocalDateString(new Date(year, month, 0));

        const { data: txs } = await supabase
          .from('transactions')
          .select('type, amount')
          .eq('family_id', membership.family_id)
          .gte('date', start)
          .lte('date', end);

        const income = (txs || [])
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = (txs || [])
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const savings = income - expense;
        const progress = Number(goal.target_amount) > 0
          ? (savings / Number(goal.target_amount)) * 100
          : 0;

        return { ...goal, income, expense, savings, progress };
      })
    );

    setGoals(goalsWithProgress);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setAmountCents(0);
    setGoalMonth(() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    setModalError('');
    setModalOpen(true);
  }

  function openEdit(goal: Goal) {
    setEditing(goal);
    setAmountCents(Math.round(Number(goal.target_amount) * 100));
    setGoalMonth(goal.month);
    setModalError('');
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (amountCents === 0) {
      setModalError('Informe um valor maior que zero.');
      return;
    }
    setSaving(true);
    setModalError('');

    const supabase = createClient();
    const payload = {
      family_id: familyId,
      target_amount: amountCents / 100,
      month: goalMonth,
    };

    if (editing) {
      const { error } = await supabase
        .from('goals')
        .update({ target_amount: payload.target_amount, month: payload.month })
        .eq('id', editing.id);

      if (error) {
        setModalError(error.message.includes('unique') ? 'Já existe uma meta para este mês.' : 'Erro ao salvar.');
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from('goals').upsert(payload, { onConflict: 'family_id,month' });

      if (error) {
        setModalError('Erro ao salvar. Tente novamente.');
        setSaving(false);
        return;
      }
    }

    setModalOpen(false);
    setSaving(false);
    setLoading(true);
    loadData();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from('goals').delete().eq('id', id);
    setDeleteConfirm(null);
    setLoading(true);
    loadData();
  }

  function getProgressColor(progress: number): string {
    if (progress >= 100) return 'bg-success';
    if (progress >= 50) return 'bg-primary';
    return 'bg-danger';
  }

  function getProgressTextColor(progress: number): string {
    if (progress >= 100) return 'text-success';
    if (progress >= 50) return 'text-primary';
    return 'text-danger';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Metas</h1>
        {isAdmin && (
          <Button onClick={openCreate} size="sm">
            <Plus size={18} />
            <span className="hidden sm:inline">Nova meta</span>
          </Button>
        )}
      </div>

      {goals.length > 0 ? (
        <div className="flex flex-col gap-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Target size={18} className="text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold capitalize">{formatMonthLabel(goal.month)}</p>
                    <p className="text-xs text-muted">
                      Meta: {formatCurrency(Number(goal.target_amount))}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(goal)}
                      className="p-1.5 text-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(goal.id)}
                      className="p-1.5 text-muted hover:text-danger transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="w-full h-2.5 rounded-full bg-card-hover overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(goal.progress)}`}
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <TrendingUp size={12} strokeWidth={1.5} className={getProgressTextColor(goal.progress)} />
                  <span className={`font-semibold ${getProgressTextColor(goal.progress)}`}>
                    {goal.progress >= 0 ? Math.round(goal.progress) : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-3 text-muted">
                  <span>Economia: <span className={`font-medium ${goal.savings >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(goal.savings)}</span></span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Target size={40} className="text-muted mb-3" strokeWidth={1} />
            <p className="text-sm text-muted mb-1">Nenhuma meta definida</p>
            {isAdmin && (
              <p className="text-xs text-muted">
                Crie metas mensais de economia para acompanhar seu progresso.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar meta' : 'Nova meta'}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            id="goal-month"
            label="Mês"
            type="month"
            value={goalMonth}
            onChange={(e) => setGoalMonth(e.target.value)}
            required
          />
          <CurrencyInput
            id="goal-amount"
            label="Meta de economia"
            value={amountCents}
            onChange={setAmountCents}
            required
          />
          <p className="text-xs text-muted">
            Quanto você deseja economizar (receitas - despesas) neste mês.
          </p>
          {modalError && (
            <p className="text-sm text-danger">{modalError}</p>
          )}
          <div className="flex gap-3 mt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Excluir meta"
      >
        <p className="text-sm text-muted mb-6">
          Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => handleDelete(deleteConfirm!)} className="flex-1">
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatCurrency, getMonthRange } from '@/lib/utils';
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { Category, CategoryBudget, TransactionType } from '@/types/database';

const ICON_OPTIONS = [
  'banknote', 'laptop', 'trending-up', 'plus-circle', 'utensils', 'car',
  'home', 'heart-pulse', 'graduation-cap', 'gamepad-2', 'shopping-bag',
  'file-text', 'gift', 'plane', 'music', 'shirt', 'coffee', 'smartphone',
  'wifi', 'zap', 'briefcase', 'baby', 'dog', 'dumbbell',
];

const COLOR_OPTIONS = [
  '#FFD700', '#EF4444', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899',
  '#F97316', '#14B8A6', '#6366F1', '#F59E0B', '#D946EF', '#64748B',
];

function getIconComponent(name: string) {
  const pascalName = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[pascalName];
  return Icon || LucideIcons.Circle;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [spending, setSpending] = useState<Record<string, number>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  // Budget modal
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetCategoryId, setBudgetCategoryId] = useState('');
  const [budgetCents, setBudgetCents] = useState(0);
  const [savingBudget, setSavingBudget] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [icon, setIcon] = useState('circle');
  const [color, setColor] = useState('#FFD700');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: membership } = await supabase
      .from('family_members')
      .select('family_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      setLoading(false);
      return;
    }

    setFamilyId(membership.family_id);
    setIsAdmin(membership.role === 'admin');

    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('family_id', membership.family_id)
      .order('type')
      .order('name');

    if (data) setCategories(data);

    // Load budgets
    const { data: budgetData } = await supabase
      .from('category_budgets')
      .select('*')
      .eq('family_id', membership.family_id);

    if (budgetData) setBudgets(budgetData);

    // Load current month spending per category
    const { start, end } = getMonthRange();
    const { data: txs } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('family_id', membership.family_id)
      .eq('type', 'expense')
      .gte('date', start)
      .lte('date', end);

    if (txs) {
      const spendMap: Record<string, number> = {};
      txs.forEach((t) => {
        if (t.category_id) {
          spendMap[t.category_id] = (spendMap[t.category_id] || 0) + Number(t.amount);
        }
      });
      setSpending(spendMap);
    }

    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setName('');
    setType('expense');
    setIcon('circle');
    setColor('#FFD700');
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setType(cat.type);
    setIcon(cat.icon);
    setColor(cat.color);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    if (editing) {
      await supabase
        .from('categories')
        .update({ name, type, icon, color })
        .eq('id', editing.id);
    } else {
      await supabase
        .from('categories')
        .insert({ family_id: familyId, name, type, icon, color });
    }

    setModalOpen(false);
    setSaving(false);
    loadCategories();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from('categories').delete().eq('id', id);
    setDeleteConfirm(null);
    loadCategories();
  }

  function openBudgetModal(categoryId: string) {
    const existing = budgets.find((b) => b.category_id === categoryId);
    setBudgetCategoryId(categoryId);
    setBudgetCents(existing ? Math.round(Number(existing.monthly_limit) * 100) : 0);
    setBudgetModalOpen(true);
  }

  async function handleSaveBudget(e: React.FormEvent) {
    e.preventDefault();
    setSavingBudget(true);
    const supabase = createClient();

    if (budgetCents === 0) {
      // Remove budget
      await supabase
        .from('category_budgets')
        .delete()
        .eq('family_id', familyId)
        .eq('category_id', budgetCategoryId);
    } else {
      await supabase.from('category_budgets').upsert(
        {
          family_id: familyId,
          category_id: budgetCategoryId,
          monthly_limit: budgetCents / 100,
        },
        { onConflict: 'family_id,category_id' }
      );
    }

    setBudgetModalOpen(false);
    setSavingBudget(false);
    loadCategories();
  }

  function getBudgetForCategory(catId: string) {
    return budgets.find((b) => b.category_id === catId);
  }

  function getBudgetPercent(catId: string): number {
    const budget = getBudgetForCategory(catId);
    if (!budget) return 0;
    const spent = spending[catId] || 0;
    return (spent / Number(budget.monthly_limit)) * 100;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button onClick={openCreate} size="sm">
          <Plus size={18} />
          Nova categoria
        </Button>
      </div>

      {/* Income categories */}
      <h2 className="text-sm font-medium text-muted mb-3">Receitas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {incomeCategories.map((cat) => {
          const IconComp = getIconComponent(cat.icon);
          return (
            <Card key={cat.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  <IconComp size={20} strokeWidth={1.5} style={{ color: cat.color }} />
                </div>
                <span className="text-sm font-medium">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(cat.id)}
                  className="p-1.5 text-muted hover:text-danger transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Expense categories */}
      <h2 className="text-sm font-medium text-muted mb-3">Despesas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {expenseCategories.map((cat) => {
          const IconComp = getIconComponent(cat.icon);
          const budget = getBudgetForCategory(cat.id);
          const spent = spending[cat.id] || 0;
          const pct = budget ? (spent / Number(budget.monthly_limit)) * 100 : 0;
          return (
            <Card key={cat.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: cat.color + '20' }}
                  >
                    <IconComp size={20} strokeWidth={1.5} style={{ color: cat.color }} />
                  </div>
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <button
                      onClick={() => openBudgetModal(cat.id)}
                      className="p-1.5 text-muted hover:text-primary transition-colors cursor-pointer"
                      title="Definir orçamento"
                    >
                      <DollarSign size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 text-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(cat.id)}
                    className="p-1.5 text-muted hover:text-danger transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {budget && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted">
                      {formatCurrency(spent)} / {formatCurrency(Number(budget.monthly_limit))}
                    </span>
                    <span className={`font-medium ${pct >= 100 ? 'text-danger' : pct >= 80 ? 'text-primary' : 'text-success'}`}>
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-card-hover overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-danger' : pct >= 80 ? 'bg-primary' : 'bg-success'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar categoria' : 'Nova categoria'}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            id="cat-name"
            label="Nome"
            placeholder="Ex: Alimentação"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            id="cat-type"
            label="Tipo"
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </Select>

          {/* Icon picker */}
          <div>
            <label className="text-sm text-muted block mb-1.5">Ícone</label>
            <div className="grid grid-cols-8 gap-2">
              {ICON_OPTIONS.map((iconName) => {
                const IconComp = getIconComponent(iconName);
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      icon === iconName
                        ? 'bg-primary/20 text-primary'
                        : 'bg-card-hover text-muted hover:text-foreground'
                    }`}
                  >
                    <IconComp size={18} strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-sm text-muted block mb-1.5">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all cursor-pointer ${
                    color === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

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
        title="Excluir categoria"
      >
        <p className="text-sm text-muted mb-6">
          Tem certeza que deseja excluir esta categoria? As transações associadas ficarão sem categoria.
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

      {/* Budget Modal */}
      <Modal
        open={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        title="Orçamento mensal"
      >
        <form onSubmit={handleSaveBudget} className="flex flex-col gap-4">
          <p className="text-xs text-muted">
            Defina um limite mensal para esta categoria. Deixe zero para remover o orçamento.
          </p>
          <CurrencyInput
            id="budget-amount"
            label="Limite mensal"
            value={budgetCents}
            onChange={setBudgetCents}
          />
          <div className="flex gap-3 mt-2">
            <Button type="button" variant="secondary" onClick={() => setBudgetModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={savingBudget} className="flex-1">
              {savingBudget ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

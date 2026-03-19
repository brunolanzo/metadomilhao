'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatCurrency, formatDate, formatMonthLabel, toLocalDateString } from '@/lib/utils';
import { exportToPDF, exportToExcel } from '@/lib/export';
import { ImportModal } from '@/components/import-modal';
import { Plus, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Repeat, CreditCard, Search, FileText, FileSpreadsheet, Upload } from 'lucide-react';
import type { Category, Transaction, TransactionType, FamilyMember, Profile } from '@/types/database';

type RecurrenceMode = 'none' | 'recurring' | 'installment';

export default function TransactionsPage() {
  return (
    <Suspense>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const autoOpenDone = useRef(false);
  const [transactions, setTransactions] = useState<(Transaction & { category: Category })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState<'single' | 'all'>('single');
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Filters
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterMember, setFilterMember] = useState('all');
  const [members, setMembers] = useState<(FamilyMember & { profile: Profile })[]>([]);

  // Form state (amount in cents)
  const [amountCents, setAmountCents] = useState(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => toLocalDateString(new Date()));
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  // Recurrence / Installment state
  const [recurrenceMode, setRecurrenceMode] = useState<RecurrenceMode>('none');
  const [totalInstallments, setTotalInstallments] = useState(2);

  useEffect(() => {
    loadData();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filterSearch), 300);
    return () => clearTimeout(timer);
  }, [filterSearch]);

  useEffect(() => {
    if (familyId) loadTransactions();
  }, [filterMonth, filterType, filterCategory, debouncedSearch, filterMember, familyId]);

  // Auto-open create modal when coming from dashboard with ?new=1
  useEffect(() => {
    if (searchParams.get('new') === '1' && !autoOpenDone.current && categories.length > 0) {
      autoOpenDone.current = true;
      openCreate();
    }
  }, [categories, searchParams]);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: membership } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      setLoading(false);
      return;
    }

    setFamilyId(membership.family_id);

    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .eq('family_id', membership.family_id)
      .order('name');

    if (cats) setCategories(cats);

    // Load family members
    const { data: membersData } = await supabase
      .from('family_members')
      .select('*, profile:profiles(*)')
      .eq('family_id', membership.family_id)
      .order('created_at');

    if (membersData) setMembers(membersData as (FamilyMember & { profile: Profile })[]);
  }

  async function loadTransactions() {
    setLoading(true);
    const supabase = createClient();

    const [year, month] = filterMonth.split('-').map(Number);
    const start = toLocalDateString(new Date(year, month - 1, 1));
    const end = toLocalDateString(new Date(year, month, 0));

    let query = supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('family_id', familyId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filterType !== 'all') {
      query = query.eq('type', filterType);
    }

    if (filterCategory !== 'all') {
      query = query.eq('category_id', filterCategory);
    }

    if (debouncedSearch) {
      query = query.ilike('description', `%${debouncedSearch}%`);
    }

    if (filterMember !== 'all') {
      query = query.eq('user_id', filterMember);
    }

    const { data } = await query;
    if (data) setTransactions(data);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setAmountCents(0);
    setDescription('');
    setDate(toLocalDateString(new Date()));
    setType('expense');
    setCategoryId(categories.find((c) => c.type === 'expense')?.id || '');
    setRecurrenceMode('none');
    setTotalInstallments(2);
    setModalOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditing(t);
    setAmountCents(Math.round(Number(t.amount) * 100));
    setDescription(t.description);
    setDate(t.date.substring(0, 10));
    setType(t.type);
    setCategoryId(t.category_id);
    // Determine recurrence mode from existing data
    if (t.is_recurring) {
      setRecurrenceMode('recurring');
    } else if (t.total_installments && t.total_installments > 1) {
      setRecurrenceMode('installment');
      setTotalInstallments(t.total_installments);
    } else {
      setRecurrenceMode('none');
    }
    setModalOpen(true);
  }

  function addMonths(dateStr: string, months: number): string {
    const d = new Date(dateStr + 'T12:00:00');
    d.setMonth(d.getMonth() + months);
    return toLocalDateString(d);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const basePayload = {
      family_id: familyId,
      category_id: categoryId || null,
      user_id: user.id,
      amount: amountCents / 100,
      description,
      date,
      type,
    };

    if (editing) {
      // Simple update (only this transaction)
      await supabase
        .from('transactions')
        .update({ ...basePayload, is_recurring: recurrenceMode === 'recurring' })
        .eq('id', editing.id);
    } else {
      // New transaction
      if (recurrenceMode === 'recurring') {
        // Create current + 11 future months
        const { data: main } = await supabase
          .from('transactions')
          .insert({
            ...basePayload,
            is_recurring: true,
            is_provisional: false,
          })
          .select()
          .single();

        if (main) {
          const futureTransactions = [];
          for (let i = 1; i <= 11; i++) {
            futureTransactions.push({
              ...basePayload,
              date: addMonths(date, i),
              is_recurring: true,
              is_provisional: true,
              recurring_id: main.id,
            });
          }
          await supabase.from('transactions').insert(futureTransactions);
        }
      } else if (recurrenceMode === 'installment') {
        // Create N installments
        const { data: main } = await supabase
          .from('transactions')
          .insert({
            ...basePayload,
            installment_number: 1,
            total_installments: totalInstallments,
            is_provisional: false,
          })
          .select()
          .single();

        if (main) {
          const installments = [];
          for (let i = 2; i <= totalInstallments; i++) {
            installments.push({
              ...basePayload,
              date: addMonths(date, i - 1),
              installment_number: i,
              total_installments: totalInstallments,
              parent_id: main.id,
              is_provisional: true,
            });
          }
          await supabase.from('transactions').insert(installments);
        }
      } else {
        // Simple transaction
        await supabase.from('transactions').insert(basePayload);
      }
    }

    setModalOpen(false);
    setSaving(false);
    loadTransactions();
  }

  async function handleDelete(id: string, mode: 'single' | 'all') {
    const supabase = createClient();
    const tx = transactions.find((t) => t.id === id);

    if (mode === 'all' && tx) {
      // Delete all related recurring/installment transactions
      if (tx.is_recurring) {
        const recurringId = tx.recurring_id || tx.id;
        // Delete children
        await supabase.from('transactions').delete().eq('recurring_id', recurringId);
        // Delete parent
        await supabase.from('transactions').delete().eq('id', recurringId);
      } else if (tx.total_installments) {
        const parentId = tx.parent_id || tx.id;
        // Delete children
        await supabase.from('transactions').delete().eq('parent_id', parentId);
        // Delete parent
        await supabase.from('transactions').delete().eq('id', parentId);
      }
    } else {
      await supabase.from('transactions').delete().eq('id', id);
    }

    setDeleteConfirm(null);
    loadTransactions();
  }

  function getTransactionBadge(t: Transaction) {
    if (t.is_recurring) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
          <Repeat size={10} strokeWidth={1.5} />
          Recorrente
        </span>
      );
    }
    if (t.total_installments && t.total_installments > 1) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
          <CreditCard size={10} strokeWidth={1.5} />
          Parcela {t.installment_number}/{t.total_installments}
        </span>
      );
    }
    return null;
  }

  const filteredCategories = categories.filter((c) => c.type === type);

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Check if a transaction is part of a series (for delete modal)
  function isSeriesTransaction(id: string): boolean {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return false;
    return tx.is_recurring || (!!tx.total_installments && tx.total_installments > 1);
  }

  function handleExportPDF() {
    exportToPDF(transactions, {
      dateRange: formatMonthLabel(filterMonth),
      totalIncome,
      totalExpense,
    });
  }

  function handleExportExcel() {
    exportToExcel(transactions, {
      dateRange: formatMonthLabel(filterMonth),
      totalIncome,
      totalExpense,
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Transações</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
            title="Exportar PDF"
          >
            <FileText size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={handleExportExcel}
            className="p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
            title="Exportar Excel"
          >
            <FileSpreadsheet size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
            title="Importar extrato"
          >
            <Upload size={18} strokeWidth={1.5} />
          </button>
          <Button onClick={openCreate} size="sm">
            <Plus size={18} />
            <span className="hidden sm:inline">Nova transação</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative w-full sm:w-52">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Buscar..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>
        <Input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="w-full sm:w-44"
        />
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | TransactionType)}
          className="w-full sm:w-40"
        >
          <option value="all">Todos os tipos</option>
          <option value="income">Receitas</option>
          <option value="expense">Despesas</option>
        </Select>
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full sm:w-48"
        >
          <option value="all">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        {members.length > 1 && (
          <Select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="w-full sm:w-44"
          >
            <option value="all">Todos os membros</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.profile?.name || m.profile?.email || 'Sem nome'}
              </option>
            ))}
          </Select>
        )}
      </div>

      {/* Summary */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <ArrowUpCircle size={16} className="text-success" strokeWidth={1.5} />
          <span className="text-muted">Receitas:</span>
          <span className="font-semibold text-success">{formatCurrency(totalIncome)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <ArrowDownCircle size={16} className="text-danger" strokeWidth={1.5} />
          <span className="text-muted">Despesas:</span>
          <span className="font-semibold text-danger">{formatCurrency(totalExpense)}</span>
        </div>
      </div>

      {/* Transactions list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
        {/* Desktop table */}
        <Card className="p-0 overflow-hidden hidden md:block">
          {transactions.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted font-medium px-6 py-3">Data</th>
                  <th className="text-left text-xs text-muted font-medium px-6 py-3">Descrição</th>
                  <th className="text-left text-xs text-muted font-medium px-6 py-3">Categoria</th>
                  <th className="text-right text-xs text-muted font-medium px-6 py-3">Valor</th>
                  <th className="text-right text-xs text-muted font-medium px-6 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className={`border-b border-border last:border-0 hover:bg-card-hover transition-colors ${
                      t.is_provisional ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-6 py-3 text-sm">{formatDate(t.date)}</td>
                    <td className="px-6 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">{t.description || '-'}</span>
                        {getTransactionBadge(t)}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {t.category ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: t.category.color + '20',
                            color: t.category.color,
                          }}
                        >
                          {t.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">-</span>
                      )}
                    </td>
                    <td className={`px-6 py-3 text-sm text-right font-semibold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(Number(t.amount))}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 text-muted hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirm(t.id);
                            setDeleteMode('single');
                          }}
                          className="p-1.5 text-muted hover:text-danger transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted text-center py-12">Nenhuma transação encontrada</p>
          )}
        </Card>

        {/* Mobile cards */}
        <div className="md:hidden flex flex-col gap-3">
          {transactions.length > 0 ? (
            transactions.map((t) => (
              <Card
                key={t.id}
                className={`p-4 ${t.is_provisional ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{t.description || '-'}</span>
                    <span className="text-xs text-muted">{formatDate(t.date)}</span>
                    {getTransactionBadge(t)}
                  </div>
                  <span
                    className={`text-sm font-semibold whitespace-nowrap ${t.type === 'income' ? 'text-success' : 'text-danger'}`}
                  >
                    {t.type === 'income' ? '+' : '-'} {formatCurrency(Number(t.amount))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  {t.category ? (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: t.category.color + '20',
                        color: t.category.color,
                      }}
                    >
                      {t.category.name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">Sem categoria</span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(t)}
                      className="p-1.5 text-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirm(t.id);
                        setDeleteMode('single');
                      }}
                      className="p-1.5 text-muted hover:text-danger transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted text-center py-12">Nenhuma transação encontrada</p>
          )}
        </div>
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar transação' : 'Nova transação'}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategoryId(categories.find((c) => c.type === 'expense')?.id || '');
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                type === 'expense'
                  ? 'bg-danger/10 text-danger'
                  : 'bg-card text-muted hover:text-foreground'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategoryId(categories.find((c) => c.type === 'income')?.id || '');
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                type === 'income'
                  ? 'bg-success/10 text-success'
                  : 'bg-card text-muted hover:text-foreground'
              }`}
            >
              Receita
            </button>
          </div>

          <CurrencyInput
            id="amount"
            label="Valor"
            value={amountCents}
            onChange={setAmountCents}
            required
          />

          <Input
            id="description"
            label="Descrição"
            placeholder="Ex: Compras no mercado"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Select
            id="category"
            label="Categoria"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Sem categoria</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Input
            id="date"
            label="Data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          {/* Recurrence / Installment toggle - only for new transactions */}
          {!editing && (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-foreground">Repetição</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRecurrenceMode('none')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    recurrenceMode === 'none'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-card text-muted hover:text-foreground'
                  }`}
                >
                  Única
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrenceMode('recurring')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    recurrenceMode === 'recurring'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-card text-muted hover:text-foreground'
                  }`}
                >
                  <Repeat size={12} strokeWidth={1.5} />
                  Recorrente
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrenceMode('installment')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    recurrenceMode === 'installment'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-card text-muted hover:text-foreground'
                  }`}
                >
                  <CreditCard size={12} strokeWidth={1.5} />
                  Parcelado
                </button>
              </div>

              {recurrenceMode === 'recurring' && (
                <p className="text-xs text-muted">
                  Será criada automaticamente nos próximos 11 meses (total 12 meses).
                  As transações futuras ficam provisórias e podem ser editadas individualmente.
                </p>
              )}

              {recurrenceMode === 'installment' && (
                <div className="flex flex-col gap-2">
                  <Input
                    id="installments"
                    label="Número de parcelas"
                    type="number"
                    min={2}
                    max={48}
                    value={totalInstallments.toString()}
                    onChange={(e) => setTotalInstallments(Math.max(2, Math.min(48, parseInt(e.target.value) || 2)))}
                    required
                  />
                  <p className="text-xs text-muted">
                    Valor de cada parcela: {formatCurrency(amountCents / 100)}.
                    Total: {formatCurrency((amountCents / 100) * totalInstallments)}.
                  </p>
                </div>
              )}
            </div>
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
        title="Excluir transação"
      >
        {deleteConfirm && isSeriesTransaction(deleteConfirm) ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              Esta transação faz parte de uma série. O que deseja fazer?
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="danger"
                onClick={() => handleDelete(deleteConfirm, 'single')}
                className="w-full"
              >
                Excluir somente esta
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(deleteConfirm, 'all')}
                className="w-full"
              >
                Excluir toda a série
              </Button>
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirm(null)}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted mb-6">
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">
                Cancelar
              </Button>
              <Button variant="danger" onClick={() => handleDelete(deleteConfirm!, 'single')} className="flex-1">
                Excluir
              </Button>
            </div>
          </>
        )}
      </Modal>

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        categories={categories}
        familyId={familyId}
        onImported={loadTransactions}
      />
    </div>
  );
}

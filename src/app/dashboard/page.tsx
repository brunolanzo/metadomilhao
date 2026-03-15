'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate, getMonthRange, toLocalDateString } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, ArrowLeftRight, CalendarDays, PiggyBank, Target, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import type { Transaction, Category, Goal, CategoryBudget } from '@/types/database';

interface BudgetAlert {
  categoryName: string;
  color: string;
  spent: number;
  limit: number;
  percent: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export default function DashboardPage() {
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [yearIncome, setYearIncome] = useState(0);
  const [yearExpense, setYearExpense] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<(Transaction & { category: Category })[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [prevIncome, setPrevIncome] = useState(0);
  const [prevExpense, setPrevExpense] = useState(0);
  const [wealthData, setWealthData] = useState<{ month: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const supabase = createClient();
    const { start, end } = getMonthRange();

    // Get user's family
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

    const familyId = membership.family_id;

    // Current month transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('family_id', familyId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });

    if (transactions) {
      const inc = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const exp = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      setIncome(inc);
      setExpense(exp);
      setRecentTransactions(transactions.slice(0, 5));

      // Category breakdown (expenses only)
      const catMap = new Map<string, { name: string; value: number; color: string }>();
      transactions
        .filter((t) => t.type === 'expense' && t.category)
        .forEach((t) => {
          const key = t.category.id;
          const existing = catMap.get(key);
          if (existing) {
            existing.value += Number(t.amount);
          } else {
            catMap.set(key, {
              name: t.category.name,
              value: Number(t.amount),
              color: t.category.color,
            });
          }
        });
      setCategoryData(Array.from(catMap.values()));
    }

    // Year data (Jan 1 to Dec 31 of current year)
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;

    const { data: yearTransactions } = await supabase
      .from('transactions')
      .select('amount, type, date')
      .eq('family_id', familyId)
      .gte('date', yearStart)
      .lte('date', yearEnd);

    if (yearTransactions) {
      const yInc = yearTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const yExp = yearTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      setYearIncome(yInc);
      setYearExpense(yExp);

      // Build monthly data from year transactions (covers 6-month chart)
      const monthMap = new Map<string, MonthlyData>();
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(key, { month: monthNames[d.getMonth()], income: 0, expense: 0 });
      }

      yearTransactions.forEach((t) => {
        const key = t.date.substring(0, 7);
        const entry = monthMap.get(key);
        if (entry) {
          if (t.type === 'income') entry.income += Number(t.amount);
          else entry.expense += Number(t.amount);
        }
      });

      setMonthlyData(Array.from(monthMap.values()));

      // Build cumulative wealth evolution from monthly data
      let cumulative = 0;
      const wealth = Array.from(monthMap.entries()).map(([, data]) => {
        cumulative += data.income - data.expense;
        return { month: data.month, value: cumulative };
      });
      setWealthData(wealth);
    }

    // Load previous month data for comparison
    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevStart = toLocalDateString(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1));
    const prevEnd = toLocalDateString(new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0));

    const { data: prevTxs } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('family_id', familyId)
      .gte('date', prevStart)
      .lte('date', prevEnd);

    if (prevTxs) {
      setPrevIncome(prevTxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0));
      setPrevExpense(prevTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0));
    }

    // Load current month's goal
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const { data: goalData } = await supabase
      .from('goals')
      .select('*')
      .eq('family_id', familyId)
      .eq('month', currentMonth)
      .maybeSingle();

    if (goalData) setCurrentGoal(goalData);

    // Load budget alerts
    const { data: budgetsData } = await supabase
      .from('category_budgets')
      .select('*, category:categories(*)')
      .eq('family_id', familyId);

    if (budgetsData && transactions) {
      const spendMap: Record<string, number> = {};
      transactions
        .filter((t) => t.type === 'expense' && t.category_id)
        .forEach((t) => {
          spendMap[t.category_id] = (spendMap[t.category_id] || 0) + Number(t.amount);
        });

      const alerts: BudgetAlert[] = budgetsData
        .map((b: CategoryBudget & { category: Category }) => {
          const spent = spendMap[b.category_id] || 0;
          const pct = (spent / Number(b.monthly_limit)) * 100;
          return {
            categoryName: b.category?.name || '',
            color: b.category?.color || '#FFD700',
            spent,
            limit: Number(b.monthly_limit),
            percent: pct,
          };
        })
        .filter((a) => a.percent >= 80)
        .sort((a, b) => b.percent - a.percent);

      setBudgetAlerts(alerts);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const balance = income - expense;
  const prevBalance = prevIncome - prevExpense;
  const savingsMonth = income > 0 ? ((income - expense) / income) * 100 : 0;
  const savingsYear = yearIncome > 0 ? ((yearIncome - yearExpense) / yearIncome) * 100 : 0;

  function compareLabel(current: number, previous: number): React.ReactNode {
    if (previous === 0) return null;
    const diff = ((current - previous) / previous) * 100;
    const isUp = diff > 0;
    return (
      <span className={`text-[10px] ${isUp ? 'text-success' : 'text-danger'}`}>
        {isUp ? '+' : ''}{diff.toFixed(0)}% vs mês anterior
      </span>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Wallet size={24} className="text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm text-muted">Saldo do mês</p>
            <p className={`text-xl font-bold ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(balance)}
            </p>
            {compareLabel(balance, prevBalance)}
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
            <TrendingUp size={24} className="text-success" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm text-muted">Receitas do mês</p>
            <p className="text-xl font-bold text-success">{formatCurrency(income)}</p>
            {compareLabel(income, prevIncome)}
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-danger/10 flex items-center justify-center shrink-0">
            <TrendingDown size={24} className="text-danger" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm text-muted">Despesas do mês</p>
            <p className="text-xl font-bold text-danger">{formatCurrency(expense)}</p>
            {compareLabel(expense, prevExpense)}
          </div>
        </Card>
      </div>

      {/* Annual + Savings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
            <CalendarDays size={24} className="text-success" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm text-muted">Receita anual</p>
            <p className="text-xl font-bold text-success">{formatCurrency(yearIncome)}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-danger/10 flex items-center justify-center shrink-0">
            <CalendarDays size={24} className="text-danger" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm text-muted">Despesa anual</p>
            <p className="text-xl font-bold text-danger">{formatCurrency(yearExpense)}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <PiggyBank size={24} className="text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm text-muted">% Economia</p>
            <div className="flex items-center gap-3">
              <div>
                <span className={`text-lg font-bold ${savingsMonth >= 0 ? 'text-success' : 'text-danger'}`}>
                  {savingsMonth.toFixed(0)}%
                </span>
                <span className="text-xs text-muted ml-1">mês</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div>
                <span className={`text-lg font-bold ${savingsYear >= 0 ? 'text-success' : 'text-danger'}`}>
                  {savingsYear.toFixed(0)}%
                </span>
                <span className="text-xs text-muted ml-1">ano</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Expenses by category */}
        <Card>
          <h2 className="text-sm font-medium text-muted mb-4">Despesas por categoria</h2>
          {categoryData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    strokeWidth={0}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1">
                {categoryData.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted">{entry.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-8">Nenhuma despesa este mês</p>
          )}
        </Card>

        {/* Monthly evolution */}
        <Card>
          <h2 className="text-sm font-medium text-muted mb-4">Evolução mensal</h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                    fontSize: '12px',
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Bar dataKey="income" name="Receitas" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted text-center py-8">Sem dados ainda</p>
          )}
        </Card>
      </div>

      {/* Wealth Evolution */}
      {wealthData.length > 0 && (
        <Card className="mb-8">
          <h2 className="text-sm font-medium text-muted mb-4">Evolução patrimonial (6 meses)</h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={wealthData}>
              <defs>
                <linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px',
                  color: '#FAFAFA',
                  fontSize: '12px',
                }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Area type="monotone" dataKey="value" stroke="#FFD700" fill="url(#wealthGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Goal Widget */}
      {currentGoal && (
        <Card className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Target size={16} className="text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-medium">Meta do mês</h2>
              <p className="text-xs text-muted">Economizar {formatCurrency(Number(currentGoal.target_amount))}</p>
            </div>
            <span className={`text-lg font-bold ${balance >= 0 && balance >= Number(currentGoal.target_amount) ? 'text-success' : balance >= Number(currentGoal.target_amount) * 0.5 ? 'text-primary' : 'text-danger'}`}>
              {income > 0 ? Math.round((balance / Number(currentGoal.target_amount)) * 100) : 0}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-card-hover overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                balance >= Number(currentGoal.target_amount) ? 'bg-success' : balance >= Number(currentGoal.target_amount) * 0.5 ? 'bg-primary' : 'bg-danger'
              }`}
              style={{ width: `${Math.min(Math.max((balance / Number(currentGoal.target_amount)) * 100, 0), 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted">
            <span>Economia atual: <span className={`font-medium ${balance >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(balance)}</span></span>
            <span>Meta: {formatCurrency(Number(currentGoal.target_amount))}</span>
          </div>
        </Card>
      )}

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <Card className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-primary" strokeWidth={1.5} />
            <h2 className="text-sm font-medium">Alertas de orçamento</h2>
          </div>
          <div className="flex flex-col gap-3">
            {budgetAlerts.map((alert) => (
              <div key={alert.categoryName}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: alert.color }} />
                    <span>{alert.categoryName}</span>
                  </div>
                  <span className={`font-medium ${alert.percent >= 100 ? 'text-danger' : 'text-primary'}`}>
                    {formatCurrency(alert.spent)} / {formatCurrency(alert.limit)} ({Math.round(alert.percent)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-card-hover overflow-hidden">
                  <div
                    className={`h-full rounded-full ${alert.percent >= 100 ? 'bg-danger' : 'bg-primary'}`}
                    style={{ width: `${Math.min(alert.percent, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <h2 className="text-sm font-medium text-muted mb-4">Últimas transações</h2>
        {recentTransactions.length > 0 ? (
          <div className="flex flex-col divide-y divide-border">
            {recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: (t.category?.color || '#FFD700') + '15' }}
                  >
                    <ArrowLeftRight
                      size={18}
                      style={{ color: t.category?.color || '#FFD700' }}
                      strokeWidth={1.5}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.description || t.category?.name || 'Sem categoria'}</p>
                    <p className="text-xs text-muted">{formatDate(t.date)}</p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}
                >
                  {t.type === 'income' ? '+' : '-'} {formatCurrency(Number(t.amount))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted text-center py-8">Nenhuma transação este mês</p>
        )}
      </Card>
    </div>
  );
}

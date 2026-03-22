'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { ShieldCheck, Users, Home, ArrowLeftRight, UserPlus, Calendar, CalendarDays, Activity } from 'lucide-react';

interface Stats {
  total_users: number;
  total_families: number;
  total_transactions: number;
  new_users_today: number;
  new_users_week: number;
  new_users_month: number;
}

interface RecentUser {
  user_id: string;
  name: string;
  email: string;
  created_at: string;
  last_sign_in: string | null;
  transaction_count: number;
}

interface FamilyMember {
  user_id: string;
  name: string;
  email: string;
  transaction_count: number;
  last_sign_in: string | null;
}

interface FamilyRow {
  family_id: string;
  family_name: string;
  member_count: number;
  total_transactions: number;
  last_activity: string | null;
  created_at: string;
  members: FamilyMember[] | null;
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdmin();
  }, []);

  async function loadAdmin() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== 'admin.metadomilhao@gmail.com') {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);

    const { data: statsData, error: statsError } = await supabase.rpc('admin_get_stats');
    if (!statsError && statsData) {
      setStats(statsData as Stats);
    }

    const { data: usersData, error: usersError } = await supabase.rpc('admin_get_recent_users', { lim: 50 });
    if (!usersError && usersData) {
      setRecentUsers(usersData as RecentUser[]);
    }

    const { data: familiesData, error: familiesError } = await supabase.rpc('admin_get_families', { lim: 50 });
    if (!familiesError && familiesData) {
      setFamilies(familiesData as FamilyRow[]);
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

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ShieldCheck size={48} className="text-danger" strokeWidth={1.5} />
        <h1 className="text-xl font-bold">Acesso negado</h1>
        <p className="text-muted text-sm">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getActivityStatus(user: RecentUser) {
    if (user.transaction_count === 0) {
      return { label: 'Inativo', color: 'text-danger', bg: 'bg-danger/10' };
    }
    if (!user.last_sign_in) {
      return { label: 'Nunca logou', color: 'text-muted', bg: 'bg-border' };
    }
    const daysSinceLogin = Math.floor((Date.now() - new Date(user.last_sign_in).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLogin <= 7) {
      return { label: 'Ativo', color: 'text-success', bg: 'bg-success/10' };
    }
    if (daysSinceLogin <= 30) {
      return { label: 'Recente', color: 'text-primary', bg: 'bg-primary/10' };
    }
    return { label: 'Ausente', color: 'text-muted', bg: 'bg-border' };
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck size={28} className="text-primary" strokeWidth={1.5} />
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
      </div>

      {/* Metric Cards */}
      {stats && (
        <>
          <h2 className="text-sm font-medium text-muted mb-3">Visão geral da plataforma</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Users size={24} className="text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-muted">Total de usuários</p>
                <p className="text-xl font-bold">{stats.total_users}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <Home size={24} className="text-success" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-muted">Total de famílias</p>
                <p className="text-xl font-bold">{stats.total_families}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ArrowLeftRight size={24} className="text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-muted">Total de transações</p>
                <p className="text-xl font-bold">{stats.total_transactions}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <UserPlus size={24} className="text-success" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-muted">Novos usuários hoje</p>
                <p className="text-xl font-bold">{stats.new_users_today}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar size={24} className="text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-muted">Novos esta semana</p>
                <p className="text-xl font-bold">{stats.new_users_week}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarDays size={24} className="text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-muted">Novos este mês</p>
                <p className="text-xl font-bold">{stats.new_users_month}</p>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Users Table */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-primary" strokeWidth={1.5} />
          <h2 className="text-sm font-medium text-muted">Usuários — atividade e engajamento</h2>
        </div>
        {recentUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted">Nome</th>
                  <th className="pb-3 font-medium text-muted">Email</th>
                  <th className="pb-3 font-medium text-muted">Cadastro</th>
                  <th className="pb-3 font-medium text-muted">Último login</th>
                  <th className="pb-3 font-medium text-muted text-center">Transações</th>
                  <th className="pb-3 font-medium text-muted text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentUsers.map((u) => {
                  const status = getActivityStatus(u);
                  return (
                    <tr key={u.user_id}>
                      <td className="py-3 font-medium">{u.name}</td>
                      <td className="py-3 text-muted">{u.email}</td>
                      <td className="py-3 text-muted">{formatDateTime(u.created_at)}</td>
                      <td className="py-3 text-muted">
                        {u.last_sign_in ? formatDateTime(u.last_sign_in) : '—'}
                      </td>
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {u.transaction_count}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color} ${status.bg}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted text-center py-8">Nenhum usuário encontrado</p>
        )}
      </Card>

      {/* Families */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Home size={18} className="text-success" strokeWidth={1.5} />
          <h2 className="text-sm font-medium text-muted">Famílias — membros e atividade</h2>
        </div>
        {families.length > 0 ? (
          <div className="flex flex-col gap-6">
            {families.map((f) => (
              <div key={f.family_id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{f.family_name}</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      <Users size={12} />
                      {f.member_count} {f.member_count === 1 ? 'membro' : 'membros'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
                      <ArrowLeftRight size={12} />
                      {f.total_transactions} transações
                    </span>
                  </div>
                  <div className="text-xs text-muted">
                    Criada em {formatDateTime(f.created_at)}
                    {f.last_activity && (
                      <span className="ml-3">Última atividade: {formatDateTime(f.last_activity)}</span>
                    )}
                  </div>
                </div>
                {f.members && f.members.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 font-medium text-muted text-xs">Nome</th>
                        <th className="pb-2 font-medium text-muted text-xs">Email</th>
                        <th className="pb-2 font-medium text-muted text-xs text-center">Transações</th>
                        <th className="pb-2 font-medium text-muted text-xs">Último login</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {f.members.map((m) => (
                        <tr key={m.user_id}>
                          <td className="py-2 font-medium text-xs">{m.name}</td>
                          <td className="py-2 text-muted text-xs">{m.email}</td>
                          <td className="py-2 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              {m.transaction_count}
                            </span>
                          </td>
                          <td className="py-2 text-muted text-xs">
                            {m.last_sign_in ? formatDateTime(m.last_sign_in) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-muted">Sem membros</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted text-center py-8">Nenhuma família encontrada</p>
        )}
      </Card>
    </div>
  );
}

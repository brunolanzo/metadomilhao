'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { UserPlus, Trash2, Shield, User, Check, AlertCircle, Mail } from 'lucide-react';
import type { Family, FamilyMember, FamilyInvite, FamilyRole, Profile } from '@/types/database';

export default function FamilyPage() {
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<(FamilyMember & { profile: Profile })[]>([]);
  const [invites, setInvites] = useState<FamilyInvite[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<FamilyRole>('member');
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);

  // Family name edit
  const [familyName, setFamilyName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState('');

  // Invite modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Remove member confirm
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

  // General messages
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    loadFamily();
  }, []);

  async function loadFamily() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setCurrentUserId(user.id);

    // Get membership with role
    const { data: membership } = await supabase
      .from('family_members')
      .select('family_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      setLoading(false);
      return;
    }

    setCurrentUserRole(membership.role as FamilyRole);

    // Get family
    const { data: familyData } = await supabase
      .from('families')
      .select('*')
      .eq('id', membership.family_id)
      .single();

    if (familyData) {
      setFamily(familyData);
      setFamilyName(familyData.name);
    }

    // Get all members with profiles via SECURITY DEFINER function
    const { data: membersData } = await supabase.rpc('get_family_members');

    if (membersData) {
      const mapped = membersData.map((m: { id: string; family_id: string; user_id: string; role: string; created_at: string; profile_name: string; profile_email: string }) => ({
        id: m.id,
        family_id: m.family_id,
        user_id: m.user_id,
        role: m.role,
        created_at: m.created_at,
        profile: {
          name: m.profile_name,
          email: m.profile_email,
        },
      }));
      setMembers(mapped as (FamilyMember & { profile: Profile })[]);
    }

    // Get pending invites
    const { data: invitesData } = await supabase
      .from('family_invites')
      .select('*')
      .eq('family_id', membership.family_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (invitesData) {
      setInvites(invitesData);
    }

    setLoading(false);
  }

  async function handleSaveFamilyName(e: React.FormEvent) {
    e.preventDefault();
    if (!family) return;
    setSavingName(true);
    setNameMessage('');

    const supabase = createClient();
    const { error: err } = await supabase
      .from('families')
      .update({ name: familyName })
      .eq('id', family.id);

    if (err) {
      setNameMessage('Erro ao salvar.');
    } else {
      setNameMessage('Nome atualizado!');
      setFamily({ ...family, name: familyName });
    }

    setSavingName(false);
    setTimeout(() => setNameMessage(''), 3000);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!family) return;
    setInviting(true);
    setInviteError('');

    const email = inviteEmail.trim().toLowerCase();

    // Check if already a member
    const isMember = members.some(
      (m) => m.profile?.email?.toLowerCase() === email
    );
    if (isMember) {
      setInviteError('Este email já é membro da família.');
      setInviting(false);
      return;
    }

    // Check if already invited
    const isInvited = invites.some(
      (inv) => inv.email.toLowerCase() === email
    );
    if (isInvited) {
      setInviteError('Já existe um convite pendente para este email.');
      setInviting(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error: err } = await supabase
      .from('family_invites')
      .insert({
        family_id: family.id,
        email,
        invited_by: user!.id,
      });

    if (err) {
      setInviteError('Erro ao enviar convite. Tente novamente.');
      setInviting(false);
      return;
    }

    // Send invite email
    const currentMember = members.find((m) => m.user_id === currentUserId);
    const invitedByName = currentMember?.profile?.name || '';

    try {
      await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          familyName: family.name,
          invitedByName,
        }),
      });
    } catch {
      // Email send failed silently — invite is still saved in DB
    }

    setInviteModalOpen(false);
    setInviteEmail('');
    setMessage(`Convite enviado para ${email}!`);
    setTimeout(() => setMessage(''), 3000);
    loadFamily();

    setInviting(false);
  }

  async function handleCancelInvite(inviteId: string) {
    const supabase = createClient();
    await supabase.from('family_invites').delete().eq('id', inviteId);
    loadFamily();
  }

  async function handleRemoveMember(memberId: string) {
    const supabase = createClient();
    await supabase.from('family_members').delete().eq('id', memberId);
    setRemoveConfirm(null);
    loadFamily();
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
      <h1 className="text-2xl font-bold mb-6">Família</h1>

      {message && (
        <div className="flex items-center gap-2 text-sm text-success mb-4 p-3 rounded-lg bg-success/10">
          <Check size={16} strokeWidth={1.5} />
          {message}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-danger mb-4 p-3 rounded-lg bg-danger/10">
          <AlertCircle size={16} strokeWidth={1.5} />
          {error}
        </div>
      )}

      {/* Family Name */}
      <Card className="mb-6">
        <h2 className="text-sm font-medium text-muted mb-4">Nome da família</h2>
        <form onSubmit={handleSaveFamilyName} className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              id="family-name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              disabled={!isAdmin}
              required
            />
          </div>
          {isAdmin && (
            <Button type="submit" disabled={savingName} size="md">
              {savingName ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </form>
        {nameMessage && (
          <p className="text-xs text-success mt-2">{nameMessage}</p>
        )}
        {!isAdmin && (
          <p className="text-xs text-muted mt-2">Somente administradores podem alterar o nome.</p>
        )}
      </Card>

      {/* Members */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted">
            Membros ({members.length})
          </h2>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => {
                setInviteEmail('');
                setInviteError('');
                setInviteModalOpen(true);
              }}
            >
              <UserPlus size={16} strokeWidth={1.5} />
              <span className="hidden sm:inline">Convidar</span>
            </Button>
          )}
        </div>

        <div className="flex flex-col divide-y divide-border">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary text-sm font-semibold">
                    {getInitials(m.profile?.name || '?')}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{m.profile?.name || 'Sem nome'}</p>
                  <p className="text-xs text-muted">{m.profile?.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                    m.role === 'admin'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-card-hover text-muted'
                  }`}
                >
                  {m.role === 'admin' ? (
                    <Shield size={12} strokeWidth={1.5} />
                  ) : (
                    <User size={12} strokeWidth={1.5} />
                  )}
                  {m.role === 'admin' ? 'Admin' : 'Membro'}
                </span>
                {isAdmin && m.user_id !== currentUserId && (
                  <button
                    onClick={() => setRemoveConfirm(m.id)}
                    className="p-1.5 text-muted hover:text-danger transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pending Invites (admin only) */}
      {isAdmin && (
        <Card>
          <h2 className="text-sm font-medium text-muted mb-4">
            Convites pendentes ({invites.length})
          </h2>

          {invites.length > 0 ? (
            <div className="flex flex-col divide-y divide-border">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-card-hover flex items-center justify-center shrink-0">
                      <Mail size={16} className="text-muted" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{inv.email}</p>
                      <p className="text-xs text-muted">Enviado em {formatDate(inv.created_at)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelInvite(inv.id)}
                    className="text-xs text-muted hover:text-danger transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-6">Nenhum convite pendente</p>
          )}
        </Card>
      )}

      {/* Invite Modal */}
      <Modal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Convidar membro"
      >
        <form onSubmit={handleInvite} className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Envie um convite por email. Quando a pessoa criar uma conta ou fizer login com este email, será automaticamente adicionada à sua família.
          </p>
          <Input
            id="invite-email"
            label="Email"
            type="email"
            placeholder="email@exemplo.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          {inviteError && (
            <div className="flex items-center gap-2 text-sm text-danger">
              <AlertCircle size={16} strokeWidth={1.5} />
              {inviteError}
            </div>
          )}
          <div className="flex gap-3 mt-2">
            <Button type="button" variant="secondary" onClick={() => setInviteModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={inviting} className="flex-1">
              {inviting ? 'Enviando...' : 'Enviar convite'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove member confirmation */}
      <Modal
        open={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        title="Remover membro"
      >
        <p className="text-sm text-muted mb-6">
          Tem certeza que deseja remover este membro da família? Ele perderá acesso a todas as transações e categorias compartilhadas.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setRemoveConfirm(null)} className="flex-1">
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => handleRemoveMember(removeConfirm!)} className="flex-1">
            Remover
          </Button>
        </div>
      </Modal>
    </div>
  );
}

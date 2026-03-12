'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/lib/theme-context';
import { Check, AlertCircle, Sun, Moon } from 'lucide-react';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);

  // Profile save state
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setEmail(user.email || '');
    setUserId(user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      setName(profile.name);
    }

    setLoading(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage('');
    setProfileError('');

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('user_id', userId);

    if (error) {
      setProfileError('Erro ao salvar perfil. Tente novamente.');
    } else {
      setProfileMessage('Perfil atualizado com sucesso!');
    }

    setSavingProfile(false);
    setTimeout(() => { setProfileMessage(''); setProfileError(''); }, 3000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }

    setSavingPassword(true);

    const supabase = createClient();

    // Verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      setPasswordError('Senha atual incorreta.');
      setSavingPassword(false);
      return;
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setPasswordError('Erro ao alterar senha. Tente novamente.');
    } else {
      setPasswordMessage('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    setSavingPassword(false);
    setTimeout(() => { setPasswordMessage(''); setPasswordError(''); }, 3000);
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
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>

      {/* Profile */}
      <Card className="mb-6">
        <h2 className="text-sm font-medium text-muted mb-4">Dados do perfil</h2>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <Input
            id="name"
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <Input
              id="email"
              label="Email"
              value={email}
              disabled
            />
            <p className="text-xs text-muted mt-1">O email não pode ser alterado.</p>
          </div>

          {profileMessage && (
            <div className="flex items-center gap-2 text-sm text-success">
              <Check size={16} strokeWidth={1.5} />
              {profileMessage}
            </div>
          )}
          {profileError && (
            <div className="flex items-center gap-2 text-sm text-danger">
              <AlertCircle size={16} strokeWidth={1.5} />
              {profileError}
            </div>
          )}

          <Button type="submit" disabled={savingProfile} className="self-start">
            {savingProfile ? 'Salvando...' : 'Salvar perfil'}
          </Button>
        </form>
      </Card>

      {/* Theme */}
      <Card className="mb-6">
        <h2 className="text-sm font-medium text-muted mb-4">Aparência</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon size={20} className="text-primary" strokeWidth={1.5} />
            ) : (
              <Sun size={20} className="text-primary" strokeWidth={1.5} />
            )}
            <div>
              <p className="text-sm font-medium">{theme === 'dark' ? 'Tema escuro' : 'Tema claro'}</p>
              <p className="text-xs text-muted">Alternar entre modo escuro e claro</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
              theme === 'light' ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${
                theme === 'light' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Change Password */}
      <Card>
        <h2 className="text-sm font-medium text-muted mb-4">Alterar senha</h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <Input
            id="current-password"
            label="Senha atual"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            id="new-password"
            label="Nova senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            id="confirm-password"
            label="Confirmar nova senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {passwordMessage && (
            <div className="flex items-center gap-2 text-sm text-success">
              <Check size={16} strokeWidth={1.5} />
              {passwordMessage}
            </div>
          )}
          {passwordError && (
            <div className="flex items-center gap-2 text-sm text-danger">
              <AlertCircle size={16} strokeWidth={1.5} />
              {passwordError}
            </div>
          )}

          <Button type="submit" disabled={savingPassword} className="self-start">
            {savingPassword ? 'Alterando...' : 'Alterar senha'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

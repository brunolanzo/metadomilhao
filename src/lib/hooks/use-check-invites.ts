'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useCheckInvites() {
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    checkPendingInvites();
  }, []);

  async function checkPendingInvites() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;

    // Call the SECURITY DEFINER function that handles everything atomically
    const { data: familyName, error } = await supabase.rpc('accept_pending_invite');

    if (error) {
      console.error('Error accepting invite:', error);
      return;
    }

    if (familyName) {
      setInviteMessage(`Você foi adicionado à família "${familyName}"!`);
      setTimeout(() => setInviteMessage(''), 5000);
      window.location.reload();
    }
  }

  return { inviteMessage };
}

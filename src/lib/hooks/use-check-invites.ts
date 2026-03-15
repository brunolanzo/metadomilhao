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

    // Check for pending invites for this user's email
    const { data: invites, error: invitesError } = await supabase
      .from('family_invites')
      .select('*, family:families(name)')
      .eq('email', user.email)
      .eq('status', 'pending');

    if (invitesError) {
      console.error('Error fetching invites:', invitesError);
      return;
    }

    if (!invites || invites.length === 0) return;

    // Accept the first pending invite
    const invite = invites[0];

    // Check if user already has a family membership beyond the auto-created one
    const { data: memberships } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id);

    // If user has only 1 membership (the auto-created one), accept the invite
    // and move them to the inviting family
    if (memberships && memberships.length <= 1) {
      // Remove from current auto-created family
      if (memberships && memberships.length === 1) {
        const { error: deleteError } = await supabase
          .from('family_members')
          .delete()
          .eq('family_id', memberships[0].family_id)
          .eq('user_id', user.id);

        if (deleteError) {
          console.error('Error leaving auto-family:', deleteError);
          return;
        }
      }

      // Add to the inviting family
      const { error: insertError } = await supabase
        .from('family_members')
        .insert({
          family_id: invite.family_id,
          user_id: user.id,
          role: 'member',
        });

      if (insertError) {
        console.error('Error joining invited family:', insertError);
        return;
      }

      // Mark invite as accepted
      const { error: updateError } = await supabase
        .from('family_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      if (updateError) {
        console.error('Error marking invite as accepted:', updateError);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const familyName = (invite as any).family?.name || 'uma família';
      setInviteMessage(`Você foi adicionado à família "${familyName}"!`);

      // Clear message after 5 seconds
      setTimeout(() => setInviteMessage(''), 5000);

      // Reload the page to reflect new family data
      window.location.reload();
    }
  }

  return { inviteMessage };
}

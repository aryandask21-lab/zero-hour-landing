import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TeamInvite {
  id: string;
  team_id: string;
  invited_user_id: string;
  invited_by: string;
  status: string;
  message: string | null;
  created_at: string;
  expires_at: string;
  team?: { id: string; name: string; tag: string | null; logo_url: string | null };
  inviter?: { username: string };
}

export function useTeamInvites() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setInvites([]);
      setCount(0);
      setLoading(false);
      return;
    }

    const fetchInvites = async () => {
      const { data, error } = await supabase
        .from('team_invites')
        .select(`
          *,
          team:teams(id, name, tag, logo_url)
        `)
        .eq('invited_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Enrich with inviter data
        const enrichedInvites: TeamInvite[] = [];
        for (const invite of data) {
          const { data: inviterData } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", invite.invited_by)
            .maybeSingle();
          
          enrichedInvites.push({
            ...invite,
            inviter: inviterData || undefined,
          } as TeamInvite);
        }
        setInvites(enrichedInvites);
        setCount(enrichedInvites.length);
      }
      setLoading(false);
    };

    fetchInvites();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`team_invites_hook_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_invites',
          filter: `invited_user_id=eq.${user.id}`,
        },
        () => {
          fetchInvites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const acceptInvite = async (inviteId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const invite = invites.find(i => i.id === inviteId);
    if (!invite) return { error: new Error('Invite not found') };

    // Update invite status
    const { error: updateError } = await supabase
      .from('team_invites')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString()
      })
      .eq('id', inviteId);

    if (updateError) return { error: updateError };

    // Add to team members
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: invite.team_id,
        user_id: user.id,
        role: 'member',
        invited_by: invite.invited_by
      });

    if (memberError) return { error: memberError };

    // Update local state
    setInvites(prev => prev.filter(i => i.id !== inviteId));
    setCount(prev => prev - 1);

    return { error: null };
  };

  const declineInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from('team_invites')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString()
      })
      .eq('id', inviteId);

    if (!error) {
      setInvites(prev => prev.filter(i => i.id !== inviteId));
      setCount(prev => prev - 1);
    }

    return { error };
  };

  return {
    invites,
    count,
    loading,
    acceptInvite,
    declineInvite,
  };
}

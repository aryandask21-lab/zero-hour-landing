import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { AppRole } from '@/types/esports';

export function useRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    let active = true;
    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (!active) return;
      if (!error && data) {
        setRoles(data.map(r => r.role as AppRole));
      }
      setLoading(false);
    };

    fetchRoles();

    // Refetch when tab regains focus (e.g. after admin promotes via DB)
    const onFocus = () => fetchRoles();
    window.addEventListener('focus', onFocus);

    // Realtime: react to role grants/revokes for this user
    const channel = supabase
      .channel(`user_roles:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles', filter: `user_id=eq.${user.id}` },
        () => fetchRoles()
      )
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener('focus', onFocus);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = () => hasRole('admin');
  const isOrganizer = () => hasRole('organizer') || isAdmin();
  const isTeamLeader = () => hasRole('team_leader') || isAdmin();
  const isPlayer = () => roles.length > 0;

  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isOrganizer,
    isTeamLeader,
    isPlayer,
  };
}

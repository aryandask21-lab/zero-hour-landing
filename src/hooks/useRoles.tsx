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

    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (!error && data) {
        setRoles(data.map(r => r.role as AppRole));
      }
      setLoading(false);
    };

    fetchRoles();
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

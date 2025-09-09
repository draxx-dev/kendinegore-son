import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StaffSession {
  staff: {
    id: string;
    name: string;
    email: string;
    business_id: string;
    business_name: string;
  };
  loginTime: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export const useStaffPermissions = () => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffSession, setStaffSession] = useState<StaffSession | null>(null);

  useEffect(() => {
    const sessionData = localStorage.getItem('staff_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setStaffSession(session);
      fetchPermissions(session.staff.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = async (staffId: string) => {
    try {
      const { data, error } = await supabase
        .from('staff_role_assignments')
        .select(`
          staff_permissions!inner (
            name
          )
        `)
        .eq('staff_id', staffId);

      if (error) throw error;

      const permissionNames = data?.map(item => 
        item.staff_permissions.name
      ) || [];

      setPermissions(permissionNames);
    } catch (error) {
      console.error('Error fetching staff permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => permissions.includes(permission));
  };

  return {
    permissions,
    loading,
    staffSession,
    hasPermission,
    hasAnyPermission,
  };
};
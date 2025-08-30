import React from 'react';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock } from 'lucide-react';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permission, 
  children, 
  fallback 
}) => {
  const { hasPermission, loading } = useStaffPermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return fallback || (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Erişim Engellendi
              </h3>
              <p className="text-muted-foreground">
                Bu işlem için yetkiniz bulunmamaktadır. Lütfen işletme yöneticinizle iletişime geçin.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
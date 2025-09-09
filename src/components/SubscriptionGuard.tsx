import { ReactNode } from 'react';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubscriptionGuardProps {
  children: ReactNode;
  businessId?: string;
  fallback?: ReactNode;
}

export const SubscriptionGuard = ({ children, businessId, fallback }: SubscriptionGuardProps) => {
  const { hasAccess, loading, isExpired } = useSubscriptionStatus(businessId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!hasAccess && isExpired) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex justify-center items-center min-h-[400px] p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-700">Aboneliğinizin Süresi Dolmuş</CardTitle>
            <CardDescription>
              Hizmetlerimize devam edebilmek için lütfen abonelik paketinizi yenileyin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              <p>Mevcut verileriniz korunmuştur.</p>
              <p>Paket aldığınızda tüm özellikler tekrar aktif olacaktır.</p>
            </div>
            <Button asChild className="w-full">
              <Link to="/dashboard/system-payments">
                <CreditCard className="h-4 w-4 mr-2" />
                Paket Al
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

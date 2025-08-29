import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, User, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  payment_date?: string;
  expected_payment_date?: string;
  notes?: string;
  appointments: {
    appointment_date: string;
    start_time: string;
    customers: {
      first_name: string;
      last_name: string;
    };
    services: {
      name: string;
    };
  };
}

const StaffPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const staffSession = localStorage.getItem('staff_session');
      if (!staffSession) return;

      const session = JSON.parse(staffSession);
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          appointments!inner (
            appointment_date,
            start_time,
            staff_id,
            customers (first_name, last_name),
            services (name)
          )
        `)
        .eq('appointments.staff_id', session.staff.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Hata",
        description: "Ödemeler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'pending':
        return 'Bekliyor';
      case 'cancelled':
        return 'İptal Edildi';
      case 'refunded':
        return 'İade Edildi';
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Nakit';
      case 'credit_card':
        return 'Kredi Kartı';
      case 'debit_card':
        return 'Banka Kartı';
      case 'bank_transfer':
        return 'Havale';
      default:
        return method;
    }
  };

  const totalAmount = payments
    .filter(p => p.payment_status === 'completed')
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const pendingAmount = payments
    .filter(p => p.payment_status === 'pending')
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Ödemelerim
        </h1>
        <p className="text-muted-foreground">
          Randevularınıza ait ödeme bilgilerini görüntüleyin.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Toplam Gelir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₺{totalAmount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Bekleyen Ödemeler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">₺{pendingAmount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Toplam İşlem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Henüz ödeme kaydı bulunmuyor.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    ₺{payment.amount}
                  </CardTitle>
                  <Badge className={getStatusColor(payment.payment_status)}>
                    {getStatusText(payment.payment_status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {payment.appointments.customers.first_name} {payment.appointments.customers.last_name}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(payment.appointments.appointment_date), 'dd MMMM yyyy', { locale: tr })} - {payment.appointments.start_time}
                    </div>
                    <div className="text-sm">
                      <strong>Hizmet:</strong> {payment.appointments.services.name}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {getPaymentMethodText(payment.payment_method)}
                    </div>
                    {payment.payment_date && (
                      <div className="text-sm">
                        <strong>Ödeme Tarihi:</strong> {format(new Date(payment.payment_date), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                      </div>
                    )}
                    {payment.expected_payment_date && !payment.payment_date && (
                      <div className="text-sm">
                        <strong>Beklenen Tarih:</strong> {format(new Date(payment.expected_payment_date), 'dd MMMM yyyy', { locale: tr })}
                      </div>
                    )}
                  </div>
                </div>
                {payment.notes && (
                  <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Notlar:</strong> {payment.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffPayments;
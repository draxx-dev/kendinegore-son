import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Download,
  Filter,
  Plus,
  Receipt
} from "lucide-react";
import { CreateExpenseModal } from "@/components/expenses/CreateExpenseModal";

interface PaymentSummary {
  total_amount: number;
  cash_amount: number;
  card_amount: number;
  credit_amount: number;
  completed_count: number;
  pending_count: number;
}

interface CustomerDebt {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  total_debt: number;
  appointment_count: number;
}

const Payments = () => {
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    total_amount: 0,
    cash_amount: 0,
    card_amount: 0,
    credit_amount: 0,
    completed_count: 0,
    pending_count: 0
  });
  const [customerDebts, setCustomerDebts] = useState<CustomerDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentData();
    fetchCustomerDebts();
    fetchExpenses();
  }, [selectedDate, dateRange]);

  const getDateRange = () => {
    const today = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(selectedDate);
        return {
          start: startDate.toISOString().split('T')[0],
          end: startDate.toISOString().split('T')[0]
        };
      case 'week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          start: startDate.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'month':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
          start: startDate.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      default:
        return {
          start: selectedDate,
          end: selectedDate
        };
    }
  };

  const fetchPaymentData = async () => {
    try {
      const { start, end } = getDateRange();
      
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          amount,
          payment_method,
          payment_status,
          appointments!inner(appointment_date)
        `)
        .gte('appointments.appointment_date', start)
        .lte('appointments.appointment_date', end);

      if (error) throw error;

      const summary = payments.reduce((acc, payment) => {
        const amount = Number(payment.amount);
        acc.total_amount += amount;

        if (payment.payment_status === 'completed') {
          acc.completed_count++;
          switch (payment.payment_method) {
            case 'cash':
              acc.cash_amount += amount;
              break;
            case 'card':
              acc.card_amount += amount;
              break;
            case 'credit':
              acc.credit_amount += amount;
              break;
          }
        } else {
          acc.pending_count++;
        }

        return acc;
      }, {
        total_amount: 0,
        cash_amount: 0,
        card_amount: 0,
        credit_amount: 0,
        completed_count: 0,
        pending_count: 0
      });

      setPaymentSummary(summary);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ödeme verileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDebts = async () => {
    try {
      const { data: creditPayments, error } = await supabase
        .from('payments')
        .select(`
          amount,
          payment_status,
          appointments!inner(
            customers!inner(id, first_name, last_name, phone)
          )
        `)
        .eq('payment_method', 'credit')
        .eq('payment_status', 'pending');

      if (error) throw error;

      const debtsMap = new Map<string, CustomerDebt>();

      creditPayments.forEach(payment => {
        const customer = payment.appointments.customers;
        const customerId = customer.id;
        
        if (debtsMap.has(customerId)) {
          const existing = debtsMap.get(customerId)!;
          existing.total_debt += Number(payment.amount);
          existing.appointment_count++;
        } else {
          debtsMap.set(customerId, {
            customer_id: customerId,
            customer_name: `${customer.first_name} ${customer.last_name}`,
            customer_phone: customer.phone,
            total_debt: Number(payment.amount),
            appointment_count: 1
          });
        }
      });

      setCustomerDebts(Array.from(debtsMap.values()).sort((a, b) => b.total_debt - a.total_debt));
    } catch (error) {
      toast({
        title: "Hata",
        description: "Borç verileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const fetchExpenses = async () => {
    try {
      const { start, end } = getDateRange();
      
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', start)
        .lte('expense_date', end);

      if (error) throw error;

      const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      setTotalExpenses(total);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const exportReport = () => {
    toast({
      title: "Rapor Hazırlanıyor",
      description: "Excel raporu oluşturuluyor...",
    });
    // Export functionality will be implemented here
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-brand-primary" />
            Ödeme ve Finans Takibi
          </h1>
          <p className="text-muted-foreground mt-1">
            Gelir raporları ve ödeme takibi.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowExpenseModal(true)}
            variant="brand" 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Gider Ekle
          </Button>
          <Button variant="outline" onClick={exportReport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Rapor İndir
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as 'today' | 'week' | 'month')}
                className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              >
                <option value="today">Bugün</option>
                <option value="week">Son 7 Gün</option>
                <option value="month">Son 30 Gün</option>
              </select>
            </div>
            
            {dateRange === 'today' && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm font-medium">Toplam Gelir</p>
                <p className="text-3xl font-bold text-green-800">₺{paymentSummary.total_amount}</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              {paymentSummary.completed_count} tamamlandı
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm font-medium">Nakit</p>
                <p className="text-2xl font-bold text-blue-800">₺{paymentSummary.cash_amount}</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-sm text-blue-600 mt-2">
              %{paymentSummary.total_amount > 0 ? ((paymentSummary.cash_amount / paymentSummary.total_amount) * 100).toFixed(1) : 0} oranında
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm font-medium">Kart</p>
                <p className="text-2xl font-bold text-purple-800">₺{paymentSummary.card_amount}</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="text-sm text-purple-600 mt-2">
              %{paymentSummary.total_amount > 0 ? ((paymentSummary.card_amount / paymentSummary.total_amount) * 100).toFixed(1) : 0} oranında
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-700 text-sm font-medium">Veresiye</p>
                <p className="text-2xl font-bold text-orange-800">₺{paymentSummary.credit_amount}</p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm text-orange-600">
              <TrendingDown className="h-4 w-4 mr-1" />
              {paymentSummary.pending_count} bekliyor
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-700 text-sm font-medium">Toplam Gider</p>
                <p className="text-2xl font-bold text-red-800">₺{totalExpenses}</p>
              </div>
              <div className="p-3 bg-red-200 rounded-full">
                <Receipt className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="text-sm text-red-600 mt-2">
              Net Kar: ₺{paymentSummary.total_amount - totalExpenses}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Debts */}
      <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-primary" />
            Veresiye Müşteriler
          </CardTitle>
          <CardDescription>
            Ödeme bekleyen müşterilerin borç listesi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customerDebts.length > 0 ? (
            <div className="space-y-3">
              {customerDebts.map((debt) => (
                <div key={debt.customer_id} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-orange-200">
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {debt.customer_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {debt.customer_phone} • {debt.appointment_count} randevu
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600">
                      ₺{debt.total_debt}
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Borçlu
                    </Badge>
                  </div>
                  <div className="ml-4">
                    <Button size="sm" variant="outline">
                      Tahsil Et
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Veresiye borcu yok
              </h3>
              <p className="text-muted-foreground">
                Tüm ödemeler tamamlanmış durumda.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10 hover:shadow-soft transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 text-brand-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Günlük Rapor</h3>
            <p className="text-sm text-muted-foreground">
              Günlük ödeme özetini görüntüle
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10 hover:shadow-soft transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Aylık Analiz</h3>
            <p className="text-sm text-muted-foreground">
              Aylık gelir trendlerini incele
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10 hover:shadow-soft transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 text-center">
            <Download className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Vergi Raporu</h3>
            <p className="text-sm text-muted-foreground">
              Vergi beyanı için rapor al
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Expense Modal */}
      <CreateExpenseModal
        open={showExpenseModal}
        onOpenChange={setShowExpenseModal}
        onSuccess={() => {
          fetchExpenses();
          fetchPaymentData();
        }}
      />
    </div>
  );
};

export default Payments;
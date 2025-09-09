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
  Receipt,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { CreateExpenseModal } from "@/components/expenses/CreateExpenseModal";

interface PaymentSummary {
  total_amount: number;
  cash_amount: number;
  card_amount: number;
  credit_amount: number;
  completed_count: number;
  pending_count: number;
  payments: Array<{
    payment_date: string;
    customer_name: string;
    service_name: string;
    amount: number;
    payment_method: string;
    payment_status: string;
    notes: string;
  }>;
}

interface CustomerDebt {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  total_debt: number;
  appointment_count: number;
  oldest_payment_date?: string;
  expected_payment_date?: string;
  appointments?: Array<{
    id: string;
    appointment_date: string;
    start_time: string;
    service_name: string;
    staff_name: string;
    amount: number;
  }>;
}


const Payments = () => {
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    total_amount: 0,
    cash_amount: 0,
    card_amount: 0,
    credit_amount: 0,
    completed_count: 0,
    pending_count: 0,
    payments: []
  });
  const [customerDebts, setCustomerDebts] = useState<CustomerDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [debtSortBy, setDebtSortBy] = useState<'debt' | 'oldest' | 'expected'>('debt');
  const [expandedDebt, setExpandedDebt] = useState<string | null>(null);
  const [creditStats, setCreditStats] = useState({ collected: 0, pending: 0 });
  

  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentData();
    fetchCustomerDebts();
    fetchExpenses();
  }, [selectedDate, dateRange, debtSortBy]);

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
          payment_date,
          notes,
          appointments!inner(
            appointment_date,
            start_time,
            service_id,
            service_ids,
            customers(first_name, last_name)
          )
        `)
        .gte('appointments.appointment_date', start)
        .lte('appointments.appointment_date', end);

      if (error) throw error;

      // Services bilgilerini ayrı olarak çek
      const serviceIds = new Set<string>();
      payments.forEach(payment => {
        if (payment.appointments?.service_id) {
          serviceIds.add(payment.appointments.service_id);
        }
        if (payment.appointments?.service_ids) {
          payment.appointments.service_ids.forEach((id: string) => serviceIds.add(id));
        }
      });

      let servicesMap: Record<string, string> = {};
      if (serviceIds.size > 0) {
        const { data: services } = await supabase
          .from('services')
          .select('id, name')
          .in('id', Array.from(serviceIds));
        
        if (services) {
          servicesMap = services.reduce((acc, service) => {
            acc[service.id] = service.name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const summary = payments.reduce((acc, payment) => {
        const amount = Number(payment.amount);
        
        if (payment.payment_status === 'completed') {
          acc.total_amount += amount;
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
        pending_count: 0,
        payments: payments.map(payment => {
          let serviceName = '';
          if (payment.appointments?.service_id) {
            serviceName = servicesMap[payment.appointments.service_id] || `Hizmet ID: ${payment.appointments.service_id}`;
          } else if (payment.appointments?.service_ids && payment.appointments.service_ids.length > 0) {
            const serviceNames = payment.appointments.service_ids
              .map((id: string) => servicesMap[id] || `ID: ${id}`)
              .join(', ');
            serviceName = serviceNames;
          }

          return {
            payment_date: payment.payment_date || payment.appointments?.appointment_date,
            customer_name: payment.appointments?.customers ? 
              `${payment.appointments.customers.first_name} ${payment.appointments.customers.last_name}` : '',
            service_name: serviceName,
            amount: payment.amount,
            payment_method: payment.payment_method,
            payment_status: payment.payment_status,
            notes: payment.notes
          };
        })
      });

      setPaymentSummary(summary);
    } catch (error) {
      console.error('Payment data fetch error:', error);
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
      // Get credit stats
      const { data: allCreditPayments, error: statsError } = await supabase
        .from('payments')
        .select('payment_status')
        .eq('payment_method', 'credit');

      if (statsError) throw statsError;

      const collected = allCreditPayments.filter(p => p.payment_status === 'completed').length;
      const pending = allCreditPayments.filter(p => p.payment_status === 'pending').length;
      setCreditStats({ collected, pending });

      // Get pending credit payments with detailed information
      const { data: creditPayments, error } = await supabase
        .from('payments')
        .select(`
          amount,
          payment_status,
          created_at,
          expected_payment_date,
          appointments!inner(
            id,
            appointment_date,
            start_time,
            service_ids,
            customers!inner(id, first_name, last_name, phone),
            staff(name)
          )
        `)
        .eq('payment_method', 'credit')
        .eq('payment_status', 'pending');

      if (error) throw error;

      const debtsMap = new Map<string, CustomerDebt>();

      // Process each payment and fetch service details
      for (const payment of creditPayments) {
        const customer = payment.appointments.customers;
        const appointment = payment.appointments;
        const customerId = customer.id;
        
        // Fetch service details from service_ids array
        let serviceName = 'Bilinmiyor';
        if (appointment.service_ids && appointment.service_ids.length > 0) {
          const { data: services } = await supabase
            .from('services')
            .select('name')
            .in('id', appointment.service_ids);
          
          if (services && services.length > 0) {
            serviceName = services.map(s => s.name).join(', ');
          }
        }
        
        const appointmentDetail = {
          id: appointment.id,
          appointment_date: appointment.appointment_date,
          start_time: appointment.start_time,
          service_name: serviceName,
          staff_name: appointment.staff?.name || 'Belirtilmemiş',
          amount: Number(payment.amount)
        };
        
        if (debtsMap.has(customerId)) {
          const existing = debtsMap.get(customerId)!;
          existing.total_debt += Number(payment.amount);
          existing.appointment_count++;
          existing.appointments?.push(appointmentDetail);
          
          // Update oldest payment date
          if (!existing.oldest_payment_date || payment.created_at < existing.oldest_payment_date) {
            existing.oldest_payment_date = payment.created_at;
          }
          
          // Update closest expected payment date
          if (payment.expected_payment_date) {
            if (!existing.expected_payment_date || payment.expected_payment_date < existing.expected_payment_date) {
              existing.expected_payment_date = payment.expected_payment_date;
            }
          }
        } else {
          debtsMap.set(customerId, {
            customer_id: customerId,
            customer_name: `${customer.first_name} ${customer.last_name}`,
            customer_phone: customer.phone,
            total_debt: Number(payment.amount),
            appointment_count: 1,
            oldest_payment_date: payment.created_at,
            expected_payment_date: payment.expected_payment_date || undefined,
            appointments: [appointmentDetail]
          });
        }
      }

      let sortedDebts = Array.from(debtsMap.values());
      
      // Sort based on selected filter
      switch (debtSortBy) {
        case 'oldest':
          sortedDebts.sort((a, b) => {
            if (!a.oldest_payment_date || !b.oldest_payment_date) return 0;
            return new Date(a.oldest_payment_date).getTime() - new Date(b.oldest_payment_date).getTime();
          });
          break;
        case 'expected':
          sortedDebts.sort((a, b) => {
            if (!a.expected_payment_date && !b.expected_payment_date) return 0;
            if (!a.expected_payment_date) return 1;
            if (!b.expected_payment_date) return -1;
            return new Date(a.expected_payment_date).getTime() - new Date(b.expected_payment_date).getTime();
          });
          break;
        default: // 'debt'
          sortedDebts.sort((a, b) => b.total_debt - a.total_debt);
      }

      setCustomerDebts(sortedDebts);
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

  const handleCollectPayment = async (customerId: string) => {
    try {
      // First get appointment IDs for this customer
      const { data: appointments, error: appointmentError } = await supabase
        .from('appointments')
        .select('id')
        .eq('customer_id', customerId);

      if (appointmentError) throw appointmentError;

      if (!appointments || appointments.length === 0) {
        toast({
          title: "Hata",
          description: "Bu müşteri için randevu bulunamadı.",
          variant: "destructive",
        });
        return;
      }

      const appointmentIds = appointments.map(a => a.id);

      // Get all pending credit payments for this customer's appointments
      const { data: pendingPayments, error: fetchError } = await supabase
        .from('payments')
        .select('id')
        .eq('payment_method', 'credit')
        .eq('payment_status', 'pending')
        .in('appointment_id', appointmentIds);

      if (fetchError) throw fetchError;

      if (!pendingPayments || pendingPayments.length === 0) {
        toast({
          title: "Hata",
          description: "Bu müşteri için bekleyen ödeme bulunamadı.",
          variant: "destructive",
        });
        return;
      }

      // Update all pending payments to completed
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          payment_status: 'completed',
          payment_date: new Date().toISOString()
        })
        .in('id', pendingPayments.map(p => p.id));

      if (updateError) throw updateError;

      toast({
        title: "Başarılı!",
        description: "Veresiye ödemeler tahsil edildi.",
      });

      // Refresh data
      fetchPaymentData();
      fetchCustomerDebts();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ödeme tahsil edilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const exportReport = () => {
    try {
      // Tarih aralığını al
      const dateRange = getDateRange();
      
      // CSV formatında rapor oluştur
      const csvContent = generateCSVReport();
      
      // Dosya adını oluştur
      const fileName = `odeme_raporu_${dateRange.start}_${dateRange.end}.csv`;
      
      // Blob oluştur ve indir
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Rapor İndirildi",
        description: `${fileName} dosyası başarıyla indirildi.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Hata",
        description: "Rapor indirilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const generateCSVReport = () => {
    const dateRange = getDateRange();
    const headers = [
      'Tarih',
      'Müşteri Adı',
      'Hizmet',
      'Tutar',
      'Ödeme Yöntemi',
      'Durum',
      'Notlar'
    ];
    
    // CSV başlıklarını oluştur
    let csvContent = headers.join(',') + '\n';
    
    // Ödeme verilerini CSV formatına çevir
    if (paymentSummary && paymentSummary.payments) {
      paymentSummary.payments.forEach((payment: any) => {
        const row = [
          payment.payment_date || '',
          payment.customer_name || '',
          payment.service_name || '',
          payment.amount || 0,
          payment.payment_method || '',
          payment.payment_status || '',
          (payment.notes || '').replace(/,/g, ';') // Virgül içeren notları noktalı virgül ile değiştir
        ];
        csvContent += row.join(',') + '\n';
      });
    }
    
    // Özet bilgileri ekle
    csvContent += '\n';
    csvContent += 'ÖZET BİLGİLER\n';
    csvContent += `Toplam Gelir,${paymentSummary.total_amount}\n`;
    csvContent += `Nakit,${paymentSummary.cash_amount}\n`;
    csvContent += `Kart,${paymentSummary.card_amount}\n`;
    csvContent += `Veresiye,${paymentSummary.credit_amount}\n`;
    csvContent += `Tamamlanan,${paymentSummary.completed_count}\n`;
    csvContent += `Bekleyen,${paymentSummary.pending_count}\n`;
    
    return csvContent;
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
            <div className="flex flex-col mt-2 text-sm text-orange-600 space-y-1">
              <div className="flex items-center">
                <TrendingDown className="h-4 w-4 mr-1" />
                {creditStats.pending} kişiden bekleniyor
              </div>
              <div className="flex items-center text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                {creditStats.collected} kişiden tahsil edildi
              </div>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-primary" />
                Veresiye Müşteriler
              </CardTitle>
              <CardDescription>
                Ödeme bekleyen müşterilerin borç listesi
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={debtSortBy}
                onChange={(e) => setDebtSortBy(e.target.value as 'debt' | 'oldest' | 'expected')}
                className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              >
                <option value="debt">Borç Miktarına Göre</option>
                <option value="oldest">En Eski Tarihe Göre</option>
                <option value="expected">Beklenen Ödeme Tarihine Göre</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {customerDebts.length > 0 ? (
            <div className="space-y-3">
              {customerDebts.map((debt) => (
                <div key={debt.customer_id} className="bg-white/50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {debt.customer_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {debt.customer_phone} • {debt.appointment_count} randevu
                      </div>
                      {debt.expected_payment_date && (
                        <div className="text-sm text-blue-600 mt-1">
                          Beklenen: {new Date(debt.expected_payment_date).toLocaleDateString('tr-TR')}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">
                        ₺{debt.total_debt}
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        Borçlu
                      </Badge>
                    </div>
                    <div className="ml-4 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setExpandedDebt(expandedDebt === debt.customer_id ? null : debt.customer_id)}
                      >
                        <Eye className="h-4 w-4" />
                        {expandedDebt === debt.customer_id ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCollectPayment(debt.customer_id)}
                      >
                        Tahsil Et
                      </Button>
                    </div>
                  </div>
                  
                  {expandedDebt === debt.customer_id && debt.appointments && (
                    <div className="border-t border-orange-200 p-4 bg-orange-50/50">
                      <h4 className="font-semibold text-foreground mb-3">Randevu Detayları</h4>
                      <div className="space-y-3">
                        {debt.appointments.map((appointment) => (
                          <div key={appointment.id} className="bg-white/80 p-3 rounded-md border border-orange-100">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="font-medium text-foreground">
                                  {appointment.service_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Personel: {appointment.staff_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Tarih: {new Date(appointment.appointment_date).toLocaleDateString('tr-TR')} - {appointment.start_time}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-orange-600">
                                  ₺{appointment.amount}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

        <Card 
          className="bg-white/50 backdrop-blur-sm border-brand-primary/10 hover:shadow-soft transition-all duration-300 cursor-pointer"
          onClick={exportReport}
        >
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
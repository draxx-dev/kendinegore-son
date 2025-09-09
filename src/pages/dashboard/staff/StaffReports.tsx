import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, 
  Users, 
  Calendar, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Filter,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { PermissionGuard } from "@/components/PermissionGuard";

interface ReportData {
  totalCustomers: number;
  totalAppointments: number;
  totalRevenue: number;
  averageAppointmentValue: number;
  monthlyStats: {
    month: string;
    appointments: number;
    revenue: number;
    customers: number;
  }[];
  topServices: {
    name: string;
    count: number;
    revenue: number;
  }[];
  appointmentStatuses: {
    status: string;
    count: number;
  }[];
}

const StaffReports = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30"); // days
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      const staffSession = localStorage.getItem('staff_session');
      if (!staffSession) return;

      const session = JSON.parse(staffSession);
      const businessId = session.staff.business_id;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Fetch customers count
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id', { count: 'exact' })
        .eq('business_id', businessId)
        .gte('created_at', startDate.toISOString());

      if (customersError) throw customersError;

      // Fetch appointments data
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          total_price,
          status,
          services (name)
        `)
        .eq('business_id', businessId)
        .gte('appointment_date', startDate.toISOString())
        .lte('appointment_date', endDate.toISOString());

      if (appointmentsError) throw appointmentsError;

      // Fetch payments data
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          amount,
          payment_status,
          appointments!inner (
            business_id
          )
        `)
        .eq('appointments.business_id', businessId)
        .eq('payment_status', 'completed')
        .gte('created_at', startDate.toISOString());

      if (paymentsError) throw paymentsError;

      // Process data
      const totalCustomers = customers?.length || 0;
      const totalAppointments = appointments?.length || 0;
      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const averageAppointmentValue = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

      // Monthly stats (last 6 months)
      const monthlyStats = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthAppointments = appointments?.filter(a => {
          const appDate = new Date(a.appointment_date);
          return appDate >= monthStart && appDate <= monthEnd;
        }) || [];

        const monthRevenue = monthAppointments.reduce((sum, a) => sum + Number(a.total_price), 0);
        const monthCustomers = new Set(monthAppointments.map(a => a.id)).size;

        monthlyStats.push({
          month: format(monthDate, 'MMM yyyy', { locale: tr }),
          appointments: monthAppointments.length,
          revenue: monthRevenue,
          customers: monthCustomers
        });
      }

      // Top services
      const serviceStats: { [key: string]: { count: number; revenue: number } } = {};
      appointments?.forEach(appointment => {
        const serviceName = appointment.services?.name || 'Bilinmeyen';
        if (!serviceStats[serviceName]) {
          serviceStats[serviceName] = { count: 0, revenue: 0 };
        }
        serviceStats[serviceName].count++;
        serviceStats[serviceName].revenue += Number(appointment.total_price);
      });

      const topServices = Object.entries(serviceStats)
        .map(([name, stats]) => ({
          name,
          count: stats.count,
          revenue: stats.revenue
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Appointment statuses
      const statusStats: { [key: string]: number } = {};
      appointments?.forEach(appointment => {
        const status = appointment.status || 'unknown';
        statusStats[status] = (statusStats[status] || 0) + 1;
      });

      const appointmentStatuses = Object.entries(statusStats).map(([status, count]) => ({
        status,
        count
      }));

      setReportData({
        totalCustomers,
        totalAppointments,
        totalRevenue,
        averageAppointmentValue,
        monthlyStats,
        topServices,
        appointmentStatuses
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Rapor verileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Planlandı';
      case 'confirmed':
        return 'Onaylandı';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      case 'no_show':
        return 'Gelmedi';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Rapor verileri yüklenemedi.</p>
      </div>
    );
  }

  return (
    <PermissionGuard permission="view_reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-brand-primary" />
              Raporlar ve Analizler
          </h1>
            <p className="text-muted-foreground mt-1">
              İşletme performansını ve istatistikleri görüntüleyin.
          </p>
        </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="7">Son 7 Gün</option>
              <option value="30">Son 30 Gün</option>
              <option value="90">Son 3 Ay</option>
              <option value="365">Son 1 Yıl</option>
            </select>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Dışa Aktar
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-brand-primary" />
              </div>
              <div className="text-2xl font-bold text-brand-primary mb-1">
                {reportData.totalCustomers}
              </div>
              <div className="text-sm text-muted-foreground">Toplam Müşteri</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {reportData.totalAppointments}
              </div>
              <div className="text-sm text-muted-foreground">Toplam Randevu</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {formatPrice(reportData.totalRevenue)}
              </div>
              <div className="text-sm text-muted-foreground">Toplam Gelir</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {formatPrice(reportData.averageAppointmentValue)}
              </div>
              <div className="text-sm text-muted-foreground">Ortalama Randevu</div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Aylık Trendler
            </CardTitle>
            <CardDescription>
              Son 6 ayın performans göstergeleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {reportData.monthlyStats.map((month, index) => (
                <div key={index} className="text-center p-4 bg-white/50 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    {month.month}
                  </div>
                  <div className="text-lg font-bold text-brand-primary mb-1">
                    {month.appointments}
                  </div>
                  <div className="text-xs text-muted-foreground">Randevu</div>
                  <div className="text-sm font-semibold text-green-600 mt-2">
                    {formatPrice(month.revenue)}
                  </div>
                  <div className="text-xs text-muted-foreground">Gelir</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Services and Statuses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Services */}
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                En Popüler Hizmetler
              </CardTitle>
              <CardDescription>
                En çok tercih edilen hizmetler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.topServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {service.count} randevu
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatPrice(service.revenue)}
                      </div>
                      <div className="text-xs text-muted-foreground">Toplam</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Appointment Statuses */}
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Randevu Durumları
              </CardTitle>
              <CardDescription>
                Randevuların durum dağılımı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.appointmentStatuses.map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(status.status)}>
                        {getStatusText(status.status)}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {status.count} randevu
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {((status.count / reportData.totalAppointments) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          </CardContent>
        </Card>
        </div>

        {/* Empty State */}
        {reportData.totalAppointments === 0 && (
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Henüz rapor verisi bulunmuyor
              </h3>
              <p className="text-muted-foreground text-center">
                Randevular oluşturulduğunda burada detaylı raporlar görebileceksiniz.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PermissionGuard>
  );
};

export default StaffReports;
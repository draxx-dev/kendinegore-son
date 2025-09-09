import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  UserCheck,
  BarChart3,
  Plus,
  TrendingUp,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, startOfWeek, endOfWeek } from "date-fns";
import { tr } from "date-fns/locale";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { SetupProgressCard } from "@/components/dashboard/SetupProgressCard";
import { useSetupProgress } from "@/hooks/useSetupProgress";

const Overview = () => {
  const [businessId, setBusinessId] = useState<string | undefined>();
  const { steps, loading: setupLoading, progress, skipStep, unskipStep, checkStepCompletion } = useSetupProgress(businessId);

  useEffect(() => {
    // Business ID'yi localStorage'dan al
    const storedBusinessId = localStorage.getItem('businessId');
    if (storedBusinessId) {
      setBusinessId(storedBusinessId);
    }
  }, []);
  const [dashboardData, setDashboardData] = useState({
    todayAppointments: 0,
    totalCustomers: 0,
    todayRevenue: 0,
    activeStaff: 0,
    weeklyAppointments: 0,
    weeklyRevenue: 0,
    newCustomersThisWeek: 0,
    cancelRate: 0
  });
  const [todayAppointmentsList, setTodayAppointmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get business ID
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!business) return;

      // Business ID'yi state'e set et
      setBusinessId(business.id);

      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

      // Fetch today's appointments
      const { data: todayAppts } = await supabase
        .from('appointments')
        .select(`
          *,
          customers(first_name, last_name),
          services(name)
        `)
        .eq('business_id', business.id)
        .eq('appointment_date', todayStr)
        .order('start_time');

      // Fetch today's payments
      const { data: todayPayments } = await supabase
        .from('payments')
        .select('amount')
        .in('appointment_id', todayAppts?.map(a => a.id) || [])
        .eq('payment_status', 'completed');

      // Fetch total customers
      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id);

      // Fetch active staff
      const { count: staffCount } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .eq('is_active', true);

      // Fetch weekly data
      const { data: weeklyAppts } = await supabase
        .from('appointments')
        .select('*')
        .eq('business_id', business.id)
        .gte('appointment_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('appointment_date', format(weekEnd, 'yyyy-MM-dd'));

      const { data: weeklyPayments } = await supabase
        .from('payments')
        .select('amount')
        .in('appointment_id', weeklyAppts?.map(a => a.id) || [])
        .eq('payment_status', 'completed');

      // Calculate new customers this week
      const { count: newCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      setDashboardData({
        todayAppointments: todayAppts?.length || 0,
        totalCustomers: customerCount || 0,
        todayRevenue: todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
        activeStaff: staffCount || 0,
        weeklyAppointments: weeklyAppts?.length || 0,
        weeklyRevenue: weeklyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
        newCustomersThisWeek: newCustomers || 0,
        cancelRate: weeklyAppts?.length ? Math.round((weeklyAppts.filter(a => a.status === 'cancelled').length / weeklyAppts.length) * 100) : 0
      });

      setTodayAppointmentsList(todayAppts?.slice(0, 2) || []);
    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardItems = [
    {
      title: "Bugünkü Randevular",
      description: `${dashboardData.todayAppointments} randevu planlandı`,
      icon: Calendar,
      value: dashboardData.todayAppointments.toString(),
      change: "+2",
      href: "/dashboard/appointments"
    },
    {
      title: "Toplam Müşteri",
      description: "Kayıtlı müşteri sayısı",
      icon: Users,
      value: dashboardData.totalCustomers.toString(),
      change: `+${dashboardData.newCustomersThisWeek}`,
      href: "/dashboard/customers"
    },
    {
      title: "Günlük Gelir",
      description: "Bugünkü toplam gelir",
      icon: CreditCard,
      value: `₺${dashboardData.todayRevenue.toLocaleString('tr-TR')}`,
      change: "+15%",
      href: "/dashboard/payments"
    },
    {
      title: "Aktif Personel",
      description: "Çalışan personel sayısı",
      icon: UserCheck,
      value: dashboardData.activeStaff.toString(),
      change: "0",
      href: "/dashboard/staff"
    }
  ];

  const quickActions = [
    {
      title: "Yeni Randevu",
      description: "Müşteri için randevu oluştur",
      icon: Plus,
      href: "/dashboard/appointments/new",
      variant: "brand" as const
    },
    {
      title: "Yeni Müşteri",
      description: "Müşteri bilgilerini kaydet",
      icon: Plus,
      href: "/dashboard/customers/new",
      variant: "outline" as const
    },
    {
      title: "Yeni Hizmet",
      description: "Hizmet tanımı ekle",
      icon: Plus,
      href: "/dashboard/services/new",
      variant: "outline" as const
    }
  ];

  // Business ID yüklenene kadar loading göster
  if (!businessId) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <SubscriptionGuard businessId={businessId}>
      <div className="space-y-8">
      {/* Welcome Section */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-foreground mb-3">
          İyi Günler!
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Salon yönetim panelinize hoş geldiniz. İşletmenizi profesyonelce yönetmek için ihtiyacınız olan her şey burada.
        </p>
      </div>

      {/* Setup Progress Card */}
      <SetupProgressCard
        steps={steps}
        progress={progress}
        loading={setupLoading}
        onSkip={skipStep}
        onUnskip={unskipStep}
        onRefresh={checkStepCompletion}
      />

      {/* Show Setup Card Button (if hidden) */}
      {localStorage.getItem('setupProgressHidden') === 'true' && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.removeItem('setupProgressHidden');
              window.location.reload();
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            Kurulum Kartını Göster
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-foreground mb-6">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 bg-white border-border/50 hover:border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors duration-300">
                    <action.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold mb-1">{action.title}</CardTitle>
                    <p className="text-sm text-muted-foreground leading-relaxed">{action.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  variant={action.variant} 
                  size="default" 
                  className="w-full font-medium"
                  asChild
                >
                  <Link to={action.href}>
                    Başlat
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {dashboardItems.map((item, index) => (
          <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-border/50 hover:border-primary/20 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {item.title}
                  </CardTitle>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-foreground">
                      {item.value}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                      <TrendingUp className="h-3 w-3" />
                      {item.change}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-all duration-300">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {item.description}
              </p>
              <Button variant="outline" size="sm" className="w-full group-hover:border-primary/50" asChild>
                <Link to={item.href}>
                  Detay Gör
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bugünkü Randevular */}
        <Card className="bg-white border-border/50 shadow-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              Bugünkü Randevular
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary mx-auto"></div>
                </div>
              ) : todayAppointmentsList.length > 0 ? (
                todayAppointmentsList.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {appointment.customers?.first_name} {appointment.customers?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {appointment.services?.name} • {appointment.start_time?.slice(0, 5)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      appointment.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : appointment.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-brand-primary/10 text-brand-primary'
                    }`}>
                      {appointment.status === 'completed' ? 'Tamamlandı' 
                       : appointment.status === 'cancelled' ? 'İptal'
                       : 'Planlandı'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Bugün randevu bulunmuyor
                </div>
              )}
              <div className="text-center pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/appointments">
                    Tümünü Gör
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Haftalık Özet */}
        <Card className="bg-white border-border/50 shadow-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              Bu Hafta Özeti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary mx-auto"></div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Toplam Randevu</span>
                    <div className="text-right">
                      <span className="font-semibold">{dashboardData.weeklyAppointments}</span>
                      <div className="text-xs text-green-600">+12%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Toplam Gelir</span>
                    <div className="text-right">
                      <span className="font-semibold">₺{dashboardData.weeklyRevenue.toLocaleString('tr-TR')}</span>
                      <div className="text-xs text-green-600">+8%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Yeni Müşteri</span>
                    <div className="text-right">
                      <span className="font-semibold">{dashboardData.newCustomersThisWeek}</span>
                      <div className="text-xs text-green-600">+{dashboardData.newCustomersThisWeek}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">İptal Oranı</span>
                    <div className="text-right">
                      <span className={`font-semibold ${dashboardData.cancelRate <= 10 ? 'text-green-600' : 'text-red-600'}`}>
                        %{dashboardData.cancelRate}
                      </span>
                      <div className="text-xs text-green-600">-2%</div>
                    </div>
                  </div>
                </>
              )}
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/dashboard/payments">
                    Detaylı Rapor
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </SubscriptionGuard>
  );
};

export default Overview;
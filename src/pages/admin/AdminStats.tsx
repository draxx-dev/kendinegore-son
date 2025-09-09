import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Building, 
  Users, 
  Calendar, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  Smartphone,
  MessageSquare
} from "lucide-react";

interface AdminStats {
  totalBusinesses: number;
  totalCustomers: number;
  totalAppointments: number;
  totalRevenue: number;
  activeBusinesses: number;
  todayAppointments: number;
  smsSent: number;
  whatsappInstances: number;
}

const AdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalBusinesses: 0,
    totalCustomers: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    activeBusinesses: 0,
    todayAppointments: 0,
    smsSent: 0,
    whatsappInstances: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        businessesResult,
        customersResult,
        appointmentsResult,
        paymentsResult,
        smsLogsResult,
        whatsappResult
      ] = await Promise.all([
        supabase.from('businesses').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('appointments').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('sms_logs').select('*'),
        supabase.from('whatsapp_instances').select('*')
      ]);

      const businesses = businessesResult.data || [];
      const customers = customersResult.data || [];
      const appointments = appointmentsResult.data || [];
      const payments = paymentsResult.data || [];
      const smsLogs = smsLogsResult.data || [];
      const whatsappInstances = whatsappResult.data || [];

      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointments.filter(apt => apt.appointment_date === today);

      const totalRevenue = payments
        .filter(p => p.payment_status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const activeBusinesses = businesses.filter(b => b.is_active).length;
      const smsSent = smsLogs.filter(log => log.status === 'sent').length;

      setStats({
        totalBusinesses: businesses.length,
        totalCustomers: customers.length,
        totalAppointments: appointments.length,
        totalRevenue,
        activeBusinesses,
        todayAppointments: todayAppointments.length,
        smsSent,
        whatsappInstances: whatsappInstances.length
      });
    } catch (error) {
      console.error('Admin stats fetch error:', error);
      toast({
        title: "Hata",
        description: "İstatistikler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">İstatistikler yükleniyor...</p>
        </div>
      </div>
    );
  }

  const mainStats = [
    {
      title: "Toplam İşletme",
      value: stats.totalBusinesses,
      icon: Building,
      color: "blue",
      change: stats.activeBusinesses,
      changeLabel: "Aktif"
    },
    {
      title: "Toplam Müşteri",
      value: stats.totalCustomers,
      icon: Users,
      color: "green",
      change: stats.todayAppointments,
      changeLabel: "Bugünkü Randevu"
    },
    {
      title: "Toplam Randevu",
      value: stats.totalAppointments,
      icon: Calendar,
      color: "purple",
      change: stats.todayAppointments,
      changeLabel: "Bugün"
    },
    {
      title: "Toplam Gelir",
      value: `₺${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "yellow",
      change: null,
      changeLabel: null
    }
  ];

  const systemStats = [
    {
      title: "SMS Gönderildi",
      value: stats.smsSent,
      icon: Smartphone,
      color: "indigo"
    },
    {
      title: "WhatsApp AI",
      value: stats.whatsappInstances,
      icon: MessageSquare,
      color: "pink"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-500 text-white",
      green: "bg-green-500 text-white", 
      purple: "bg-purple-500 text-white",
      yellow: "bg-yellow-500 text-white",
      indigo: "bg-indigo-500 text-white",
      pink: "bg-pink-500 text-white"
    };
    return colors[color as keyof typeof colors] || "bg-gray-500 text-white";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">İstatistikler</h1>
        <p className="text-gray-600 mt-2">Sistem genel bakış ve performans metrikleri</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => (
          <Card key={index} className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </p>
                  {stat.change !== null && (
                    <Badge variant="secondary" className="text-xs">
                      {stat.change} {stat.changeLabel}
                    </Badge>
                  )}
                </div>
                <div className={`w-12 h-12 ${getColorClasses(stat.color)} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systemStats.map((stat, index) => (
          <Card key={index} className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${getColorClasses(stat.color)} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Sistem Durumu
          </CardTitle>
          <CardDescription>
            Platform servislerinin durumu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">Veritabanı</span>
              <Badge className="bg-green-100 text-green-800">Aktif</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">SMS Servisi</span>
              <Badge className="bg-green-100 text-green-800">Aktif</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">WhatsApp AI</span>
              <Badge className="bg-green-100 text-green-800">Aktif</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">Online Randevu</span>
              <Badge className="bg-green-100 text-green-800">Aktif</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;

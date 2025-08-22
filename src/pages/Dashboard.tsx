import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut,
  UserCheck,
  BarChart3,
  Plus
} from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Auth state listener'ı ilk olarak kur
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session && !loading) {
          navigate("/auth");
        }
      }
    );

    // Sonra mevcut oturumu kontrol et
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, [navigate, loading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return null; // useEffect navigate'i hallediyor
  }

  const dashboardItems = [
    {
      title: "Randevular",
      description: "Bugün 5 randevu var",
      icon: Calendar,
      value: "12",
      href: "/dashboard/appointments"
    },
    {
      title: "Müşteriler",
      description: "Toplam müşteri sayısı",
      icon: Users,
      value: "48",
      href: "/dashboard/customers"
    },
    {
      title: "Günlük Gelir",
      description: "Bugünkü toplam gelir",
      icon: CreditCard,
      value: "₺1,250",
      href: "/dashboard/payments"
    },
    {
      title: "Personel",
      description: "Aktif personel sayısı",
      icon: UserCheck,
      value: "3",
      href: "/dashboard/staff"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-brand-primary/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                KendineGöre
              </h1>
              <span className="ml-4 text-muted-foreground">Panel</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Hoş geldiniz, {user.user_metadata?.first_name || user.email}
              </span>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            İyi günler! 👋
          </h2>
          <p className="text-muted-foreground">
            Salon yönetim panelinize hoş geldiniz. İşletmenizi buradan yönetebilirsiniz.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground">Hızlı İşlemler</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="brand" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Yeni Randevu
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Yeni Müşteri
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Yeni Hizmet
            </Button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardItems.map((item, index) => (
            <Card key={index} className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 bg-white/50 backdrop-blur-sm border-brand-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </CardTitle>
                <item.icon className="h-5 w-5 text-brand-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {item.value}
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Son Randevular */}
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand-primary" />
                Bugünkü Randevular
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <div>
                    <p className="font-medium">Ayşe Yılmaz</p>
                    <p className="text-sm text-muted-foreground">Saç Kesimi • 14:00</p>
                  </div>
                  <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-full">
                    Onaylandı
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <div>
                    <p className="font-medium">Mehmet Kaya</p>
                    <p className="text-sm text-muted-foreground">Sakal Düzeltme • 15:30</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Bekliyor
                  </span>
                </div>
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    Tümünü Gör
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Haftalık Özet */}
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-brand-primary" />
                Bu Hafta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Toplam Randevu</span>
                  <span className="font-semibold">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Toplam Gelir</span>
                  <span className="font-semibold">₺5,680</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Yeni Müşteri</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">İptal Oranı</span>
                  <span className="font-semibold text-green-600">%5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
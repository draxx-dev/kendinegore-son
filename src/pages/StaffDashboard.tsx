import { useState, useEffect } from "react";
import { useNavigate, Routes, Route, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut,
  Shield,
  User
} from "lucide-react";
import StaffAppointments from "./dashboard/staff/StaffAppointments";
import StaffCustomers from "./dashboard/staff/StaffCustomers";
import StaffPayments from "./dashboard/staff/StaffPayments";
import StaffSettings from "./dashboard/staff/StaffSettings";

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

const StaffDashboardOverview = ({ staffSession }: { staffSession: StaffSession }) => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Randevularım",
      description: "Bugünkü randevularınızı görün",
      icon: Calendar,
      href: "/staff-dashboard/appointments",
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      title: "Müşteriler",
      description: "Müşteri bilgilerini yönetin", 
      icon: Users,
      href: "/staff-dashboard/customers",
      color: "bg-green-500/10 text-green-600"
    },
    {
      title: "Ödemeler",
      description: "Ödeme işlemlerini görün",
      icon: CreditCard,
      href: "/staff-dashboard/payments",
      color: "bg-purple-500/10 text-purple-600"
    },
    {
      title: "Ayarlar",
      description: "Profil ayarlarınız",
      icon: Settings,
      href: "/staff-dashboard/settings",
      color: "bg-gray-500/10 text-gray-600"
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Hoş geldiniz, {staffSession.staff.name}!
        </h2>
        <p className="text-muted-foreground">
          Bugünkü görevlerinizi ve randevularınızı yönetebilirsiniz.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action) => (
          <Card 
            key={action.title}
            className="bg-white/50 backdrop-blur-sm border-brand-primary/10 hover:shadow-soft transition-all duration-300 cursor-pointer group"
            onClick={() => navigate(action.href)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2 group-hover:text-brand-primary transition-colors">
                {action.title}
              </CardTitle>
              <CardDescription>
                {action.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-primary" />
              Bugünkü Randevular
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-primary mb-2">0</div>
            <p className="text-muted-foreground text-sm">
              Bugün için planlanmış randevu bulunmuyor.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Toplam Müşteri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-2">0</div>
            <p className="text-muted-foreground text-sm">
              Sorumlu olduğunuz müşteri sayısı.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              Bu Ay Gelir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 mb-2">₺0</div>
            <p className="text-muted-foreground text-sm">
              Bu ay gerçekleştirdiğiniz işlem toplamı.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export const StaffDashboard = () => {
  const [staffSession, setStaffSession] = useState<StaffSession | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const sessionData = localStorage.getItem('staff_session');
    if (!sessionData) {
      navigate('/staff-login');
      return;
    }

    try {
      const session = JSON.parse(sessionData);
      setStaffSession(session);
    } catch (error) {
      localStorage.removeItem('staff_session');
      navigate('/staff-login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('staff_session');
    toast({
      title: "Çıkış Yapıldı",
      description: "Başarıyla çıkış yaptınız.",
    });
    navigate('/');
  };

  if (!staffSession) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-brand-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Personel Paneli
                </h1>
                <p className="text-sm text-muted-foreground">
                  {staffSession?.staff.business_name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {staffSession?.staff.name}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <Routes>
        <Route path="/" element={<StaffDashboardOverview staffSession={staffSession!} />} />
        <Route path="/appointments/*" element={<StaffAppointments />} />
        <Route path="/customers/*" element={<StaffCustomers />} />
        <Route path="/payments" element={<StaffPayments />} />
        <Route path="/settings" element={<StaffSettings />} />
      </Routes>
    </div>
  );
};
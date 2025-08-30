import { Routes, Route } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  CreditCard
} from "lucide-react";
import { StaffDashboardLayout } from "@/components/dashboard/StaffDashboardLayout";
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

const StaffDashboardOverview = () => {

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
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Hoş geldiniz!
        </h2>
        <p className="text-muted-foreground">
          Bugünkü görevlerinizi ve randevularınızı yönetebilirsiniz.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((action) => (
          <Card 
            key={action.title}
            className="bg-white/50 backdrop-blur-sm border-brand-primary/10 hover:shadow-soft transition-all duration-300 cursor-pointer group"
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
    </div>
  );
};

export const StaffDashboard = () => {
  return (
    <StaffDashboardLayout>
      <Routes>
        <Route path="/" element={<StaffDashboardOverview />} />
        <Route path="/appointments/*" element={<StaffAppointments />} />
        <Route path="/customers/*" element={<StaffCustomers />} />
        <Route path="/payments" element={<StaffPayments />} />
        <Route path="/settings" element={<StaffSettings />} />
      </Routes>
    </StaffDashboardLayout>
  );
};
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

const Overview = () => {
  const dashboardItems = [
    {
      title: "Bugünkü Randevular",
      description: "5 randevu planlandı",
      icon: Calendar,
      value: "5",
      change: "+2",
      href: "/dashboard/appointments"
    },
    {
      title: "Toplam Müşteri",
      description: "Kayıtlı müşteri sayısı",
      icon: Users,
      value: "48",
      change: "+3",
      href: "/dashboard/customers"
    },
    {
      title: "Günlük Gelir",
      description: "Bugünkü toplam gelir",
      icon: CreditCard,
      value: "₺1,250",
      change: "+15%",
      href: "/dashboard/payments"
    },
    {
      title: "Aktif Personel",
      description: "Çalışan personel sayısı",
      icon: UserCheck,
      value: "3",
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          İyi günler! 👋
        </h1>
        <p className="text-muted-foreground">
          Salon yönetim panelinize hoş geldiniz. İşletmenizi buradan yönetebilirsiniz.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-soft transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-brand-primary/10">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-primary/10 rounded-lg">
                    <action.icon className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  variant={action.variant} 
                  size="sm" 
                  className="w-full"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardItems.map((item, index) => (
          <Card key={index} className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-foreground">
                    {item.value}
                  </span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {item.change}
                  </span>
                </div>
              </div>
              <item.icon className="h-8 w-8 text-brand-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {item.description}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to={item.href}>
                  Detay Gör
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bugünkü Randevular */}
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
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Saç Kesimi • 14:00
                  </p>
                </div>
                <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-full">
                  Onaylandı
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                <div>
                  <p className="font-medium">Mehmet Kaya</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Sakal Düzeltme • 15:30
                  </p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Bekliyor
                </span>
              </div>
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
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-primary" />
              Bu Hafta Özeti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Toplam Randevu</span>
                <div className="text-right">
                  <span className="font-semibold">24</span>
                  <div className="text-xs text-green-600">+12%</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Toplam Gelir</span>
                <div className="text-right">
                  <span className="font-semibold">₺5,680</span>
                  <div className="text-xs text-green-600">+8%</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Yeni Müşteri</span>
                <div className="text-right">
                  <span className="font-semibold">8</span>
                  <div className="text-xs text-green-600">+3</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">İptal Oranı</span>
                <div className="text-right">
                  <span className="font-semibold text-green-600">%5</span>
                  <div className="text-xs text-green-600">-2%</div>
                </div>
              </div>
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
  );
};

export default Overview;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  Clock, 
  UserCheck, 
  BarChart3,
  Smartphone,
  Globe
} from "lucide-react";

export const FeatureSection = () => {
  const features = [
    {
      icon: Calendar,
      title: "Randevu Yönetimi",
      description: "Akıllı takvim ile randevularınızı kolayca yönetin. Otomatik hatırlatmalar ve çakışma kontrolü.",
      color: "text-brand-primary"
    },
    {
      icon: Users,
      title: "Müşteri CRM",
      description: "Müşteri bilgilerini, tercihleri ve geçmişi tek yerde saklayın. Sadık müşterilerinizi keşfedin.",
      color: "text-brand-primary-light"
    },
    {
      icon: CreditCard,
      title: "Ödeme Takibi",
      description: "Nakit, kart ve veresiye ödemelerinizi takip edin. Günlük raporlar ile kasanızı kontrol edin.",
      color: "text-brand-primary-dark"
    },
    {
      icon: UserCheck,
      title: "Personel Yönetimi",
      description: "Personel bilgileri, çalışma saatleri ve uzmanlık alanlarını organize edin.",
      color: "text-brand-secondary"
    },
    {
      icon: Clock,
      title: "Çalışma Saatleri",
      description: "Esnek çalışma saatleri ayarlayın. Tatil günleri ve özel durumları planlayin.",
      color: "text-brand-primary"
    },
    {
      icon: BarChart3,
      title: "Gelir Raporları",
      description: "Günlük, haftalık ve aylık gelir raporları ile işletmenizin performansını analiz edin.",
      color: "text-brand-primary-light"
    },
    {
      icon: Smartphone,
      title: "Mobil Uyumlu",
      description: "Her cihazdan erişim. Müşterileriniz telefon ve tabletlerinden kolayca randevu alabilir.",
      color: "text-brand-primary-dark"
    },
    {
      icon: Globe,
      title: "Online Randevu",
      description: "İşletmenize özel link ile 7/24 online randevu alma imkanı sunun.",
      color: "text-brand-secondary"
    }
  ];

  return (
    <section className="py-20 bg-white/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            İşletmenizi Büyütecek Özellikler
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            KendineGöre ile güzellik salonunuzun tüm süreçlerini dijitalleştirin ve verimliliğinizi artırın.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 bg-white/70 backdrop-blur-lg border-white/50">
              <CardHeader className="text-center pb-4">
                <feature.icon className={`h-12 w-12 mx-auto mb-4 ${feature.color}`} />
                <CardTitle className="text-lg text-gray-800">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
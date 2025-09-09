import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Smartphone, 
  MessageSquare,
  Globe
} from "lucide-react";

export default function Roadmap() {
  const upcomingFeatures = [
    {
      title: "Sanal Pos Entegrasyonu",
      description: "Online randevu alırken müşterileriniz güvenli ödeme yapabilecek. Kredi kartı, banka kartı ve dijital cüzdan ödemelerini kabul edin.",
      icon: CreditCard,
      status: "Yakında",
      priority: "Yüksek",
      benefits: [
        "Güvenli ödeme altyapısı",
        "Otomatik ödeme onayı",
        "İade ve iptal işlemleri",
        "Detaylı ödeme raporları",
        "Çoklu ödeme yöntemi desteği"
      ],
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600"
    },
    {
      title: "Müşteri Mobil Uygulaması",
      description: "Müşterileriniz sizi keşfedebilecek, randevu alabilecek ve hizmetlerinizi inceleyebilecek özel mobil uygulama.",
      icon: Smartphone,
      status: "Geliştiriliyor",
      priority: "Yüksek",
      benefits: [
        "iOS ve Android uyumlu",
        "Push bildirimleri",
        "Favori salonlar",
        "Geçmiş randevular",
        "Kolay yeniden randevu alma",
        "Sosyal medya entegrasyonu"
      ],
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600"
    },
    {
      title: "Sosyal Medya Entegrasyonu",
      description: "Instagram ve Facebook hesaplarınızla entegre çalışın. Müşteri yorumlarını takip edin ve sosyal medya içeriklerinizi yönetin.",
      icon: Globe,
      status: "Planlanıyor",
      priority: "Düşük",
      benefits: [
        "Instagram entegrasyonu",
        "Facebook sayfa yönetimi",
        "Otomatik içerik paylaşımı",
        "Müşteri yorum takibi",
        "Sosyal medya raporları"
      ],
      color: "bg-pink-50 border-pink-200",
      iconColor: "text-pink-600"
    }
  ];


  const getStatusColor = (status: string) => {
    switch (status) {
      case "Yakında": return "bg-green-100 text-green-800";
      case "Geliştiriliyor": return "bg-blue-100 text-blue-800";
      case "Planlanıyor": return "bg-yellow-100 text-yellow-800";
      case "Sürekli": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Yüksek": return "bg-red-100 text-red-800";
      case "Orta": return "bg-yellow-100 text-yellow-800";
      case "Düşük": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Neler Olacak?</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          KendineGore salon yönetim sistemini sürekli geliştiriyoruz. 
          İşte yakında gelecek özellikler ve güncellemeler.
        </p>
      </div>


      {/* Upcoming Features */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Yakında Gelecek Özellikler</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {upcomingFeatures.map((feature, index) => (
            <Card key={index} className={`${feature.color} hover:shadow-lg transition-shadow`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white ${feature.iconColor}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge className={getStatusColor(feature.status)}>
                          {feature.status}
                        </Badge>
                        <Badge className={getPriorityColor(feature.priority)}>
                          {feature.priority} Öncelik
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{feature.description}</p>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Faydalar:</h4>
                  <ul className="space-y-1">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="text-center py-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Önerilerinizi Paylaşın!
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Hangi özelliklerin öncelikli olmasını istiyorsunuz? 
            Görüşlerinizi bizimle paylaşın ve geliştirme sürecimize katkıda bulunun.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/dashboard/contact" 
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Öneri Gönder
            </a>
            <a 
              href="mailto:iletisim@kendinegore.com" 
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              E-posta Gönder
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

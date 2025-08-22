import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Users, TrendingUp, Star, CreditCard, Zap, Lock } from "lucide-react";

export const HeroSection = () => {
  const stats = [
    { number: "1,000+", label: "Mutlu İşletme", icon: Star },
    { number: "50,000+", label: "Randevu Tamamlandı", icon: Calendar },
    { number: "5,000+", label: "Aktif Müşteri", icon: Users },
    { number: "%40", label: "Gelir Artışı", icon: TrendingUp },
  ];

  return (
    <div className="relative overflow-hidden bg-transparent">
      
      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-playfair font-bold text-gray-900 mb-6 leading-tight">
            Güzellik Salonunuz
            <br />
            için Modern CRM
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-800 mb-8 max-w-3xl mx-auto leading-relaxed font-inter">
            Randevu yönetiminden müşteri takibine, ödemelerden raporlamaya 
            kadar salonunuzun tüm işlerini tek platformda yönetin.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="text-lg px-12 py-6 bg-gray-900 hover:bg-gray-800 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              🎉 14 Gün Ücretsiz Deneyin
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white shadow-lg transition-all duration-300">
              Demo İzleyin
            </Button>
          </div>

          <div className="text-center mb-16">
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-700 font-inter">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Kredi kartı gerektirmez</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Anında kurulum</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>%100 güvenli</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white/90 backdrop-blur-lg border-white/50 p-6 text-center hover:bg-white hover:scale-105 transition-all duration-300 shadow-lg">
                <stat.icon className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  {stat.number}
                </div>
                <div className="text-gray-700 text-sm md:text-base">
                  {stat.label}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
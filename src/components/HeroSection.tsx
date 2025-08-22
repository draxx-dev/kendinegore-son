import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Users, TrendingUp, Star } from "lucide-react";

export const HeroSection = () => {
  const stats = [
    { number: "1,000+", label: "Mutlu İşletme", icon: Star },
    { number: "50,000+", label: "Randevu Tamamlandı", icon: Calendar },
    { number: "5,000+", label: "Aktif Müşteri", icon: Users },
    { number: "%40", label: "Gelir Artışı", icon: TrendingUp },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-hero"></div>
      
      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Güzellik Salonunuz
            </span>
            <br />
            için Modern CRM
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Randevu yönetiminden müşteri takibine, ödemelerden raporlamaya 
            kadar salonunuzun tüm işlerini tek platformda yönetin.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="text-lg px-12 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
              🎉 14 Gün Ücretsiz Deneyin
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-gray-300 text-gray-700 hover:bg-gray-50 shadow-lg">
              Demo İzleyin
            </Button>
          </div>

          <div className="text-center mb-16">
            <p className="text-sm text-gray-600">
              💳 Kredi kartı gerektirmez • ⚡ Anında kurulum • 🔒 %100 güvenli
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-lg border-white/50 p-6 text-center hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-xl">
                <stat.icon className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                  {stat.number}
                </div>
                <div className="text-gray-600 text-sm md:text-base">
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
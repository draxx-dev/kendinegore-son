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
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Güzellik Salonunuz için
            <br />
            <span className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm inline-block mt-2">
              KendineGöre CRM
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Randevu yönetiminden müşteri takibine, ödemelerden raporlamaya 
            kadar salonunuzun tüm işlerini tek platformda yönetin.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" variant="hero" className="text-lg px-8 py-4">
              Ücretsiz Deneyin
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white/30 text-white hover:bg-white/10">
              Demo İzleyin
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center hover:bg-white/15 transition-all duration-300">
                <stat.icon className="h-8 w-8 text-white mx-auto mb-3" />
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {stat.number}
                </div>
                <div className="text-white/80 text-sm md:text-base">
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
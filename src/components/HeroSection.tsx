import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Users, TrendingUp, Star, CreditCard, Zap, Lock, PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";

export const HeroSection = () => {
  const [currentText, setCurrentText] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const businessTypes = ["Güzellik Salonunuz", "Berber Salonunuz", "Kuaför Salonunuz"];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false); // Fade out
      setTimeout(() => {
        setCurrentText((prev) => (prev + 1) % businessTypes.length);
        setIsVisible(true); // Fade in
      }, 300); // Half of transition duration
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const stats = [
    { number: "1,000+", label: "Mutlu İşletme", icon: Star, targetValue: 1000 },
    { number: "50,000+", label: "Randevu Tamamlandı", icon: Calendar, targetValue: 50000 },
    { number: "5,000+", label: "Aktif Müşteri", icon: Users, targetValue: 5000 },
    { number: "%40", label: "Gelir Artışı", icon: TrendingUp, targetValue: 40 },
  ];

  const [animatedValues, setAnimatedValues] = useState([0, 0, 0, 0]);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          stats.forEach((stat, index) => {
            let startTime: number;
            const duration = 2000; // 2 seconds
            
            const animate = (currentTime: number) => {
              if (!startTime) startTime = currentTime;
              const progress = Math.min((currentTime - startTime) / duration, 1);
              
              // Ease-in-out cubic function for smooth acceleration
              const easedProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
              
              const currentValue = Math.floor(stat.targetValue * easedProgress);
              
              setAnimatedValues(prev => {
                const newValues = [...prev];
                newValues[index] = currentValue;
                return newValues;
              });
              
              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            };
            
            // Delay each animation slightly
            setTimeout(() => requestAnimationFrame(animate), index * 200);
          });
        }
      },
      { threshold: 0.5 }
    );

    const statsSection = document.getElementById('stats-section');
    if (statsSection) {
      observer.observe(statsSection);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const formatValue = (value: number, index: number) => {
    if (index === 3) return `%${value}`; // Percentage
    if (index === 0) return `${(value / 1000).toFixed(1)}K+`.replace('.0', ''); // 1K+
    if (index === 1) return `${(value / 1000).toFixed(0)}K+`; // 50K+
    if (index === 2) return `${(value / 1000).toFixed(1)}K+`.replace('.0', ''); // 5K+
    return value.toString();
  };

  return (
    <div className="relative overflow-hidden bg-transparent">
      
      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-playfair font-bold text-gray-900 mb-6 leading-tight">
            <span className={`inline-block transition-all duration-700 ease-out transform ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}>
              {businessTypes[currentText]}
            </span>
            <br />
            için Modern CRM
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-800 mb-8 max-w-3xl mx-auto leading-relaxed font-inter">
            Randevu yönetiminden müşteri takibine, ödemelerden raporlamaya 
            kadar salonunuzun tüm işlerini tek platformda yönetin.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="text-lg px-12 py-6 bg-white/70 backdrop-blur-xl border-white/30 hover:bg-white/80 text-gray-900 shadow-lg transform hover:scale-105 transition-all duration-300 font-inter">
              <PartyPopper className="w-5 h-5 mr-2" />
              14 Gün Ücretsiz Deneyin
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
          <div id="stats-section" className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white/40 backdrop-blur-3xl border-white/20 p-6 text-center hover:bg-white/50 hover:scale-105 hover:-translate-y-1 transition-all duration-500 shadow-xl hover:shadow-2xl group">
                <stat.icon className="h-8 w-8 text-gray-700 mx-auto mb-3 group-hover:text-gray-900 group-hover:scale-110 transition-all duration-300" />
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 font-inter">
                  {hasAnimated ? formatValue(animatedValues[index], index) : '0'}
                </div>
                <div className="text-gray-700 text-sm md:text-base font-inter">
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
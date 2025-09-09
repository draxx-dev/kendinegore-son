import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { FeatureSection } from "@/components/FeatureSection";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Star, 
  Users, 
  Calendar, 
  MessageSquare, 
  Smartphone, 
  Shield, 
  Zap,
  ArrowRight,
  Crown,
  Sparkles,
  BarChart3,
  Settings,
  Bot
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden">
      {/* Dynamic Indigo Center Glow */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none" 
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, #6366f1, transparent 70%)
          `,
        }} 
      />
      
      <div className="relative z-10">
        <Navigation />
        <HeroSection />
        <FeatureSection />
        
         {/* Pricing Section */}
         <section id="pricing" className="py-20 px-4">
           <div className="max-w-7xl mx-auto">
             <div className="text-center mb-16">
               <Badge variant="outline" className="mb-4">
                 <Crown className="w-4 h-4 mr-2" />
                 Fiyatlandırma
               </Badge>
               <h2 className="text-4xl font-bold text-gray-900 mb-4">
                 Size Uygun Planı Seçin
               </h2>
               <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                 İşletmenizin ihtiyaçlarına göre esnek planlar. İstediğiniz zaman yükseltebilir veya düşürebilirsiniz.
               </p>
             </div>
             
             <div className="grid md:grid-cols-3 gap-8">
               {/* Ücretsiz Plan */}
               <Card className="relative bg-white/60 backdrop-blur-xl border-white/30 shadow-xl">
                 <CardHeader>
                   <div className="flex items-center justify-between">
                     <CardTitle className="text-2xl">Ücretsiz</CardTitle>
                     <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">7 Gün</Badge>
                   </div>
                   <div className="mt-4">
                     <span className="text-4xl font-bold">₺0</span>
                     <span className="text-gray-600">/7 gün</span>
                   </div>
                   <CardDescription>
                     7 gün boyunca tüm özellikler WhatsApp AI dahil
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="space-y-3">
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>WhatsApp AI asistanı</span>
                     </div>
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>Online randevu sistemi</span>
                     </div>
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>Sınırsız müşteri</span>
                     </div>
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>Personel yönetimi</span>
                     </div>
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>Gelişmiş raporlama</span>
                     </div>
                   </div>
                   <Button className="w-full mt-6 bg-white/80 hover:bg-white text-gray-900 border border-gray-200" onClick={() => navigate('/auth')}>
                     Ücretsiz Dene
                     <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                 </CardContent>
               </Card>

               {/* Temel Plan */}
               <Card className="relative bg-white/60 backdrop-blur-xl border-white/30 shadow-xl">
                 <CardHeader>
                   <CardTitle className="text-2xl">Temel</CardTitle>
                   <div className="mt-4">
                     <span className="text-4xl font-bold">₺750</span>
                     <span className="text-gray-600">/ay</span>
                   </div>
                   <CardDescription>
                     WhatsApp AI hariç tüm özellikler sınırsız
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="space-y-3">
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>Online randevu sistemi</span>
                     </div>
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>Sınırsız müşteri</span>
                     </div>
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>Personel yönetimi</span>
                     </div>
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>Gelişmiş raporlama</span>
                     </div>
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>SMS entegrasyonu</span>
                     </div>
                   </div>
                   <Button className="w-full mt-6 bg-white/80 hover:bg-white text-gray-900 border border-gray-200" onClick={() => navigate('/auth')}>
                     Başla
                     <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                 </CardContent>
               </Card>

               {/* Premium Plan */}
               <Card className="relative bg-white/60 backdrop-blur-xl border-white/30 shadow-xl border-2 border-indigo-500/50">
                 <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                   <Badge className="bg-indigo-500 text-white px-4 py-1 shadow-lg">
                     <Star className="w-4 h-4 mr-1" />
                     En Popüler
                   </Badge>
                 </div>
                 <CardHeader>
                   <CardTitle className="text-2xl">Premium</CardTitle>
                   <div className="mt-4">
                     <span className="text-4xl font-bold">₺1000</span>
                     <span className="text-gray-600">/ay</span>
                   </div>
                   <CardDescription>
                     WhatsApp AI dahil tüm özellikler sınırsız
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="space-y-3">
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>WhatsApp AI asistanı</span>
                     </div>
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>Online randevu sistemi</span>
                     </div>
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>Sınırsız müşteri</span>
                     </div>
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>Personel yönetimi</span>
                     </div>
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>Gelişmiş raporlama</span>
                     </div>
                     <div className="flex items-center">
                       <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                       <span>SMS entegrasyonu</span>
                     </div>
                   </div>
                   <Button className="w-full mt-6 bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg" onClick={() => navigate('/auth')}>
                     Başla
                     <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                 </CardContent>
               </Card>
             </div>
             
             {/* WhatsApp AI Açıklama */}
             <div className="mt-16">
               <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-8 shadow-xl">
                 <div className="text-center mb-8">
                   <div className="w-16 h-16 bg-green-100/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                     <Bot className="w-8 h-8 text-green-600" />
                   </div>
                   <h3 className="text-3xl font-bold text-gray-900 mb-4">
                     WhatsApp AI Asistanı Nedir?
                   </h3>
                   <div className="mb-4">
                     <span className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                       Türkiye'de Sadece Bizde!
                     </span>
                   </div>
                   <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                     Yapay zeka destekli WhatsApp asistanınız, müşterilerinize 7/24 otomatik yanıtlar verir ve randevu alım sürecini tamamen otomatikleştirir. Türkiye'de ilk ve tek WhatsApp AI entegrasyonu!
                   </p>
                 </div>
                 
                 <div className="grid md:grid-cols-3 gap-6">
                   <div className="text-center">
                     <div className="w-12 h-12 bg-blue-100/80 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-3">
                       <MessageSquare className="w-6 h-6 text-blue-600" />
                     </div>
                     <h4 className="font-semibold text-lg mb-2">Otomatik Yanıtlar</h4>
                     <p className="text-gray-600 text-sm">
                       Müşteri sorularına anında ve doğru yanıtlar verir
                     </p>
                   </div>
                   
                   <div className="text-center">
                     <div className="w-12 h-12 bg-purple-100/80 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-3">
                       <Calendar className="w-6 h-6 text-purple-600" />
                     </div>
                     <h4 className="font-semibold text-lg mb-2">Randevu Yönetimi</h4>
                     <p className="text-gray-600 text-sm">
                       Randevu alma, değiştirme ve iptal etme işlemlerini yapar
                     </p>
                   </div>
                   
                   <div className="text-center">
                     <div className="w-12 h-12 bg-orange-100/80 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-3">
                       <Zap className="w-6 h-6 text-orange-600" />
                     </div>
                     <h4 className="font-semibold text-lg mb-2">7/24 Hizmet</h4>
                     <p className="text-gray-600 text-sm">
                       Gece gündüz müşterilerinize hizmet verir
                     </p>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </section>

         {/* Dashboard Preview Section */}
         <section id="dashboard" className="py-20 px-4">
           <div className="max-w-7xl mx-auto">
             <div className="text-center mb-16">
               <Badge variant="outline" className="mb-4">
                 <BarChart3 className="w-4 h-4 mr-2" />
                 Yönetim Paneli
               </Badge>
               <h2 className="text-4xl font-bold text-gray-900 mb-4">
                 Güçlü Yönetim Paneli
               </h2>
               <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                 İşletmenizi tek yerden yönetin. Randevular, müşteriler, personel ve finansal raporlar.
               </p>
             </div>
             
             {/* Dashboard Preview Image */}
             <div className="mb-16">
               <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl mx-auto border border-gray-200">
                 <div className="flex items-center justify-center">
                   <img 
                     src="/kendinegore.svg" 
                     alt="Yönetim Paneli Önizleme" 
                     className="w-full max-w-4xl rounded-lg shadow-lg"
                   />
                 </div>
               </div>
             </div>
             
           </div>
         </section>

        {/* Features Deep Dive */}
        <section id="features" className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                <Sparkles className="w-4 h-4 mr-2" />
                Özellikler
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                İşletmenizi Dijitalleştirin
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Modern teknoloji ile işletmenizi bir üst seviyeye taşıyın
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Mobil Uyumlu</h3>
                <p className="text-gray-600">
                  Tüm cihazlardan erişim. Müşterileriniz her yerden randevu alabilir.
                </p>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">WhatsApp AI</h3>
                <p className="text-gray-600">
                  Yapay zeka destekli müşteri hizmetleri. 7/24 otomatik yanıtlar.
                </p>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Güvenli</h3>
                <p className="text-gray-600">
                  Verileriniz güvende. SSL şifreleme ve güvenli sunucular.
                </p>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Hızlı Kurulum</h3>
                <p className="text-gray-600">
                  5 dakikada kurulum. Hemen kullanmaya başlayın.
                </p>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Otomatik Hatırlatma</h3>
                <p className="text-gray-600">
                  SMS ile otomatik randevu hatırlatmaları. Müşteri kaybı yok.
                </p>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Detaylı Raporlar</h3>
                <p className="text-gray-600">
                  Gelir, müşteri analizi ve performans raporları.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default Index;

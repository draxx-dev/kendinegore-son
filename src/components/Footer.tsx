import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-gray-800/90 backdrop-blur-lg text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              KendineGöre
            </h3>
            <p className="text-white/80 mb-4 max-w-md">
              Güzellik salonları, berberler ve kuaförler için geliştirilmiş 
              modern CRM ve randevu yönetim sistemi.
            </p>
            <div className="flex items-center text-white/60">
              <span>Türkiye'de</span>
              <Heart className="h-4 w-4 mx-2 text-red-400" />
              <span>ile geliştirildi</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Hızlı Bağlantılar</h4>
            <ul className="space-y-2 text-white/80">
              <li><a href="#" className="hover:text-white transition-colors">Ana Sayfa</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Özellikler</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Fiyatlar</a></li>
              <li><a href="#" className="hover:text-white transition-colors">İletişim</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Destek</h4>
            <ul className="space-y-2 text-white/80">
              <li><a href="#" className="hover:text-white transition-colors">Yardım Merkezi</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Canlı Destek</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Gizlilik</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Şartlar</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
          <p>&copy; 2024 KendineGöre. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
};
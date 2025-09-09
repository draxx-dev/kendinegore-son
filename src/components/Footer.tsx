import { Mail, Phone, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Footer = () => {
  const [openModal, setOpenModal] = useState<string | null>(null);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openLegalModal = (type: string) => {
    setOpenModal(type);
  };

      return (
        <footer className="bg-white text-gray-700 py-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              KendineGöre
            </h3>
                <p className="text-gray-600 mb-4 max-w-md text-sm leading-relaxed">
                  Güzellik salonları, berberler ve kuaförler için geliştirilmiş
                  modern CRM ve randevu yönetim sistemi.
                </p>

                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-3 text-indigo-500" />
                    <span>info@kendinegore.com</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-3 text-indigo-500" />
                    <span>+90 (850) 308 6806</span>
                  </div>
                </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-lg">Hızlı Bağlantılar</h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <button
                  onClick={() => scrollToSection('hero')}
                  className="hover:text-indigo-500 transition-colors text-sm"
                >
                  Ana Sayfa
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('features')}
                  className="hover:text-indigo-500 transition-colors text-sm"
                >
                  Özellikler
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="hover:text-indigo-500 transition-colors text-sm"
                >
                  Fiyatlar
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-lg">Yasal</h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <button
                  onClick={() => openLegalModal('privacy')}
                  className="hover:text-indigo-500 transition-colors text-sm"
                >
                  Gizlilik Politikası
                </button>
              </li>
              <li>
                <button
                  onClick={() => openLegalModal('terms')}
                  className="hover:text-indigo-500 transition-colors text-sm"
                >
                  Kullanım Şartları
                </button>
              </li>
              <li>
                <button
                  onClick={() => openLegalModal('cookies')}
                  className="hover:text-indigo-500 transition-colors text-sm"
                >
                  Çerez Politikası
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200/50 mt-6 pt-4">
          <div className="text-center">
            <div className="text-gray-500 text-sm">
              <p>&copy; 2025 KendineGöre. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Modals */}
      <Dialog open={openModal === 'privacy'} onOpenChange={() => setOpenModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gizlilik Politikası</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <h3 className="font-semibold text-lg">1. Toplanan Bilgiler</h3>
            <p>
              KendineGöre olarak, hizmetlerimizi sunabilmek için aşağıdaki kişisel bilgileri topluyoruz:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Ad, soyad ve iletişim bilgileri</li>
              <li>E-posta adresi ve telefon numarası</li>
              <li>İşletme bilgileri ve randevu kayıtları</li>
              <li>Kullanım verileri ve analitik bilgiler</li>
            </ul>

            <h3 className="font-semibold text-lg">2. Bilgilerin Kullanımı</h3>
            <p>
              Topladığımız bilgileri aşağıdaki amaçlarla kullanırız:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Hizmetlerimizi sunmak ve geliştirmek</li>
              <li>Müşteri desteği sağlamak</li>
              <li>Yasal yükümlülüklerimizi yerine getirmek</li>
              <li>Güvenlik ve kalite kontrolü</li>
            </ul>

            <h3 className="font-semibold text-lg">3. Bilgi Paylaşımı</h3>
            <p>
              Kişisel bilgilerinizi üçüncü taraflarla paylaşmayız, ancak yasal zorunluluklar veya mahkeme kararları durumunda bu bilgileri paylaşabiliriz.
            </p>

            <h3 className="font-semibold text-lg">4. Veri Güvenliği</h3>
            <p>
              Bilgilerinizi korumak için endüstri standardı güvenlik önlemleri alırız. Verileriniz SSL şifreleme ile korunur ve güvenli sunucularda saklanır.
            </p>

            <h3 className="font-semibold text-lg">5. İletişim</h3>
            <p>
              Gizlilik politikamız hakkında sorularınız için info@kendinegore.com adresinden bizimle iletişime geçebilirsiniz.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openModal === 'terms'} onOpenChange={() => setOpenModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kullanım Şartları</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <h3 className="font-semibold text-lg">1. Hizmet Tanımı</h3>
            <p>
              KendineGöre, güzellik salonları, berberler ve kuaförler için CRM ve randevu yönetim hizmetleri sunar.
            </p>

            <h3 className="font-semibold text-lg">2. Kullanıcı Yükümlülükleri</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Doğru ve güncel bilgiler sağlamak</li>
              <li>Hizmeti yasal amaçlarla kullanmak</li>
              <li>Diğer kullanıcıların haklarına saygı göstermek</li>
              <li>Güvenlik önlemlerini almak</li>
            </ul>

            <h3 className="font-semibold text-lg">3. Yasaklı Kullanımlar</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Yasadışı faaliyetlerde bulunmak</li>
              <li>Sistemi hacklemeye çalışmak</li>
              <li>Başkalarının hesaplarını kullanmak</li>
              <li>Zararlı yazılım yaymak</li>
            </ul>

            <h3 className="font-semibold text-lg">4. Hizmet Değişiklikleri</h3>
            <p>
              KendineGöre, hizmetlerini önceden bildirimde bulunarak değiştirme hakkını saklı tutar.
            </p>

            <h3 className="font-semibold text-lg">5. Sorumluluk Sınırları</h3>
            <p>
              KendineGöre, hizmetlerin kesintisiz olmasını garanti etmez. Kullanıcılar, hizmet kullanımından doğabilecek zararlardan sorumludur.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openModal === 'cookies'} onOpenChange={() => setOpenModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Çerez Politikası</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <h3 className="font-semibold text-lg">1. Çerez Nedir?</h3>
            <p>
              Çerezler, web sitelerinin kullanıcı deneyimini geliştirmek için kullandığı küçük metin dosyalarıdır.
            </p>

            <h3 className="font-semibold text-lg">2. Kullandığımız Çerez Türleri</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Zorunlu Çerezler:</strong> Sitenin temel işlevselliği için gerekli</li>
              <li><strong>Analitik Çerezler:</strong> Site kullanımını analiz etmek için</li>
              <li><strong>Fonksiyonel Çerezler:</strong> Kullanıcı tercihlerini hatırlamak için</li>
              <li><strong>Pazarlama Çerezleri:</strong> Kişiselleştirilmiş reklamlar için</li>
            </ul>

            <h3 className="font-semibold text-lg">3. Çerez Yönetimi</h3>
            <p>
              Tarayıcınızın ayarlarından çerezleri yönetebilir veya devre dışı bırakabilirsiniz. Ancak bu durumda sitenin bazı özellikleri çalışmayabilir.
            </p>

            <h3 className="font-semibold text-lg">4. Üçüncü Taraf Çerezler</h3>
            <p>
              Google Analytics gibi üçüncü taraf hizmetlerin çerezlerini kullanabiliriz. Bu çerezlerin kullanımı ilgili hizmet sağlayıcılarının politikalarına tabidir.
            </p>

            <h3 className="font-semibold text-lg">5. Çerez Onayı</h3>
            <p>
              Sitemizi kullanarak çerez politikamızı kabul etmiş olursunuz. Çerez tercihlerinizi istediğiniz zaman değiştirebilirsiniz.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
};
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building, 
  Save,
  MapPin,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  Globe
} from "lucide-react";

interface Business {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  slug: string;
  country_code: string;
}

// Ülke kodları listesi
const countryCodes = [
  { code: '+90', name: 'Türkiye', flag: '🇹🇷' },
  { code: '+421', name: 'Slovakya', flag: '🇸🇰' },
  { code: '+420', name: 'Çekya', flag: '🇨🇿' },
  { code: '+43', name: 'Avusturya', flag: '🇦🇹' },
  { code: '+49', name: 'Almanya', flag: '🇩🇪' },
  { code: '+33', name: 'Fransa', flag: '🇫🇷' },
  { code: '+44', name: 'İngiltere', flag: '🇬🇧' },
  { code: '+39', name: 'İtalya', flag: '🇮🇹' },
  { code: '+34', name: 'İspanya', flag: '🇪🇸' },
  { code: '+31', name: 'Hollanda', flag: '🇳🇱' },
  { code: '+32', name: 'Belçika', flag: '🇧🇪' },
  { code: '+41', name: 'İsviçre', flag: '🇨🇭' },
  { code: '+45', name: 'Danimarka', flag: '🇩🇰' },
  { code: '+46', name: 'İsveç', flag: '🇸🇪' },
  { code: '+47', name: 'Norveç', flag: '🇳🇴' },
  { code: '+358', name: 'Finlandiya', flag: '🇫🇮' },
  { code: '+48', name: 'Polonya', flag: '🇵🇱' },
  { code: '+36', name: 'Macaristan', flag: '🇭🇺' },
  { code: '+40', name: 'Romanya', flag: '🇷🇴' },
  { code: '+359', name: 'Bulgaristan', flag: '🇧🇬' },
  { code: '+385', name: 'Hırvatistan', flag: '🇭🇷' },
  { code: '+386', name: 'Slovenya', flag: '🇸🇮' },
  { code: '+372', name: 'Estonya', flag: '🇪🇪' },
  { code: '+371', name: 'Letonya', flag: '🇱🇻' },
  { code: '+370', name: 'Litvanya', flag: '🇱🇹' },
  { code: '+1', name: 'ABD/Kanada', flag: '🇺🇸' },
  { code: '+7', name: 'Rusya', flag: '🇷🇺' },
  { code: '+86', name: 'Çin', flag: '🇨🇳' },
  { code: '+81', name: 'Japonya', flag: '🇯🇵' },
  { code: '+82', name: 'Güney Kore', flag: '🇰🇷' },
  { code: '+91', name: 'Hindistan', flag: '🇮🇳' },
  { code: '+971', name: 'BAE', flag: '🇦🇪' },
  { code: '+966', name: 'Suudi Arabistan', flag: '🇸🇦' },
  { code: '+20', name: 'Mısır', flag: '🇪🇬' },
  { code: '+27', name: 'Güney Afrika', flag: '🇿🇦' },
  { code: '+55', name: 'Brezilya', flag: '🇧🇷' },
  { code: '+54', name: 'Arjantin', flag: '🇦🇷' },
  { code: '+52', name: 'Meksika', flag: '🇲🇽' },
  { code: '+61', name: 'Avustralya', flag: '🇦🇺' },
  { code: '+64', name: 'Yeni Zelanda', flag: '🇳🇿' }
];

const BusinessDetails = () => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (businessError) throw businessError;
      setBusiness(businessData);
    } catch (error) {
      toast({
        title: "Hata",
        description: "İşletme bilgileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBusiness = async () => {
    if (!business) return;

    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: business.name,
          description: business.description,
          phone: business.phone,
          email: business.email,
          address: business.address,
          city: business.city,
          district: business.district,
          country_code: business.country_code
        })
        .eq('id', business.id);

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "İşletme bilgileri güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "İşletme bilgileri güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Building className="h-8 w-8 text-brand-primary" />
          İşletme Detayları
        </h1>
        <p className="text-muted-foreground mt-1">
          İşletmenizin temel bilgilerini yönetin.
        </p>
      </div>

      {/* Genel Bilgiler */}
      {business && (
        <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
          <CardHeader>
            <CardTitle>Genel Bilgiler</CardTitle>
            <CardDescription>
              İşletmenizin temel bilgilerini güncelleyin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">İşletme Adı</Label>
              <Input
                id="business_name"
                value={business.name}
                onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                placeholder="İşletme Adı"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={business.description || ""}
                onChange={(e) => setBusiness({ ...business, description: e.target.value })}
                placeholder="İşletmeniz hakkında detaylı bilgi"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <div className="flex gap-2">
                  <Select
                    value={business.country_code || '+90'}
                    onValueChange={(value) => setBusiness({ ...business, country_code: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.code}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    value={business.phone || ""}
                    onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                    placeholder="212 123 45 67"
                    className="flex-1"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  SMS gönderiminde kullanılacak ülke kodu ve telefon numarası
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={business.email || ""}
                  onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                  placeholder="info@salon.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  value={business.address || ""}
                  onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                  placeholder="Tam adres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Şehir</Label>
                <Input
                  id="city"
                  value={business.city || ""}
                  onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                  placeholder="Şehir"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">İlçe</Label>
                <Input
                  id="district"
                  value={business.district || ""}
                  onChange={(e) => setBusiness({ ...business, district: e.target.value })}
                  placeholder="İlçe"
                />
              </div>
            </div>

            <Button onClick={handleUpdateBusiness} variant="brand">
              <Save className="h-4 w-4 mr-2" />
              Bilgileri Güncelle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* İşletme Özeti */}
      {business && (
        <Card className="bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 border-brand-primary/20">
          <CardHeader>
            <CardTitle>İşletme Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-brand-primary" />
                <span className="font-semibold text-lg">{business.name}</span>
              </div>
              
              {business.description && (
                <p className="text-muted-foreground">{business.description}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {business.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{business.phone}</span>
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{business.email}</span>
                  </div>
                )}
                {business.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {business.address}
                      {business.city && `, ${business.city}`}
                      {business.district && `, ${business.district}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card className="bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 border-brand-primary/20">
        <CardHeader>
          <CardTitle>Hızlı Bağlantılar</CardTitle>
          <CardDescription>
            İşletmenizi yönetmek için diğer sayfalara hızla ulaşın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 justify-start"
              onClick={() => window.location.href = '/dashboard/online-booking'}
            >
              <CalendarIcon className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Online Randevu</div>
                <div className="text-sm text-muted-foreground">Portföy ve randevu ayarları</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 justify-start"
              onClick={() => window.location.href = '/dashboard/services'}
            >
              <div className="h-5 w-5 mr-3 flex items-center justify-center">✂️</div>
              <div className="text-left">
                <div className="font-semibold">Hizmetler</div>
                <div className="text-sm text-muted-foreground">Hizmet yönetimi</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessDetails;
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Save,
  Building
} from "lucide-react";

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

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  business_id: string | null;
  country_code?: string;
}

interface Business {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country_code?: string;
}

const Settings = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      // Profil bilgilerini al
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile({
        ...profileData,
        country_code: profileData?.country_code || '+90'
      });

      // İşletme bilgilerini al
      if (profileData?.business_id) {
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', profileData.business_id)
          .maybeSingle();

        if (businessError) throw businessError;
        setBusiness({
          ...businessData,
          country_code: businessData?.country_code || '+90'
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kullanıcı bilgileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          country_code: profile.country_code
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Profil bilgileriniz güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Profil güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
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
          <SettingsIcon className="h-8 w-8 text-brand-primary" />
          Ayarlar
        </h1>
        <p className="text-muted-foreground mt-1">
          Hesap ve işletme ayarlarınızı yönetin.
        </p>
      </div>

      {/* Profil Ayarları */}
      <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil Bilgileri
          </CardTitle>
          <CardDescription>
            Kişisel bilgilerinizi güncelleyin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Ad</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name || ""}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    placeholder="Adınız"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Soyad</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name || ""}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    placeholder="Soyadınız"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <div className="flex gap-2">
                  <Select
                    value={profile.country_code || '+90'}
                    onValueChange={(value) => setProfile({ ...profile, country_code: value })}
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
                    value={profile.phone || ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="555 123 45 67"
                    className="flex-1"
                  />
                </div>
              </div>
              <Button onClick={handleUpdateProfile} variant="brand">
                <Save className="h-4 w-4 mr-2" />
                Profili Güncelle
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* İşletme Ayarları */}
      {business && (
        <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              İşletme Bilgileri
            </CardTitle>
            <CardDescription>
              İşletmenizin genel bilgilerini güncelleyin.
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
              <Label htmlFor="business_description">Açıklama</Label>
              <Textarea
                id="business_description"
                value={business.description || ""}
                onChange={(e) => setBusiness({ ...business, description: e.target.value })}
                placeholder="İşletmeniz hakkında kısa bir açıklama"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_phone">Telefon</Label>
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
                    id="business_phone"
                    value={business.phone || ""}
                    onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                    placeholder="212 123 45 67"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_email">E-posta</Label>
                <Input
                  id="business_email"
                  type="email"
                  value={business.email || ""}
                  onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                  placeholder="info@salon.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_address">Adres</Label>
                <Input
                  id="business_address"
                  value={business.address || ""}
                  onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                  placeholder="Tam adres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_city">Şehir</Label>
                <Input
                  id="business_city"
                  value={business.city || ""}
                  onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                  placeholder="Şehir"
                />
              </div>
            </div>
            <Button onClick={handleUpdateBusiness} variant="brand">
              <Save className="h-4 w-4 mr-2" />
              İşletme Bilgilerini Güncelle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bildirim Ayarları */}
      <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Bildirim Ayarları
          </CardTitle>
          <CardDescription>
            Hangi bildirimleri almak istediğinizi seçin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>E-posta Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Yeni randevular ve önemli güncellemeler için e-posta alın.
              </p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => 
                setNotifications({ ...notifications, email: checked })
              }
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Acil durumlar ve randevu hatırlatmaları için SMS alın.
              </p>
            </div>
            <Switch
              checked={notifications.sms}
              onCheckedChange={(checked) => 
                setNotifications({ ...notifications, sms: checked })
              }
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Tarayıcı bildirimleri ile anlık güncellemeler alın.
              </p>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={(checked) => 
                setNotifications({ ...notifications, push: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Güvenlik */}
      <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Güvenlik
          </CardTitle>
          <CardDescription>
            Hesap güvenliği ayarları.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full">
            Şifre Değiştir
          </Button>
          <Button variant="outline" className="w-full">
            İki Faktörlü Kimlik Doğrulama
          </Button>
          <Button variant="destructive" className="w-full">
            Hesabı Sil
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
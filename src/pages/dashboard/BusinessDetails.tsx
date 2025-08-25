import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building, 
  Save,
  MapPin,
  Phone,
  Mail,
  Calendar as CalendarIcon
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
}

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
          district: business.district
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
                <Input
                  id="phone"
                  value={business.phone || ""}
                  onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                  placeholder="0212 123 45 67"
                />
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
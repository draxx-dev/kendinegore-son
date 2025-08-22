import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building, 
  Upload, 
  Image as ImageIcon, 
  Save,
  Plus,
  X,
  MapPin,
  Phone,
  Mail,
  Clock
} from "lucide-react";

interface Business {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
}

interface BusinessImage {
  id: string;
  url: string;
  title: string;
  description: string;
}

const BusinessDetails = () => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newImage, setNewImage] = useState({
    url: "",
    title: "",
    description: ""
  });
  const [showAddImage, setShowAddImage] = useState(false);

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

      // Mock portfolio images (you can later integrate with Supabase Storage)
      setImages([
        {
          id: "1",
          url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400",
          title: "Salon İç Mekan",
          description: "Modern ve şık salon tasarımımız"
        },
        {
          id: "2", 
          url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400",
          title: "Saç Kesim Örnekleri",
          description: "Uzman ekibimizin çalışma örnekleri"
        }
      ]);
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
          city: business.city
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

  const handleAddImage = () => {
    if (!newImage.url || !newImage.title) {
      toast({
        title: "Hata",
        description: "URL ve başlık alanları zorunludur.",
        variant: "destructive",
      });
      return;
    }

    const newImageObj: BusinessImage = {
      id: Date.now().toString(),
      ...newImage
    };

    setImages([...images, newImageObj]);
    setNewImage({ url: "", title: "", description: "" });
    setShowAddImage(false);

    toast({
      title: "Başarılı!",
      description: "Resim portföye eklendi.",
    });
  };

  const handleRemoveImage = (imageId: string) => {
    setImages(images.filter(img => img.id !== imageId));
    toast({
      title: "Başarılı!",
      description: "Resim portföyden kaldırıldı.",
    });
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
          İşletmenizin bilgilerini ve portföyünü yönetin.
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <span className="text-sm">{business.address}, {business.city}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portföy */}
      <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Portföy
              </CardTitle>
              <CardDescription>
                İşletmenizin fotoğraflarını ve çalışma örneklerini paylaşın.
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddImage(true)} 
              variant="brand"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Resim Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Yeni Resim Ekleme Formu */}
          {showAddImage && (
            <Card className="mb-6 bg-brand-accent/10">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image_url">Resim URL</Label>
                  <Input
                    id="image_url"
                    value={newImage.url}
                    onChange={(e) => setNewImage({ ...newImage, url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_title">Başlık</Label>
                  <Input
                    id="image_title"
                    value={newImage.title}
                    onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                    placeholder="Resim başlığı"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_description">Açıklama</Label>
                  <Textarea
                    id="image_description"
                    value={newImage.description}
                    onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
                    placeholder="Resim açıklaması"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddImage} variant="brand" size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Ekle
                  </Button>
                  <Button 
                    onClick={() => setShowAddImage(false)} 
                    variant="outline" 
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    İptal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resim Galerisi */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src={image.url} 
                    alt={image.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400";
                    }}
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm">{image.title}</h3>
                    <Button
                      onClick={() => handleRemoveImage(image.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive p-1 h-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {image.description && (
                    <p className="text-xs text-muted-foreground">{image.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {images.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Henüz resim eklenmemiş</h3>
              <p className="text-muted-foreground mb-4">
                İşletmenizin fotoğraflarını ekleyerek portföyünüzü oluşturun.
              </p>
              <Button onClick={() => setShowAddImage(true)} variant="brand">
                <Plus className="h-4 w-4 mr-2" />
                İlk Resmi Ekle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessDetails;
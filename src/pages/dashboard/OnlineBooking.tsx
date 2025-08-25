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
  Upload, 
  Image as ImageIcon, 
  Save,
  Plus,
  X,
  Calendar as CalendarIcon,
  ExternalLink,
  Copy,
  Eye,
  Settings,
  Phone,
  Mail
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
  show_email_in_booking: boolean;
  show_phone_in_booking: boolean;
}

interface BusinessImage {
  id: string;
  url: string;
  title: string;
  description: string;
}

const OnlineBooking = () => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newImage, setNewImage] = useState({
    file: null as File | null,
    title: "",
    description: ""
  });
  const [showAddImage, setShowAddImage] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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

      // Fetch portfolio images from Supabase Storage
      await fetchPortfolioImages(user.id);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioImages = async (userId: string) => {
    try {
      const { data: files, error } = await supabase.storage
        .from('business-portfolio')
        .list(userId, {
          limit: 100,
          offset: 0
        });

      if (error) throw error;

      const imagePromises = files?.map(async (file) => {
        const { data: { publicUrl } } = supabase.storage
          .from('business-portfolio')
          .getPublicUrl(`${userId}/${file.name}`);
        
        return {
          id: file.name,
          url: publicUrl,
          title: file.name.split('.')[0].replace(/[-_]/g, ' '),
          description: ""
        };
      }) || [];

      const imageResults = await Promise.all(imagePromises);
      setImages(imageResults);
    } catch (error) {
      console.error('Portfolio resimleri yüklenirken hata:', error);
    }
  };

  const handleRegenerateSlug = async () => {
    if (!business) return;

    try {
      const { data, error } = await supabase.rpc('generate_business_slug', {
        business_name: business.name,
        city_name: business.city,
        district_name: business.district
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('businesses')
        .update({ slug: data })
        .eq('id', business.id);

      if (updateError) throw updateError;

      setBusiness({ ...business, slug: data });

      toast({
        title: "Başarılı!",
        description: "Online randevu linki güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Link güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleAddImage = async () => {
    if (!newImage.file || !newImage.title) {
      toast({
        title: "Hata",
        description: "Dosya ve başlık alanları zorunludur.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const fileExt = newImage.file.name.split('.').pop();
      const fileName = `${newImage.title.replace(/\s+/g, '-')}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-portfolio')
        .upload(filePath, newImage.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-portfolio')
        .getPublicUrl(filePath);

      const newImageObj: BusinessImage = {
        id: fileName,
        url: publicUrl,
        title: newImage.title,
        description: newImage.description
      };

      setImages([...images, newImageObj]);
      setNewImage({ file: null, title: "", description: "" });
      setShowAddImage(false);

      toast({
        title: "Başarılı!",
        description: "Resim portföye eklendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Resim yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const filePath = `${user.id}/${imageId}`;
      const { error } = await supabase.storage
        .from('business-portfolio')
        .remove([filePath]);

      if (error) throw error;

      setImages(images.filter(img => img.id !== imageId));
      toast({
        title: "Başarılı!",
        description: "Resim portföyden kaldırıldı.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Resim silinirken bir hata oluştu.",
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
          <CalendarIcon className="h-8 w-8 text-brand-primary" />
          Online Randevu
        </h1>
        <p className="text-muted-foreground mt-1">
          Online randevu sayfanızı yönetin ve portföyünüzü düzenleyin.
        </p>
      </div>

      {/* Online Randevu Linki */}
      {business && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Online Randevu Linki
            </CardTitle>
            <CardDescription className="text-green-700">
              Müşterileriniz bu link üzerinden online randevu alabilirler.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Online Randevu Linkiniz:</p>
                    <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded">
                      {window.location.origin}/randevu/{business.slug}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/randevu/${business.slug}`);
                        toast({
                          title: "Başarılı!",
                          description: "Link panoya kopyalandı.",
                        });
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Kopyala
                    </Button>
                    <Button
                      onClick={handleRegenerateSlug}
                      variant="outline"
                      size="sm"
                    >
                      Yenile
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(`${window.location.origin}/randevu/${business.slug}`, '_blank')}
                  variant="brand"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Önizleme Yap
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Randevu Görünürlük Ayarları */}
      {business && (
        <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Randevu Sayfası Görünürlük Ayarları
            </CardTitle>
            <CardDescription>
              Müşterilerinizin randevu alırken hangi iletişim bilgilerinizi görebileceğini ayarlayın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <div>
                    <Label className="text-sm font-medium">Telefon Numarası</Label>
                    <p className="text-xs text-muted-foreground">
                      {business.phone || "Telefon numarası belirtilmemiş"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={business.show_phone_in_booking}
                  onCheckedChange={async (checked) => {
                    try {
                      const { error } = await supabase
                        .from('businesses')
                        .update({ show_phone_in_booking: checked })
                        .eq('id', business.id);

                      if (error) throw error;

                      setBusiness({ ...business, show_phone_in_booking: checked });
                      toast({
                        title: "Başarılı!",
                        description: `Telefon numarası görünürlüğü ${checked ? 'açıldı' : 'kapatıldı'}.`,
                      });
                    } catch (error) {
                      toast({
                        title: "Hata",
                        description: "Ayar güncellenirken bir hata oluştu.",
                        variant: "destructive",
                      });
                    }
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-green-600" />
                  <div>
                    <Label className="text-sm font-medium">E-posta Adresi</Label>
                    <p className="text-xs text-muted-foreground">
                      {business.email || "E-posta adresi belirtilmemiş"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={business.show_email_in_booking}
                  onCheckedChange={async (checked) => {
                    try {
                      const { error } = await supabase
                        .from('businesses')
                        .update({ show_email_in_booking: checked })
                        .eq('id', business.id);

                      if (error) throw error;

                      setBusiness({ ...business, show_email_in_booking: checked });
                      toast({
                        title: "Başarılı!",
                        description: `E-posta adresi görünürlüğü ${checked ? 'açıldı' : 'kapatıldı'}.`,
                      });
                    } catch (error) {
                      toast({
                        title: "Hata",
                        description: "Ayar güncellenirken bir hata oluştu.",
                        variant: "destructive",
                      });
                    }
                  }}
                />
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
                İşletmenizin fotoğraflarını ve çalışma örneklerini müşterilerinizle paylaşın.
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
                  <Label htmlFor="image_file">Resim Dosyası</Label>
                  <Input
                    id="image_file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewImage({ ...newImage, file: e.target.files?.[0] || null })}
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
                    onClick={() => {
                      setShowAddImage(false);
                      setNewImage({ file: null, title: "", description: "" });
                    }} 
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
                İşletmenizin fotoğraflarını ekleyerek müşterilerinize portföyünüzü gösterin.
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

export default OnlineBooking;
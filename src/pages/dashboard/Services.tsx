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
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  DollarSign,
  Scissors,
  Save,
  X
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_minutes: 30,
    price: 0
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Hizmetler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleCreateService = async () => {
    try {
      // Get user's business_id from their profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");
      
      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (businessError) throw businessError;
      if (!businesses) {
        throw new Error("İşletme bulunamadı. Lütfen sayfayı yenileyin.");
      }

      const { error } = await supabase
        .from('services')
        .insert([{
          ...formData,
          business_id: businesses.id,
          is_active: true
        }]);

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Yeni hizmet eklendi.",
      });

      setFormData({ name: "", description: "", duration_minutes: 30, price: 0 });
      setShowNewServiceForm(false);
      fetchServices();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Hizmet eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    try {
      const { error } = await supabase
        .from('services')
        .update(formData)
        .eq('id', editingService.id);

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Hizmet güncellendi.",
      });

      setEditingService(null);
      fetchServices();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Hizmet güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Bu hizmeti silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Hizmet silindi.",
      });

      fetchServices();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Hizmet silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const startEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      duration_minutes: service.duration_minutes,
      price: service.price
    });
  };

  const cancelEdit = () => {
    setEditingService(null);
    setFormData({ name: "", description: "", duration_minutes: 30, price: 0 });
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Scissors className="h-8 w-8 text-brand-primary" />
            Hizmet Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">
            Salon hizmetlerinizi buradan yönetebilirsiniz.
          </p>
        </div>
        <Button 
          onClick={() => setShowNewServiceForm(true)}
          variant="brand"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Yeni Hizmet
        </Button>
      </div>

      {/* New Service Form */}
      {showNewServiceForm && (
        <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
          <CardHeader>
            <CardTitle>Yeni Hizmet Ekle</CardTitle>
            <CardDescription>
              Yeni bir hizmet tanımı oluşturun.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hizmet Adı</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Örn: Saç Kesimi"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Fiyat (₺)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Süre (Dakika)</Label>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min="5"
                step="5"
                placeholder="30"
                value={formData.duration_minutes}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Hizmet açıklaması..."
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateService} variant="brand">
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
              <Button 
                onClick={() => {
                  setShowNewServiceForm(false);
                  setFormData({ name: "", description: "", duration_minutes: 30, price: 0 });
                }}
                variant="outline"
              >
                <X className="h-4 w-4 mr-2" />
                İptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="bg-white/50 backdrop-blur-sm border-brand-primary/10 hover:shadow-soft transition-all duration-300">
            {editingService?.id === service.id ? (
              /* Edit Form */
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Hizmet Adı</Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Fiyat (₺)</Label>
                    <Input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Süre (dk)</Label>
                    <Input
                      name="duration_minutes"
                      type="number"
                      min="5"
                      step="5"
                      value={formData.duration_minutes}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateService} size="sm" variant="brand">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button onClick={cancelEdit} size="sm" variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            ) : (
              /* Service Display */
              <>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      {service.description && (
                        <CardDescription className="mt-1">
                          {service.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={service.is_active ? "default" : "secondary"}>
                      {service.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm">Fiyat</span>
                      </div>
                      <span className="font-semibold text-lg">₺{service.price}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Süre</span>
                      </div>
                      <span className="font-medium">{service.duration_minutes} dk</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => startEdit(service)}
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Düzenle
                      </Button>
                      <Button 
                        onClick={() => handleDeleteService(service.id)}
                        size="sm" 
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Scissors className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Henüz hizmet eklenmemiş
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              İlk hizmetinizi ekleyerek başlayın.
            </p>
            <Button 
              onClick={() => setShowNewServiceForm(true)}
              variant="brand"
            >
              <Plus className="h-4 w-4 mr-2" />
              İlk Hizmeti Ekle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Services;
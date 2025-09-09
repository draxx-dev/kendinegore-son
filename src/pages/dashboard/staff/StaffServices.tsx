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
import { PermissionGuard } from "@/components/PermissionGuard";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

const StaffServices = () => {
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
      const staffSession = localStorage.getItem('staff_session');
      if (!staffSession) return;

      const session = JSON.parse(staffSession);
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', session.staff.business_id)
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

  const getBusinessId = async () => {
    const staffSession = localStorage.getItem('staff_session');
    if (!staffSession) throw new Error("Personel oturumu bulunamadı");
    
    const session = JSON.parse(staffSession);
    return session.staff.business_id;
  };

  const handleCreateService = async () => {
    try {
      const businessId = await getBusinessId();
      
      const { error } = await supabase
        .from('services')
        .insert([{
          ...formData,
          business_id: businessId,
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
        .update({
          name: formData.name,
          description: formData.description || null,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
        })
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
    if (!confirm("Bu hizmeti silmek istediğinizden emin misiniz? Tüm randevu geçmişi de silinecektir.")) return;

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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}s ${mins > 0 ? mins + 'dk' : ''}`;
    }
    return `${mins}dk`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="view_services">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Scissors className="h-8 w-8 text-brand-primary" />
              Hizmet Yönetimi
          </h1>
            <p className="text-muted-foreground mt-1">
              Hizmet tanımları ve fiyatlandırmayı yönetin.
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
              <div className="space-y-2">
                <Label htmlFor="name">Hizmet Adı *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Örn: Saç Kesimi"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Hizmet hakkında detaylar..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Süre (dakika) *</Label>
                  <Input
                    id="duration_minutes"
                    name="duration_minutes"
                    type="number"
                    min="15"
                    step="15"
                    placeholder="30"
                    value={formData.duration_minutes}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Fiyat (₺) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
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

        {/* Service Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-brand-primary mb-1">{services.length}</div>
              <div className="text-sm text-muted-foreground">Toplam Hizmet</div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {services.filter(s => s.is_active).length}
              </div>
              <div className="text-sm text-muted-foreground">Aktif Hizmet</div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {formatPrice(services.reduce((sum, s) => sum + s.price, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Toplam Değer</div>
          </CardContent>
        </Card>
        </div>

        {/* Service List */}
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
                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Süre (dk)</Label>
                      <Input
                        name="duration_minutes"
                        type="number"
                        min="15"
                        step="15"
                        value={formData.duration_minutes}
                        onChange={handleInputChange}
                      />
                    </div>
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
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDuration(service.duration_minutes)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatPrice(service.price)}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={service.is_active ? "default" : "secondary"}>
                        {service.is_active ? "Aktif" : "Pasif"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {service.description && (
                        <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                          {service.description}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
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
    </PermissionGuard>
  );
};

export default StaffServices;
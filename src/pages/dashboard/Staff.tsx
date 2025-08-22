import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WorkingHoursModal } from "@/components/staff/WorkingHoursModal";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  UserCheck,
  Save,
  X,
  Clock
} from "lucide-react";

interface Staff {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  profile_image_url: string | null;
  specialties: string[] | null;
  is_active: boolean;
}

interface Service {
  id: string;
  name: string;
}

const Staff = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showNewStaffForm, setShowNewStaffForm] = useState(false);
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    profileImage: null as File | null
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchStaff();
    fetchServices();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Personel listesi yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Hizmetler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getBusinessId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Kullanıcı bulunamadı");
    
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!businesses) {
      throw new Error("İşletme bulunamadı. Lütfen sayfayı yenileyin.");
    }

    return businesses.id;
  };

  const handleCreateStaff = async () => {
    try {
      const businessId = await getBusinessId();
      
      let profileImageUrl = null;
      
      // Upload profile image if provided
      if (formData.profileImage) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Kullanıcı bulunamadı");

        const fileExt = formData.profileImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('staff-avatars')
          .upload(fileName, formData.profileImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('staff-avatars')
          .getPublicUrl(fileName);

        profileImageUrl = publicUrl;
      }
      
      const { error } = await supabase
        .from('staff')
        .insert([{
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          profile_image_url: profileImageUrl,
          specialties: selectedServices.length > 0 ? services.filter(s => selectedServices.includes(s.id)).map(s => s.name) : null,
          business_id: businessId,
          is_active: true
        }]);

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Yeni personel eklendi.",
      });

      setFormData({ name: "", email: "", phone: "", profileImage: null });
      setSelectedServices([]);
      setShowNewStaffForm(false);
      fetchStaff();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Personel eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;

    try {
      let profileImageUrl = editingStaff.profile_image_url;
      
      // Upload new profile image if provided
      if (formData.profileImage) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Kullanıcı bulunamadı");

        const fileExt = formData.profileImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('staff-avatars')
          .upload(fileName, formData.profileImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('staff-avatars')
          .getPublicUrl(fileName);

        profileImageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('staff')
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          profile_image_url: profileImageUrl,
          specialties: selectedServices.length > 0 ? services.filter(s => selectedServices.includes(s.id)).map(s => s.name) : null,
        })
        .eq('id', editingStaff.id);

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Personel bilgileri güncellendi.",
      });

      setEditingStaff(null);
      fetchStaff();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Personel güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Bu personeli silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Personel silindi.",
      });

      fetchStaff();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Personel silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const startEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email || "",
      phone: staffMember.phone || "",
      profileImage: null
    });
    // Set selected services based on staff's specialties
    const staffServices = services.filter(service => 
      staffMember.specialties?.some(specialty => specialty === service.name)
    ).map(service => service.id);
    setSelectedServices(staffServices);
  };

  const cancelEdit = () => {
    setEditingStaff(null);
    setFormData({ name: "", email: "", phone: "", profileImage: null });
    setSelectedServices([]);
  };

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleWorkingHoursClick = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setShowWorkingHoursModal(true);
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
            <UserCheck className="h-8 w-8 text-brand-primary" />
            Personel Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">
            Personel bilgilerini ve çalışma saatlerini yönetin.
          </p>
        </div>
        <Button 
          onClick={() => setShowNewStaffForm(true)}
          variant="brand"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Yeni Personel
        </Button>
      </div>

      {/* New Staff Form */}
      {showNewStaffForm && (
        <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
          <CardHeader>
            <CardTitle>Yeni Personel Ekle</CardTitle>
            <CardDescription>
              Yeni bir personel üyesi ekleyin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ad Soyad *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Örn: Ayşe Yılmaz"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="0555 123 45 67"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile_image">Profil Fotoğrafı</Label>
                <Input
                  id="profile_image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, profileImage: e.target.files?.[0] || null })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Uzmanlık Alanları</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => toggleServiceSelection(service.id)}
                    className={`cursor-pointer p-2 rounded-md border text-sm transition-colors ${
                      selectedServices.includes(service.id)
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-background border-border hover:bg-muted'
                    }`}
                  >
                    {service.name}
                  </div>
                ))}
              </div>
              {services.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  Önce hizmet eklemeniz gerekiyor.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateStaff} variant="brand">
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
              <Button 
                onClick={() => {
                  setShowNewStaffForm(false);
                  setFormData({ name: "", email: "", phone: "", profileImage: null });
                  setSelectedServices([]);
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

      {/* Staff List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((staffMember) => (
          <Card key={staffMember.id} className="bg-white/50 backdrop-blur-sm border-brand-primary/10 hover:shadow-soft transition-all duration-300">
            {editingStaff?.id === staffMember.id ? (
              /* Edit Form */
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Ad Soyad</Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Uzmanlık Alanları</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => toggleServiceSelection(service.id)}
                        className={`cursor-pointer p-2 rounded-md border text-sm transition-colors ${
                          selectedServices.includes(service.id)
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-background border-border hover:bg-muted'
                        }`}
                      >
                        {service.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateStaff} size="sm" variant="brand">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button onClick={cancelEdit} size="sm" variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            ) : (
              /* Staff Display */
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={staffMember.profile_image_url || ""} />
                      <AvatarFallback className="bg-brand-primary/10 text-brand-primary">
                        {staffMember.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{staffMember.name}</CardTitle>
                          {staffMember.specialties && staffMember.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {staffMember.specialties.map((specialty, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Badge variant={staffMember.is_active ? "default" : "secondary"}>
                          {staffMember.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {staffMember.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">{staffMember.email}</span>
                      </div>
                    )}
                    {staffMember.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{staffMember.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => startEdit(staffMember)}
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Düzenle
                      </Button>
                      <Button 
                        onClick={() => handleWorkingHoursClick(staffMember)}
                        size="sm" 
                        variant="outline"
                        className="text-muted-foreground hover:text-brand-primary"
                        title="Çalışma Saatleri"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => handleDeleteStaff(staffMember.id)}
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

      {staff.length === 0 && (
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Henüz personel eklenmemiş
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              İlk personel üyenizi ekleyerek başlayın.
            </p>
            <Button 
              onClick={() => setShowNewStaffForm(true)}
              variant="brand"
            >
              <Plus className="h-4 w-4 mr-2" />
              İlk Personeli Ekle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Working Hours Modal */}
      {selectedStaff && (
        <WorkingHoursModal
          open={showWorkingHoursModal}
          onOpenChange={setShowWorkingHoursModal}
          staffId={selectedStaff.id}
          staffName={selectedStaff.name}
        />
      )}
    </div>
  );
};

export default Staff;
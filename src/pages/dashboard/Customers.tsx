import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Phone,
  Users,
  Save,
  X,
  Calendar,
  History,
  Search
} from "lucide-react";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    notes: ""
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Müşteri listesi yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      .limit(1);

    if (error) throw error;
    if (!businesses || businesses.length === 0) {
      throw new Error("İşletme bulunamadı");
    }

    return businesses[0].id;
  };

  const handleCreateCustomer = async () => {
    try {
      const businessId = await getBusinessId();
      
      const { error } = await supabase
        .from('customers')
        .insert([{
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          email: formData.email || null,
          notes: formData.notes || null,
          business_id: businessId
        }]);

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Yeni müşteri eklendi.",
      });

      setFormData({ first_name: "", last_name: "", phone: "", email: "", notes: "" });
      setShowNewCustomerForm(false);
      fetchCustomers();
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast({
          title: "Hata",
          description: "Bu telefon numarası zaten kayıtlı.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Hata",
          description: "Müşteri eklenirken bir hata oluştu.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          email: formData.email || null,
          notes: formData.notes || null,
        })
        .eq('id', editingCustomer.id);

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Müşteri bilgileri güncellendi.",
      });

      setEditingCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast({
          title: "Hata",
          description: "Bu telefon numarası başka bir müşteri tarafından kullanılıyor.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Hata",
          description: "Müşteri güncellenirken bir hata oluştu.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("Bu müşteriyi silmek istediğinizden emin misiniz? Tüm randevu geçmişi de silinecektir.")) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Müşteri silindi.",
      });

      fetchCustomers();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Müşteri silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const startEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      email: customer.email || "",
      notes: customer.notes || ""
    });
  };

  const cancelEdit = () => {
    setEditingCustomer(null);
    setFormData({ first_name: "", last_name: "", phone: "", email: "", notes: "" });
  };

  const filteredCustomers = customers.filter(customer =>
    customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

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
            <Users className="h-8 w-8 text-brand-primary" />
            Müşteri Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">
            Müşteri bilgilerini ve CRM'i yönetin.
          </p>
        </div>
        <Button 
          onClick={() => setShowNewCustomerForm(true)}
          variant="brand"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Yeni Müşteri
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Müşteri ara (ad, soyad veya telefon)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* New Customer Form */}
      {showNewCustomerForm && (
        <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
          <CardHeader>
            <CardTitle>Yeni Müşteri Ekle</CardTitle>
            <CardDescription>
              Yeni bir müşteri kaydı oluşturun.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Ad *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  placeholder="Örn: Ayşe"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Soyad *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Örn: Yılmaz"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="0555 123 45 67"
                  value={formData.phone}
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <textarea
                id="notes"
                name="notes"
                placeholder="Müşteri hakkında notlar..."
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateCustomer} variant="brand">
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
              <Button 
                onClick={() => {
                  setShowNewCustomerForm(false);
                  setFormData({ first_name: "", last_name: "", phone: "", email: "", notes: "" });
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

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-brand-primary mb-1">{customers.length}</div>
            <div className="text-sm text-muted-foreground">Toplam Müşteri</div>
          </CardContent>
        </Card>
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {customers.filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
            </div>
            <div className="text-sm text-muted-foreground">Bu Ay Yeni</div>
          </CardContent>
        </Card>
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {customers.filter(c => c.email).length}
            </div>
            <div className="text-sm text-muted-foreground">E-posta Olan</div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="bg-white/50 backdrop-blur-sm border-brand-primary/10 hover:shadow-soft transition-all duration-300">
            {editingCustomer?.id === customer.id ? (
              /* Edit Form */
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Ad</Label>
                    <Input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Soyad</Label>
                    <Input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                    />
                  </div>
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
                  <Label>E-posta</Label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notlar</Label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateCustomer} size="sm" variant="brand">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button onClick={cancelEdit} size="sm" variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            ) : (
              /* Customer Display */
              <>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {customer.first_name} {customer.last_name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {customer.email}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {customer.notes && (
                      <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                        {customer.notes}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => startEdit(customer)}
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Düzenle
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-muted-foreground hover:text-brand-primary"
                        title="Randevu Geçmişi"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-muted-foreground hover:text-brand-primary"
                        title="Yeni Randevu"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => handleDeleteCustomer(customer.id)}
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

      {filteredCustomers.length === 0 && customers.length > 0 && (
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Arama sonucu bulunamadı
            </h3>
            <p className="text-muted-foreground text-center">
              "{searchTerm}" için eşleşen müşteri bulunamadı.
            </p>
          </CardContent>
        </Card>
      )}

      {customers.length === 0 && (
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Henüz müşteri eklenmemiş
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              İlk müşterinizi ekleyerek başlayın.
            </p>
            <Button 
              onClick={() => setShowNewCustomerForm(true)}
              variant="brand"
            >
              <Plus className="h-4 w-4 mr-2" />
              İlk Müşteriyi Ekle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Customers;
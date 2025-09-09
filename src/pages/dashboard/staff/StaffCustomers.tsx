import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Phone, Mail, Calendar, History, Edit, Plus, Trash2, Save, X } from "lucide-react";
import { PermissionGuard } from "@/components/PermissionGuard";
import CustomerAppointmentHistoryModal from "@/components/customers/CustomerAppointmentHistoryModal";
import { CreateAppointmentModal } from "@/components/appointments/CreateAppointmentModal";

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

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  notes?: string;
  created_at: string;
  _count?: {
    appointments: number;
  };
}

const StaffCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAppointmentHistory, setShowAppointmentHistory] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreateAppointment, setShowCreateAppointment] = useState(false);
  const [appointmentCustomer, setAppointmentCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    notes: "",
    country_code: "+90"
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const staffSession = localStorage.getItem('staff_session');
      if (!staffSession) return;

      const session = JSON.parse(staffSession);
      
      // Get all customers from the same business
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', session.staff.business_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Hata",
        description: "Müşteriler yüklenirken bir hata oluştu.",
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
    const staffSession = localStorage.getItem('staff_session');
    if (!staffSession) throw new Error("Personel oturumu bulunamadı");
    
    const session = JSON.parse(staffSession);
    return session.staff.business_id;
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

      setFormData({ first_name: "", last_name: "", phone: "", email: "", notes: "", country_code: "+90" });
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
      notes: customer.notes || "",
      country_code: "+90" // Default country code for editing
    });
  };

  const cancelEdit = () => {
    setEditingCustomer(null);
    setFormData({ first_name: "", last_name: "", phone: "", email: "", notes: "", country_code: "+90" });
  };

  const filteredCustomers = customers.filter(customer =>
    `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShowAppointmentHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowAppointmentHistory(true);
  };

  const handleCreateAppointment = (customer: Customer) => {
    setAppointmentCustomer(customer);
    setShowCreateAppointment(true);
  };

  const handleAppointmentSuccess = () => {
    fetchCustomers(); // Müşteri listesini yenile
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="view_customers">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Müşteriler
        </h1>
        <p className="text-muted-foreground">
          İşletme müşterilerini görüntüleyin ve yönetin.
        </p>
      </div>

      {/* Header with New Customer Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Müşteri ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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

      {/* New Customer Form */}
      {showNewCustomerForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Yeni Müşteri Ekle</CardTitle>
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
                <div className="flex gap-2">
                  <Select
                    value={formData.country_code}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, country_code: value }))}
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
                    name="phone"
                    placeholder="555 123 45 67"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="flex-1"
                  />
                </div>
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
                  setFormData({ first_name: "", last_name: "", phone: "", email: "", notes: "", country_code: "+90" });
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

      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "Arama kriterlerine uygun müşteri bulunamadı." : "Henüz müşteri kaydı bulunmuyor."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
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
                    <CardTitle className="text-lg">
                      {customer.first_name} {customer.last_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Kayıt: {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      {customer.notes && (
                        <div className="mt-3 p-3 bg-secondary/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            <strong>Notlar:</strong> {customer.notes}
                          </p>
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
                          onClick={() => handleShowAppointmentHistory(customer)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-muted-foreground hover:text-brand-primary"
                          title="Yeni Randevu"
                          onClick={() => handleCreateAppointment(customer)}
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
      )}

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">E-posta Olan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.email).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Bu Ay Eklenen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => 
                new Date(c.created_at).getMonth() === new Date().getMonth() &&
                new Date(c.created_at).getFullYear() === new Date().getFullYear()
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment History Modal */}
      {selectedCustomer && (
        <CustomerAppointmentHistoryModal
          isOpen={showAppointmentHistory}
          onClose={() => {
            setShowAppointmentHistory(false);
            setSelectedCustomer(null);
          }}
          customerId={selectedCustomer.id}
          customerName={`${selectedCustomer.first_name} ${selectedCustomer.last_name}`}
        />
      )}

      {/* Create Appointment Modal */}
      {appointmentCustomer && (
        <CreateAppointmentModal
          open={showCreateAppointment}
          onOpenChange={setShowCreateAppointment}
          onSuccess={handleAppointmentSuccess}
        />
      )}
      </div>
    </PermissionGuard>
  );
};

export default StaffCustomers;
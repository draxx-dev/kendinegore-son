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
  CreditCard, 
  Calendar, 
  User, 
  DollarSign,
  Save,
  X,
  Search,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { PermissionGuard } from "@/components/PermissionGuard";

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  payment_date?: string;
  expected_payment_date?: string;
  notes?: string;
  appointments: {
    appointment_date: string;
    start_time: string;
    service_ids: string[];
    customers: {
      first_name: string;
      last_name: string;
    };
  };
}

const StaffPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    amount: 0,
    payment_method: "cash",
    payment_status: "pending",
    payment_date: "",
    expected_payment_date: "",
    notes: ""
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const staffSession = localStorage.getItem('staff_session');
      if (!staffSession) return;

      const session = JSON.parse(staffSession);
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          appointments!inner (
            appointment_date,
            start_time,
            business_id,
            service_ids,
            customers (first_name, last_name)
          )
        `)
        .eq('appointments.business_id', session.staff.business_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ödemeler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreatePayment = async () => {
    try {
      // Bu fonksiyon personel için sadece görüntüleme amaçlı
      toast({
        title: "Bilgi",
        description: "Personel olarak ödeme ekleyemezsiniz.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ödeme eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;

    try {
      // Bu fonksiyon personel için sadece görüntüleme amaçlı
      toast({
        title: "Bilgi",
        description: "Personel olarak ödeme güncelleyemezsiniz.",
      });
      setEditingPayment(null);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ödeme güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Bu ödemeyi silmek istediğinizden emin misiniz?")) return;

    try {
      // Bu fonksiyon personel için sadece görüntüleme amaçlı
      toast({
        title: "Bilgi",
        description: "Personel olarak ödeme silemezsiniz.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ödeme silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const startEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      amount: payment.amount,
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      payment_date: payment.payment_date || "",
      expected_payment_date: payment.expected_payment_date || "",
      notes: payment.notes || ""
    });
  };

  const cancelEdit = () => {
    setEditingPayment(null);
    setFormData({ amount: 0, payment_method: "cash", payment_status: "pending", payment_date: "", expected_payment_date: "", notes: "" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'pending':
        return 'Bekliyor';
      case 'cancelled':
        return 'İptal Edildi';
      case 'refunded':
        return 'İade Edildi';
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Nakit';
      case 'credit_card':
        return 'Kredi Kartı';
      case 'debit_card':
        return 'Banka Kartı';
      case 'bank_transfer':
        return 'Havale';
      default:
        return method;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.appointments.customers.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.appointments.customers.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.appointments.services.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.payment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalAmount = payments
    .filter(p => p.payment_status === 'completed')
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const pendingAmount = payments
    .filter(p => p.payment_status === 'pending')
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="view_payments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-brand-primary" />
              Ödeme Yönetimi
            </h1>
            <p className="text-muted-foreground mt-1">
              Ödemeleri görüntüleyin ve takip edin.
            </p>
          </div>
          <Button 
            onClick={() => setShowNewPaymentForm(true)}
            variant="brand"
            className="flex items-center gap-2"
            disabled
          >
            <Plus className="h-4 w-4" />
            Yeni Ödeme
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Müşteri adı veya hizmet ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="pending">Bekliyor</option>
                  <option value="cancelled">İptal Edildi</option>
                  <option value="refunded">İade Edildi</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{formatPrice(totalAmount)}</div>
              <div className="text-sm text-muted-foreground">Toplam Gelir</div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{formatPrice(pendingAmount)}</div>
              <div className="text-sm text-muted-foreground">Bekleyen Ödemeler</div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-brand-primary mb-1">{payments.length}</div>
              <div className="text-sm text-muted-foreground">Toplam İşlem</div>
            </CardContent>
          </Card>
        </div>

        {/* Payment List */}
        <div className="grid gap-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} className="bg-white/50 backdrop-blur-sm border-brand-primary/10 hover:shadow-soft transition-all duration-300">
              {editingPayment?.id === payment.id ? (
                /* Edit Form - Disabled for staff */
                <CardContent className="p-6 space-y-4">
                  <div className="text-center text-muted-foreground">
                    <p>Personel olarak ödeme düzenleyemezsiniz.</p>
                  </div>
                  <div className="flex justify-center">
                    <Button onClick={cancelEdit} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Kapat
                    </Button>
                  </div>
                </CardContent>
              ) : (
                /* Payment Display */
                <>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {formatPrice(payment.amount)}
                      </CardTitle>
                      <Badge className={getStatusColor(payment.payment_status)}>
                        {getStatusText(payment.payment_status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {payment.appointments.customers.first_name} {payment.appointments.customers.last_name}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(payment.appointments.appointment_date), 'dd MMMM yyyy', { locale: tr })} - {payment.appointments.start_time}
                        </div>
                        <div className="text-sm">
                          <strong>Hizmet:</strong> {payment.appointments.services.name}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {getPaymentMethodText(payment.payment_method)}
                        </div>
                        {payment.payment_date && (
                          <div className="text-sm">
                            <strong>Ödeme Tarihi:</strong> {format(new Date(payment.payment_date), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                          </div>
                        )}
                        {payment.expected_payment_date && !payment.payment_date && (
                          <div className="text-sm">
                            <strong>Beklenen Tarih:</strong> {format(new Date(payment.expected_payment_date), 'dd MMMM yyyy', { locale: tr })}
                          </div>
                        )}
                      </div>
                    </div>
                    {payment.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-muted-foreground">
                          <strong>Notlar:</strong> {payment.notes}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        onClick={() => startEdit(payment)}
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        disabled
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Düzenle (Devre Dışı)
                      </Button>
                      <Button 
                        onClick={() => handleDeletePayment(payment.id)}
                        size="sm" 
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        disabled
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>

        {filteredPayments.length === 0 && payments.length > 0 && (
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Arama sonucu bulunamadı
              </h3>
              <p className="text-muted-foreground text-center">
                "{searchTerm}" için eşleşen ödeme bulunamadı.
              </p>
            </CardContent>
          </Card>
        )}

        {payments.length === 0 && (
          <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Henüz ödeme kaydı bulunmuyor
              </h3>
              <p className="text-muted-foreground text-center">
                Ödeme kayıtları randevular oluşturulduğunda otomatik olarak eklenecektir.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PermissionGuard>
  );
};

export default StaffPayments;
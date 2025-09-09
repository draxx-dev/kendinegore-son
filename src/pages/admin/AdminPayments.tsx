import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  CreditCard, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Phone,
  Building,
  User,
  Package,
  MessageSquare,
  Calendar
} from "lucide-react";

interface PaymentRequest {
  id: string;
  business_id: string;
  request_type: 'subscription' | 'sms_package' | 'bulk_subscription';
  plan_id?: string;
  sms_package_id?: string;
  bulk_months?: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  business_phone?: string;
  profile_phone?: string;
  created_at: string;
  updated_at: string;
  business: {
    name: string;
    phone: string;
  };
  plan?: {
    name: string;
    price_monthly: number;
  };
  sms_package?: {
    name: string;
    sms_count: number;
    price: number;
  };
}

export default function AdminPayments() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  const fetchPaymentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          business:businesses(name, phone, owner_id),
          plan:subscription_plans(name, price_monthly),
          sms_package:sms_packages(name, sms_count, price)
        `)
        .order('created_at', { ascending: false });

      // Her request için profil numarasını ayrı ayrı çek
      const requestsWithProfilePhone = await Promise.all(
        (data || []).map(async (request) => {
          if (request.business?.owner_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('phone')
              .eq('user_id', request.business.owner_id)
              .single();
            
            return {
              ...request,
              profile_phone: profile?.phone || 'N/A'
            };
          }
          return request;
        })
      );

      if (error) throw error;
      setPaymentRequests(requestsWithProfilePhone || []);
    } catch (error) {
      console.error('Payment requests fetch error:', error);
      toast({
        title: "Hata",
        description: "Ödeme talepleri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      // Önce request bilgilerini al
      const request = paymentRequests.find(r => r.id === requestId);
      console.log('Found request for activation:', request);

      console.log('Updating payment_requests with status:', status, 'for ID:', requestId);
      const { data: updateData, error } = await supabase
        .rpc('admin_update_payment_request', {
          request_id: requestId,
          new_status: status,
          notes: adminNotes || null
        });

      if (error) {
        console.error('Payment request update error:', error);
        throw error;
      }
      console.log('Payment request update result:', updateData);

      // Eğer onaylandıysa, aboneliği aktif et
      if (status === 'approved' && request) {
        try {
          console.log('Calling activateSubscription...');
          await activateSubscription(request);
          console.log('Subscription activated successfully');
        } catch (activationError) {
          console.error('Subscription activation failed:', activationError);
          toast({
            title: "Uyarı",
            description: "Ödeme onaylandı ancak abonelik aktif edilemedi. Lütfen manuel olarak kontrol edin.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Durum Güncellendi",
        description: `Ödeme talebi ${status === 'approved' ? 'onaylandı' : 'reddedildi'}.`,
      });

      setShowDetailsModal(false);
      setSelectedRequest(null);
      setAdminNotes("");
      fetchPaymentRequests();
    } catch (error) {
      console.error('Status update error:', error);
      toast({
        title: "Hata",
        description: "Durum güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const activateSubscription = async (request: PaymentRequest) => {
    try {
      console.log('Activating subscription for request:', request);
      
      if (request.request_type === 'subscription' && request.plan_id) {
        // Abonelik aktif et
        console.log('Activating subscription plan:', request.plan_id);
        const { error } = await supabase
          .from('business_subscriptions')
          .update({
            status: 'active',
            plan_id: request.plan_id,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + (request.bulk_months || 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
            whatsapp_ai_enabled: request.plan?.name === 'Premium Plan'
          })
          .eq('business_id', request.business_id);

        if (error) {
          console.error('Subscription update error:', error);
          throw error;
        }
        console.log('Subscription activated successfully');
        
      } else if (request.request_type === 'bulk_subscription' && request.plan_id) {
        // Toplu abonelik aktif et
        console.log('Activating bulk subscription plan:', request.plan_id);
        const { error } = await supabase
          .from('business_subscriptions')
          .update({
            status: 'active',
            plan_id: request.plan_id,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + (request.bulk_months || 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
            whatsapp_ai_enabled: request.plan?.name === 'Premium Plan'
          })
          .eq('business_id', request.business_id);

        if (error) {
          console.error('Bulk subscription update error:', error);
          throw error;
        }
        console.log('Bulk subscription activated successfully');
        
      } else if (request.request_type === 'sms_package' && request.sms_package_id) {
        // SMS hakkı ekle - önce SMS paketi bilgilerini al
        console.log('Adding SMS package:', request.sms_package_id);
        
        const { data: smsPackage, error: smsPackageError } = await supabase
          .from('sms_packages')
          .select('sms_count')
          .eq('id', request.sms_package_id)
          .single();

        if (smsPackageError) {
          console.error('Fetch SMS package error:', smsPackageError);
          throw smsPackageError;
        }

        // Mevcut SMS sayısını al
        const { data: currentSubscriptions, error: fetchError } = await supabase
          .from('business_subscriptions')
          .select('sms_remaining')
          .eq('business_id', request.business_id)
          .limit(1);

        if (fetchError) {
          console.error('Fetch current subscription error:', fetchError);
          throw fetchError;
        }

        const currentSubscription = currentSubscriptions?.[0];
        const newSmsCount = (currentSubscription?.sms_remaining || 0) + (smsPackage?.sms_count || 0);
        console.log('Adding SMS count:', smsPackage?.sms_count, 'New total:', newSmsCount);

        console.log('Updating business_subscriptions with newSmsCount:', newSmsCount);
        const { data: updateData, error } = await supabase
          .from('business_subscriptions')
          .update({
            sms_remaining: newSmsCount
          })
          .eq('business_id', request.business_id)
          .select();

        if (error) {
          console.error('SMS package update error:', error);
          throw error;
        }
        console.log('SMS package update result:', updateData);
        console.log('SMS package added successfully');
      }
    } catch (error) {
      console.error('Subscription activation error:', error);
      throw error; // Re-throw to be caught by the calling function
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getRequestTypeText = (type: string) => {
    switch (type) {
      case 'subscription': return 'Abonelik';
      case 'sms_package': return 'SMS Paketi';
      case 'bulk_subscription': return 'Toplu Abonelik';
      default: return type;
    }
  };

  const filteredRequests = paymentRequests.filter(request => {
    const matchesSearch = request.business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.business.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-brand-primary" />
            Ödeme Talepleri
          </h1>
          <p className="text-gray-600 mt-1">
            İşletmelerden gelen ödeme taleplerini yönetin
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="İşletme adı veya telefon ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                Tümü
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
              >
                Bekleyen
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('approved')}
              >
                Onaylanan
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('rejected')}
              >
                Reddedilen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.business.name}
                    </h3>
                    <Badge className={getStatusColor(request.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        {request.status === 'pending' ? 'Bekliyor' :
                         request.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                      </div>
                    </Badge>
                    <Badge variant="outline">
                      {getRequestTypeText(request.request_type)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span>İşletme: {request.business.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Profil: {request.profile_phone || 'Belirtilmemiş'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(request.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-2xl font-bold text-brand-primary">
                      {formatPrice(request.amount)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {request.request_type === 'subscription' && request.plan && (
                        <span>{request.plan.name} - {request.bulk_months ? `${request.bulk_months} ay` : 'Aylık'}</span>
                      )}
                      {request.request_type === 'sms_package' && request.sms_package && (
                        <span>{request.sms_package.name} ({request.sms_package.sms_count} SMS)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(request);
                      setAdminNotes(request.admin_notes || '');
                      setShowDetailsModal(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Detay
                  </Button>
                  
                  {request.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setAdminNotes(request.admin_notes || '');
                          setShowDetailsModal(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Onayla
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateRequestStatus(request.id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reddet
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Ödeme Talebi Detayları</CardTitle>
              <CardDescription>
                {selectedRequest.business.name} - {getRequestTypeText(selectedRequest.request_type)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">İşletme Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span>{selectedRequest.business.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{selectedRequest.business.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{selectedRequest.profile_phone || 'Belirtilmemiş'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Talep Detayları</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Tür:</span> {getRequestTypeText(selectedRequest.request_type)}
                    </div>
                    <div>
                      <span className="font-medium">Tutar:</span> {formatPrice(selectedRequest.amount)}
                    </div>
                    <div>
                      <span className="font-medium">Durum:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status === 'pending' ? 'Bekliyor' :
                         selectedRequest.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Tarih:</span> {new Date(selectedRequest.created_at).toLocaleString('tr-TR')}
                    </div>
                  </div>
                </div>
              </div>

              {selectedRequest.plan && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Plan Bilgileri</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium">{selectedRequest.plan.name}</div>
                    <div className="text-sm text-gray-600">
                      {formatPrice(selectedRequest.plan.price_monthly)}/ay
                      {selectedRequest.bulk_months && ` (${selectedRequest.bulk_months} ay)`}
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.sms_package && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">SMS Paketi Bilgileri</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium">{selectedRequest.sms_package.name}</div>
                    <div className="text-sm text-gray-600">
                      {selectedRequest.sms_package.sms_count} SMS - {formatPrice(selectedRequest.sms_package.price)}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Admin Notları</h4>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notlarınızı buraya yazın..."
                  rows={3}
                />
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedRequest(null);
                      setAdminNotes("");
                    }}
                  >
                    Kapat
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => updateRequestStatus(selectedRequest.id, 'rejected')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reddet
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => updateRequestStatus(selectedRequest.id, 'approved')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Onayla
                  </Button>
                </div>
              )}

              {selectedRequest.status !== 'pending' && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedRequest(null);
                      setAdminNotes("");
                    }}
                  >
                    Kapat
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}



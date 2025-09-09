import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  CreditCard, 
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Zap,
  MessageSquare,
  TrendingUp,
  Calendar,
  Phone,
  Building,
  User
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  whatsapp_ai_enabled: boolean;
  sms_included: number;
}

interface SMSPackage {
  id: string;
  name: string;
  sms_count: number;
  price: number;
  is_active: boolean;
}

interface BusinessSubscription {
  id: string;
  business_id: string;
  plan_id: string;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  whatsapp_ai_enabled: boolean;
  sms_remaining: number;
  plan: SubscriptionPlan;
}

interface BulkDiscount {
  id: string;
  months: number;
  discount_percentage: number;
}

export default function SystemPayments() {
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [smsPackages, setSmsPackages] = useState<SMSPackage[]>([]);
  const [bulkDiscounts, setBulkDiscounts] = useState<BulkDiscount[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<BusinessSubscription | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSMSPackageModal, setShowSMSPackageModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedSMSPackage, setSelectedSMSPackage] = useState<SMSPackage | null>(null);
  const [selectedBulkMonths, setSelectedBulkMonths] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessPhone, setBusinessPhone] = useState<string>('');
  const [profilePhone, setProfilePhone] = useState<string>('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      // Abonelik planlarını çek
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly');

      // SMS paketlerini çek
      const { data: packages } = await supabase
        .from('sms_packages')
        .select('*')
        .eq('is_active', true)
        .order('sms_count');

      // Toplu indirimleri çek
      const { data: discounts } = await supabase
        .from('bulk_subscription_discounts')
        .select('*')
        .order('months');

      // Mevcut kullanıcının işletmesini ve profilini çek
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id, phone')
        .eq('owner_id', user.id)
        .limit(1);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .limit(1);

      if (businessError) throw businessError;
      if (profileError) throw profileError;

      const business = businessData?.[0];
      const profile = profileData?.[0];

      if (business) {
        // Önce abonelik durumunu güncelle
        const { data: statusData, error: statusError } = await supabase
          .rpc('get_subscription_status', { business_uuid: business.id });

        if (!statusError && statusData) {
          setSubscriptionStatus(statusData);
          setIsExpired(statusData === 'expired');
        }

        // Sonra güncel abonelik verilerini çek
        const { data: subscription } = await supabase
          .from('business_subscriptions')
          .select(`
            *,
            plan:subscription_plans(*)
          `)
          .eq('business_id', business.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        setCurrentSubscription(subscription);
      }

      setBusinessPhone(business?.phone || '');
      setProfilePhone(profile?.phone || '');

      setSubscriptionPlans(plans || []);
      setSmsPackages(packages || []);
      setBulkDiscounts(discounts || []);
    } catch (error) {
      console.error('Subscription data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPaymentRequest = async (type: 'subscription' | 'sms_package' | 'bulk_subscription', data: any) => {
    try {
      // Mevcut kullanıcının işletmesini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (businessError) throw businessError;

      const business = businessData?.[0];
      if (!business) throw new Error('İşletme bulunamadı');

      const requestData = {
        business_id: business.id,
        request_type: type,
        business_phone: businessPhone,
        profile_phone: profilePhone,
        ...data
      };

      const { error } = await supabase
        .from('payment_requests')
        .insert(requestData);

      if (error) throw error;

      toast({
        title: "Ödeme Talebi Oluşturuldu",
        description: "Talebiniz admin paneline iletildi. En kısa sürede dönüş yapılacaktır.",
      });
    } catch (error) {
      console.error('Payment request error:', error);
      toast({
        title: "Hata",
        description: "Ödeme talebi oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price / 100);
  };

  const calculateBulkPrice = (plan: SubscriptionPlan, months: number) => {
    const discount = bulkDiscounts.find(d => d.months === months);
    const totalPrice = plan.price_monthly * months;
    const discountAmount = discount ? (totalPrice * discount.discount_percentage) / 100 : 0;
    return totalPrice - discountAmount;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <CreditCard className="h-10 w-10 text-brand-primary" />
          Sistem Ödemeleri
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          İşletmeniz için uygun abonelik planını seçin ve SMS paketlerinizi yönetin
        </p>
      </div>

      {/* Abonelik Süresi Dolmuş Uyarısı */}
      {isExpired && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-1">
                  Aboneliğinizin Süresi Dolmuş
                </h3>
                <p className="text-red-600">
                  Aboneliğinizin süresi dolduğu için bazı özellikler kısıtlanmıştır. 
                  Hizmetlerinizi kesintisiz kullanmaya devam etmek için aboneliğinizi yenileyin.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mevcut Abonelik Durumu */}
      {currentSubscription && (
        <Card className={`${currentSubscription.status === 'trial' 
          ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200' 
          : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className={`h-6 w-6 ${currentSubscription.status === 'trial' ? 'text-orange-600' : 'text-blue-600'}`} />
              {currentSubscription.status === 'trial' ? 'Deneme Paketi Durumu' : 'Mevcut Abonelik Durumu'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className={`text-2xl font-bold ${currentSubscription.status === 'trial' ? 'text-orange-600' : 'text-blue-600'}`}>
                  {currentSubscription.status === 'trial' ? 'Deneme Paketi' : currentSubscription.plan.name}
                </div>
                <div className="text-sm text-gray-600">
                  {currentSubscription.status === 'trial' ? 'Ücretsiz' : `${formatPrice(currentSubscription.plan.price_monthly)}/ay`}
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {currentSubscription.sms_remaining}
                </div>
                <div className="text-sm text-gray-600">Kalan SMS</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  {currentSubscription.status === 'trial' ? (
                    <Clock className="h-5 w-5 text-orange-500" />
                  ) : currentSubscription.status === 'active' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className={`font-semibold ${
                    currentSubscription.status === 'trial' ? 'text-orange-600' :
                    currentSubscription.status === 'active' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentSubscription.status === 'trial' ? 'Deneme Paketi' :
                     currentSubscription.status === 'active' ? 'Aktif' : 'Süresi Dolmuş'}
                  </span>
                </div>
                {currentSubscription.status === 'trial' && currentSubscription.trial_ends_at && (
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(currentSubscription.trial_ends_at).toLocaleDateString('tr-TR')} tarihine kadar
                  </div>
                )}
                {currentSubscription.status === 'active' && currentSubscription.current_period_end && (
                  <div className="text-xs text-gray-500 mt-1">
                    Üyeliğin bitmesine {(() => {
                      const endDate = new Date(currentSubscription.current_period_end);
                      const now = new Date();
                      
                      // Tarihleri sadece gün olarak karşılaştır (saat farkını yok say)
                      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                      const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      
                      const daysLeft = Math.max(0, Math.ceil((endDateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24)));
                      return daysLeft;
                    })()} gün kaldı
                  </div>
                )}
              </div>
            </div>
            {currentSubscription.status === 'trial' && (
              <div className="mt-4 p-4 bg-orange-100 rounded-lg border border-orange-200">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-800 mb-1">Deneme Paketi Aktif</h4>
                    <p className="text-sm text-orange-700">
                      Şu anda 7 günlük ücretsiz deneme paketini kullanıyorsunuz. 
                      Deneme süreniz bittiğinde tüm özelliklerinizi kesintisiz kullanmaya devam etmek için 
                      aşağıdaki abonelik planlarından birini seçebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Abonelik Planları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-brand-primary" />
            Abonelik Planları
          </CardTitle>
          <CardDescription>
            İşletmeniz için uygun planı seçin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.id} className="relative border-2 hover:border-brand-primary/50 transition-colors">
                {plan.whatsapp_ai_enabled && (
                  <div className="absolute -top-3 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    <Zap className="h-3 w-3 inline mr-1" />
                    WhatsApp AI Dahil
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="text-3xl font-bold text-brand-primary mt-2">
                      {formatPrice(plan.price_monthly)}
                    </div>
                    <div className="text-sm text-gray-500">/ay</div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Tüm randevu yönetimi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Müşteri CRM sistemi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">SMS entegrasyonu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Online randevu sayfası</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Raporlama ve analiz</span>
                    </div>
                    {plan.whatsapp_ai_enabled && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-semibold text-purple-600">WhatsApp AI Asistan</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setSelectedPlan(plan);
                      setShowSubscriptionModal(true);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Satın Al
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SMS Paketleri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-brand-primary" />
            SMS Paketleri
          </CardTitle>
          <CardDescription>
            Ek SMS hakkı satın alın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {smsPackages.map((pkg) => (
              <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-brand-primary mb-2">
                    {pkg.sms_count}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">SMS</div>
                  <div className="text-xl font-bold text-gray-900 mb-4">
                    {formatPrice(pkg.price)}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSelectedSMSPackage(pkg);
                      setShowSMSPackageModal(true);
                    }}
                  >
                    Satın Al
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Toplu Abonelik */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-brand-primary" />
            Toplu Abonelik - Daha Uygun Fiyatlar!
          </CardTitle>
          <CardDescription>
            Uzun dönemli aboneliklerde özel indirimler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {bulkDiscounts.map((discount) => (
              <Card key={discount.id} className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-green-800">
                        {discount.months} Aylık Abonelik
                      </h3>
                      <p className="text-green-600">
                        %{discount.discount_percentage} indirim
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-800">
                        {discount.months} Ay
                      </div>
                      <div className="text-sm text-green-600">
                        En avantajlı seçenek
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subscriptionPlans.map((plan) => {
                      const bulkPrice = calculateBulkPrice(plan, discount.months);
                      const originalPrice = plan.price_monthly * discount.months;
                      const savings = originalPrice - bulkPrice;
                      
                      return (
                        <div key={`${plan.id}-${discount.months}`} className="bg-white p-4 rounded-lg">
                          <div className="text-center">
                            <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                            <div className="text-2xl font-bold text-green-600">
                              {formatPrice(bulkPrice)}
                            </div>
                            <div className="text-sm text-gray-500 line-through">
                              {formatPrice(originalPrice)}
                            </div>
                            <div className="text-xs text-green-600 font-semibold">
                              {formatPrice(savings)} tasarruf
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => {
                                setSelectedPlan(plan);
                                setSelectedBulkMonths(discount.months);
                                setShowSubscriptionModal(true);
                              }}
                            >
                              Satın Al
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Abonelik Satın Alma Modal */}
      {showSubscriptionModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Abonelik Satın Alma</CardTitle>
              <CardDescription>
                {selectedPlan.name} planını satın almak istiyorsunuz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold">{selectedPlan.name}</h4>
                <div className="text-2xl font-bold text-brand-primary">
                  {selectedBulkMonths ? 
                    `${formatPrice(calculateBulkPrice(selectedPlan, selectedBulkMonths))} (${selectedBulkMonths} ay)` :
                    `${formatPrice(selectedPlan.price_monthly)}/ay`
                  }
                </div>
                {selectedBulkMonths && (
                  <div className="text-sm text-green-600">
                    %{bulkDiscounts.find(d => d.months === selectedBulkMonths)?.discount_percentage} indirim uygulandı
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Bu talebiniz admin paneline iletilecek ve onaylandıktan sonra aboneliğiniz aktif hale gelecektir.</p>
                <p className="mt-2 font-semibold">İletişim bilgileriniz:</p>
                <ul className="mt-1 space-y-1">
                  <li>• İşletme telefonu: {businessPhone || 'Belirtilmemiş'}</li>
                  <li>• Profil telefonu: {profilePhone || 'Belirtilmemiş'}</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowSubscriptionModal(false);
                    setSelectedPlan(null);
                    setSelectedBulkMonths(null);
                  }}
                >
                  İptal
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    createPaymentRequest('subscription', {
                      plan_id: selectedPlan.id,
                      bulk_months: selectedBulkMonths,
                      amount: selectedBulkMonths ? 
                        calculateBulkPrice(selectedPlan, selectedBulkMonths) : 
                        selectedPlan.price_monthly
                    });
                    setShowSubscriptionModal(false);
                    setSelectedPlan(null);
                    setSelectedBulkMonths(null);
                  }}
                >
                  Talebi Gönder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SMS Paketi Satın Alma Modal */}
      {showSMSPackageModal && selectedSMSPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>SMS Paketi Satın Alma</CardTitle>
              <CardDescription>
                {selectedSMSPackage.name} paketini satın almak istiyorsunuz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold">{selectedSMSPackage.name}</h4>
                <div className="text-2xl font-bold text-brand-primary">
                  {formatPrice(selectedSMSPackage.price)}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedSMSPackage.sms_count} SMS hakkı
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Bu talebiniz admin paneline iletilecek ve onaylandıktan sonra SMS hakkınız hesabınıza eklenecektir.</p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowSMSPackageModal(false);
                    setSelectedSMSPackage(null);
                  }}
                >
                  İptal
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    createPaymentRequest('sms_package', {
                      sms_package_id: selectedSMSPackage.id,
                      amount: selectedSMSPackage.price
                    });
                    setShowSMSPackageModal(false);
                    setSelectedSMSPackage(null);
                  }}
                >
                  Talebi Gönder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

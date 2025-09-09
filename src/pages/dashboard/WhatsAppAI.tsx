import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageCircle, 
  Settings, 
  Save, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Bot,
  Zap,
  Users,
  Calendar,
  Shield,
  Info,
  QrCode
} from "lucide-react";

const WhatsAppAI = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasWhatsAppAccess, setHasWhatsAppAccess] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    fetchBusinessId();
  }, []);

  useEffect(() => {
    if (businessId) {
      checkSubscriptionAccess();
      fetchAISettings();
    }
  }, [businessId]);

  const checkSubscriptionAccess = async () => {
    if (!businessId) return;

    try {
      // Abonelik durumunu kontrol et
      const { data: statusData, error: statusError } = await supabase
        .rpc('get_subscription_status', { business_uuid: businessId });

      if (statusError) throw statusError;
      
      setSubscriptionStatus(statusData);

      // WhatsApp AI erişimini kontrol et
      const { data: accessData, error: accessError } = await supabase
        .rpc('check_whatsapp_ai_access', { business_uuid: businessId });

      if (accessError) throw accessError;
      
      setHasWhatsAppAccess(accessData);
      
      // Eğer süre bitmişse ve AI aktifse, otomatik pasif moda al
      if (statusData === 'expired' && aiEnabled) {
        setAiEnabled(false);
        // Veritabanını da güncelle
        if (businessId) {
          await supabase
            .from('whatsapp_instances')
            .update({ ai_enabled: false })
            .eq('business_id', businessId);
        }
        toast({
          title: "Abonelik Süresi Dolmuş",
          description: "WhatsApp AI otomatik olarak pasif moda alındı.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Subscription access check error:', error);
      setHasWhatsAppAccess(false);
    }
  };

  // ✅ Otomatik konuşma temizleme - Her 24 saatte bir çalışır
  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('cleanup-conversations');
        if (error) {
          console.error('Cleanup error:', error);
        }
      } catch (error) {
        console.error('Cleanup function error:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 saat

    return () => clearInterval(cleanupInterval);
  }, []);

  const fetchBusinessId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: businesses, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (businesses) {
        setBusinessId(businesses.id);
      }
    } catch (error) {
      console.error('Business ID fetch error:', error);
    }
  };

  const fetchAISettings = async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      
      // WhatsApp instance bilgilerini çek
      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (instanceError) {
        console.error('Instance fetch error:', instanceError);
      }

      if (instance) {
        setInstanceName(instance.instance_name);
        setConnectionStatus(instance.status);
        if (instance.qr_code) {
          setQrCode(instance.qr_code);
        }
        // AI durumunu instance'dan al, eğer yoksa varsayılan olarak false
        setAiEnabled(instance.ai_enabled || false);
      } else {
        setConnectionStatus('disconnected');
        setAiEnabled(false);
      }

      // Varsayılan karşılama mesajı
      setGreetingMessage("Merhaba! [İşletme Adı] için randevu almak ister misiniz? Size yardımcı olabilirim. 😊");
    } catch (error) {
      console.error('AI settings fetch error:', error);
      toast({
        title: "Hata",
        description: "AI ayarları yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstance = async () => {
    if (!businessId) return;

    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        body: {
          action: 'create_instance',
          business_id: businessId,
          instance_name: `business_${businessId}_${Date.now()}`
        }
      });

      if (error) throw error;

      if (data.success) {
        setInstanceName(data.instance.instance_name);
        setConnectionStatus('connecting');
        toast({
          title: "Başarılı!",
          description: "WhatsApp instance oluşturuldu. QR kodu tarayın!",
        });
        
        // QR kod al
        // QR kod evolution_data'dan al
        if (data.evolution_data?.qrcode?.base64) {
          let cleanQrCode = data.evolution_data.qrcode.base64;
          if (cleanQrCode.startsWith('data:image/png;base64,')) {
            cleanQrCode = cleanQrCode.replace('data:image/png;base64,', '');
          }
          setQrCode(cleanQrCode);
        }
      }
    } catch (error) {
      console.error('Create instance error:', error);
      
      // Detaylı hata bilgisi
      let errorMessage = "Instance oluşturulurken bir hata oluştu.";
      let errorDetails = "";
      
      if (error instanceof Error) {
        errorDetails = error.message;
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Supabase FunctionsHttpError için özel handling
      if (error && typeof error === 'object' && 'context' in error) {
        const context = (error as any).context;
        console.error('Error context:', context);
        
        if (context?.body) {
          try {
            const bodyError = JSON.parse(context.body);
            errorDetails = bodyError.error || bodyError.message || context.body;
            console.error('Parsed error body:', bodyError);
          } catch (e) {
            errorDetails = context.body;
          }
        }
      }
      
      toast({
        title: "Hata",
        description: `${errorMessage} ${errorDetails ? `\n\nDetay: ${errorDetails}` : ''}`,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGetQRCode = async () => {
    if (!businessId || !instanceName) return;

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        body: {
          action: 'get_qr',
          business_id: businessId,
          instance_name: instanceName
        }
      });

      if (error) throw error;

      if (data.success) {
        setQrCode(data.qr_code);
        setConnectionStatus('connecting');
        toast({
          title: "QR Kod Alındı",
          description: "WhatsApp'ı bağlamak için QR kodu tarayın.",
        });
      }
    } catch (error) {
      console.error('Get QR code error:', error);
      
      let errorMessage = "QR kod alınırken bir hata oluştu.";
      let errorDetails = "";
      
      if (error instanceof Error) {
        errorDetails = error.message;
      }
      
      if (error && typeof error === 'object' && 'context' in error) {
        const context = (error as any).context;
        if (context?.body) {
          try {
            const bodyError = JSON.parse(context.body);
            errorDetails = bodyError.error || bodyError.message || context.body;
          } catch (e) {
            errorDetails = context.body;
          }
        }
      }
      
      toast({
        title: "Hata",
        description: `${errorMessage} ${errorDetails ? `\n\nDetay: ${errorDetails}` : ''}`,
        variant: "destructive",
      });
    }
  };

  const handleCheckStatus = async () => {
    if (!businessId || !instanceName) return;

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        body: {
          action: 'get_status',
          business_id: businessId,
          instance_name: instanceName
        }
      });

      if (error) throw error;

      if (data.success) {
        setConnectionStatus(data.status);
        
        // ✅ Yeni QR kod varsa güncelle
        if (data.qr_code) {
          // QR kod temizleme - çift prefix'i kaldır
          let cleanQrCode = data.qr_code;
          if (cleanQrCode.startsWith('data:image/png;base64,')) {
            cleanQrCode = cleanQrCode.replace('data:image/png;base64,', '');
          }
          setQrCode(cleanQrCode);
        }
        
        if (data.status === 'connected') {
          setAiEnabled(true);
          setQrCode(null);
          toast({
            title: "Bağlantı Başarılı!",
            description: "WhatsApp bağlantısı kuruldu. AI asistan aktif.",
          });
        } else if (data.qr_code) {
          toast({
            title: "Yeni QR Kod",
            description: "Bağlantı kopmuş, yeni QR kodu tarayın.",
          });
        }
      }
    } catch (error) {
      console.error('Check status error:', error);
      
      let errorMessage = "Bağlantı durumu kontrol edilirken bir hata oluştu.";
      let errorDetails = "";
      
      if (error instanceof Error) {
        errorDetails = error.message;
      }
      
      if (error && typeof error === 'object' && 'context' in error) {
        const context = (error as any).context;
        if (context?.body) {
          try {
            const bodyError = JSON.parse(context.body);
            errorDetails = bodyError.error || bodyError.message || context.body;
          } catch (e) {
            errorDetails = context.body;
          }
        }
      }
      
      toast({
        title: "Hata",
        description: `${errorMessage} ${errorDetails ? `\n\nDetay: ${errorDetails}` : ''}`,
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!businessId) return;

    setSaving(true);
    try {
      // AI ayarlarını database'e kaydet
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ 
          ai_enabled: aiEnabled 
        })
        .eq('business_id', businessId);

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: `WhatsApp AI asistan ${aiEnabled ? 'etkinleştirildi' : 'devre dışı bırakıldı'}.`,
      });
    } catch (error) {
      console.error('Settings save error:', error);
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'connecting': return 'bg-yellow-100 text-yellow-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'connecting': return <Clock className="h-4 w-4" />;
      case 'disconnected': return <XCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getConnectionStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Bağlı';
      case 'connecting': return 'Bağlanıyor';
      case 'disconnected': return 'Bağlı Değil';
      case 'error': return 'Hata';
      default: return 'Bilinmiyor';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  // WhatsApp AI erişim kontrolü
  if (!hasWhatsAppAccess) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="h-8 w-8 text-brand-primary" />
              WhatsApp AI Asistan
            </h1>
            <p className="text-muted-foreground mt-1">
              AI destekli otomatik randevu sistemi ve müşteri hizmetleri.
            </p>
          </div>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-red-800 mb-2">
              {subscriptionStatus === 'expired' ? 'Aboneliğinizin Süresi Dolmuş' : 'WhatsApp AI Erişimi Gerekli'}
            </h3>
            <p className="text-red-600 mb-4">
              {subscriptionStatus === 'expired' 
                ? 'WhatsApp AI Asistan özelliğini kullanabilmek için aboneliğinizi yenilemeniz gereklidir.'
                : 'WhatsApp AI Asistan özelliğini kullanabilmek için Premium Plan aboneliği gereklidir.'
              }
            </p>
            <div className="bg-white/50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">WhatsApp AI Asistan Ne İşe Yarar?</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Otomatik Randevu Alma:</strong> Müşteriler WhatsApp üzerinden randevu alabilir</li>
                <li>• <strong>7/24 Müşteri Hizmetleri:</strong> AI destekli anlık yanıtlar</li>
                <li>• <strong>Akıllı Randevu Yönetimi:</strong> Müsait saatleri otomatik kontrol eder</li>
                <li>• <strong>QR İle 30sn'de Kolay Kurulum:</strong> WhatsApp'ı bağlamak için QR kodu taramanız yeterli.</li>
                <li>• <strong>Müşteri Bilgilerini Toplar:</strong> Ad, telefon, hizmet tercihi</li>
                <li>• <strong>Randevu Onaylama:</strong> Otomatik onay mesajları gönderir</li>
                <li>• <strong>Çoklu Dil Desteği:</strong> Tüm dilleri konuşabilir</li>
              </ul>
            </div>
            <div className="space-y-2 text-sm text-red-500">
              <p>Mevcut Abonelik Durumu: <span className="font-semibold">
                {subscriptionStatus === 'trial' ? 'Deneme Paketi' :
                 subscriptionStatus === 'active' ? 'Aktif' :
                 subscriptionStatus === 'expired' ? 'Süresi Dolmuş' :
                 subscriptionStatus === 'no_subscription' ? 'Abonelik Yok' : subscriptionStatus}
              </span></p>
            </div>
            <div className="mt-6">
              <Button 
                onClick={() => window.location.href = '/dashboard/system-payments'}
                className="bg-red-600 hover:bg-red-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Premium Plan'a Yükselt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-brand-primary" />
            WhatsApp AI Asistan
          </h1>
          <p className="text-muted-foreground mt-1">
            AI destekli otomatik randevu sistemi ve müşteri hizmetleri.
          </p>
        </div>
        <Button 
          onClick={handleSaveSettings}
          disabled={saving}
          variant="brand"
          className="flex items-center gap-2"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>

      {/* Bağlantı Durumu */}
      <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            WhatsApp Bağlantı Durumu
          </CardTitle>
          <CardDescription>
            WhatsApp hesabınızın bağlantı durumu ve QR kod bilgileri.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-white/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getConnectionStatusIcon(connectionStatus)}
                <span className="font-medium">Bağlantı Durumu</span>
              </div>
              <Badge className={getConnectionStatusColor(connectionStatus)}>
                {getConnectionStatusText(connectionStatus)}
              </Badge>
            </div>
            <div className="flex gap-2">
              {connectionStatus === 'disconnected' && (
                <Button 
                  variant="outline" 
                  disabled={isConnecting}
                  onClick={handleCreateInstance}
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Bağlanıyor...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Bağlantı Kur
                    </>
                  )}
                </Button>
              )}
              
              {connectionStatus === 'connecting' && (
                <Button 
                  variant="outline" 
                  onClick={handleCheckStatus}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Durumu Kontrol Et
                </Button>
              )}
              
              {connectionStatus === 'connected' && (
                <Button 
                  variant="outline" 
                  onClick={handleCheckStatus}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yenile
                </Button>
              )}
            </div>
          </div>

          {connectionStatus === 'connecting' && (
            <div className="text-center p-6 border rounded-lg bg-blue-50">
              <div className="text-blue-600 mb-2">
                <QrCode className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="font-semibold text-blue-800 mb-2">WhatsApp'ı Bağlamak İçin QR Kodu Tarayın</h3>
              <p className="text-sm text-blue-600 mb-4">
                Telefonunuzdan WhatsApp &gt; Ayarlar &gt; Bağlı Cihazlar &gt; Cihaz Bağla'ya gidin ve QR kodu tarayın.
              </p>
              <div className="bg-white p-4 rounded border inline-block">
                {qrCode ? (
                  <img 
                    src={`data:image/png;base64,${qrCode}`} 
                    alt="WhatsApp QR Code" 
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                      <span className="text-gray-400 text-sm">QR Kod Yükleniyor...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleGetQRCode}
                  disabled={!instanceName}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  QR Kodu Yenile
                </Button>
              </div>
            </div>
          )}

          {connectionStatus === 'connected' && (
            <div className="text-center p-4 border rounded-lg bg-green-50">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">WhatsApp Bağlantısı Aktif</span>
              </div>
              <p className="text-sm text-green-600">
                AI asistanınız müşteri mesajlarını otomatik olarak yanıtlayabilir.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Asistan Ayarları */}
      <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Asistan Ayarları
          </CardTitle>
          <CardDescription>
            AI asistanının davranışını ve yanıtlarını özelleştirin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-white/50">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">AI Asistan</Label>
              <p className="text-sm text-muted-foreground">
                WhatsApp AI asistanını etkinleştir/devre dışı bırak
              </p>
            </div>
            <Switch
              checked={aiEnabled}
              onCheckedChange={setAiEnabled}
            />
          </div>

          {aiEnabled && (
            <div className="p-4 border rounded-lg bg-green-50 border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">AI Asistan Aktif</span>
              </div>
              <p className="text-sm text-green-600">
                AI asistanınız müşteri mesajlarını otomatik olarak yanıtlayabilir.
              </p>
            </div>
          )}

          {!aiEnabled && (
            <div className="p-4 border rounded-lg bg-gray-50 border-gray-200">
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <XCircle className="h-5 w-5" />
                <span className="font-semibold">AI Asistan Pasif</span>
              </div>
              <p className="text-sm text-gray-600">
                AI asistanınız devre dışı. Müşteri mesajları yanıtlanmayacak.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Özellikler ve Bilgilendirme */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Özellikleri */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Zap className="h-5 w-5" />
              AI Asistan Özellikleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-blue-700">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">
                <strong>Otomatik Randevu:</strong> Müşteriler WhatsApp üzerinden kolayca randevu alabilir.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">
                <strong>7/24 Hizmet:</strong> AI asistan günün her saati müşterilere yanıt verir.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">
                <strong>Akıllı Anlama:</strong> Doğal dil işleme ile müşteri isteklerini anlar.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">
                <strong>Entegrasyon:</strong> Mevcut randevu sisteminizle tam uyumlu çalışır.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Güvenlik ve Gizlilik */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Shield className="h-5 w-5" />
              Güvenlik ve Gizlilik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-green-700">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">
                <strong>Güvenli Bağlantı:</strong> Tüm veriler şifrelenmiş olarak iletilir.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">
                <strong>Veri Koruma:</strong> Müşteri bilgileri güvenli şekilde saklanır.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">
                <strong>KVKK Uyumlu:</strong> Kişisel verilerin korunması kurallarına uygun.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">
                <strong>Kontrol:</strong> AI asistanı istediğiniz zaman devre dışı bırakabilirsiniz.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default WhatsAppAI;

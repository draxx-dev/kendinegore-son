import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageSquare, 
  Settings, 
  Save, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone
} from "lucide-react";
import { smsSettingsAPI, SMSSettings, SMSLog } from "@/integrations/supabase/sms";

const SMSIntegration = () => {
  const [settings, setSettings] = useState<SMSSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [smsStats, setSmsStats] = useState({ total: 0, sent: 0, failed: 0 });
  const [smsRemaining, setSmsRemaining] = useState<number>(0);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [profilePhone, setProfilePhone] = useState<string>('');
  const [businessPhone, setBusinessPhone] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    fetchBusinessId();
  }, []);

  useEffect(() => {
    if (businessId) {
      fetchSettings();
      fetchSMSLogs();
      fetchSMSStats();
      fetchPhoneNumbers();
      fetchSMSRemaining();
      
      // Set up real-time updates for SMS logs and stats
      const interval = setInterval(() => {
        fetchSMSLogs();
        fetchSMSStats();
        fetchSMSRemaining();
      }, 30000); // Update every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [businessId]);

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

  const fetchPhoneNumbers = async () => {
    if (!businessId) return;

    try {
      // Fetch profile phone
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone, country_code')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile) {
          const profilePhoneFormatted = profile.phone 
            ? `${profile.country_code || '+90'} ${profile.phone}`
            : 'Telefon numarası yok';
          setProfilePhone(profilePhoneFormatted);
        }
      }

      // Fetch business phone
      const { data: business } = await supabase
        .from('businesses')
        .select('phone, country_code')
        .eq('id', businessId)
        .maybeSingle();
      
      if (business) {
        const businessPhoneFormatted = business.phone 
          ? `${business.country_code || '+90'} ${business.phone}`
          : 'Telefon numarası yok';
        setBusinessPhone(businessPhoneFormatted);
      }
    } catch (error) {
      console.error('Phone numbers fetch error:', error);
    }
  };

  const fetchSettings = async () => {
    if (!businessId) return;

    try {
      let currentSettings = await smsSettingsAPI.getSettings(businessId);
      
      if (!currentSettings) {
        // Create default settings if none exist
        currentSettings = await smsSettingsAPI.createSettings(businessId, {
          is_enabled: true,
          reminder_enabled: true,
          reminder_minutes: 30,
          business_notification_enabled: true
        });
      }

      setSettings(currentSettings);
    } catch (error) {
      console.error('Settings fetch error:', error);
      toast({
        title: "Hata",
        description: "SMS ayarları yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSMSLogs = async () => {
    if (!businessId) return;

    try {
      const logs = await smsSettingsAPI.getSMSLogs(businessId, 100);
      // Telefon doğrulama SMS'lerini filtrele - bunlar işletme hakkından düşmediği için gösterilmesin
      const filteredLogs = logs.filter(log => log.sms_type !== 'verification');
      setSmsLogs(filteredLogs);
    } catch (error) {
      console.error('SMS logs fetch error:', error);
    }
  };

  const fetchSMSStats = async () => {
    if (!businessId) return;

    try {
      // Telefon doğrulama SMS'leri hariç istatistikleri al
      const { data: logs, error } = await supabase
        .from('sms_logs')
        .select('status')
        .eq('business_id', businessId)
        .neq('sms_type', 'verification'); // Telefon doğrulama SMS'lerini hariç tut

      if (error) throw error;

      const total = logs?.length || 0;
      const sent = logs?.filter(log => log.status === 'sent').length || 0;
      const failed = logs?.filter(log => log.status === 'failed').length || 0;

      setSmsStats({ total, sent, failed });
    } catch (error) {
      console.error('SMS stats fetch error:', error);
    }
  };

  const fetchSMSRemaining = async () => {
    if (!businessId) return;

    try {
      const { data, error } = await supabase
        .from('business_subscriptions')
        .select('sms_remaining')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('SMS remaining fetch error:', error);
        setSmsRemaining(0);
        return;
      }

      setSmsRemaining(data?.sms_remaining || 0);
    } catch (error) {
      console.error('SMS remaining fetch error:', error);
      setSmsRemaining(0);
    }
  };

  const handleSettingChange = (key: keyof SMSSettings, value: any) => {
    if (!settings) return;
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const handleSaveSettings = async () => {
    if (!settings || !businessId) return;

    setSaving(true);
    try {
      let updatedSettings;
      
      if (settings.id) {
        // Update existing settings
        updatedSettings = await smsSettingsAPI.updateSettings(settings.id, settings);
      } else {
        // Create new settings
        updatedSettings = await smsSettingsAPI.createSettings(businessId, settings);
      }
      
      if (updatedSettings) {
        setSettings(updatedSettings);
        toast({
          title: "Başarılı!",
          description: "SMS ayarları kaydedildi.",
        });
        
        // Refresh SMS stats after settings change
        fetchSMSStats();
      }
    } catch (error) {
      console.error('Settings save error:', error);
      toast({
        title: "Hata",
        description: "SMS ayarları kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getSMSStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSMSStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getSMSTypeLabel = (type: string) => {
    switch (type) {
      case 'verification': return 'Doğrulama';
      case 'reminder': return 'Hatırlatma';
      case 'business_notification': return 'İşletme Bildirimi';
      case 'customer_confirmation': return 'Müşteri Onayı';
      default: return type;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-brand-primary" />
            SMS Entegrasyonu
          </h1>
          <p className="text-muted-foreground mt-1">
            NetGSM SMS servisi ayarları ve istatistikleri.
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

      {/* SMS Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-brand-primary mb-1">{smsStats.total}</div>
            <div className="text-sm text-muted-foreground">Toplam SMS</div>
          </CardContent>
        </Card>
        <Card className="bg-white/50 backdrop-blur-sm border-green-100 border-green-200">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{smsStats.sent}</div>
            <div className="text-sm text-muted-foreground">Başarılı</div>
          </CardContent>
        </Card>
        <Card className="bg-white/50 backdrop-blur-sm border-red-100 border-red-200">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">{smsStats.failed}</div>
            <div className="text-sm text-muted-foreground">Başarısız</div>
          </CardContent>
        </Card>
        <Card className="bg-white/50 backdrop-blur-sm border-orange-100 border-orange-200">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">{smsRemaining}</div>
            <div className="text-sm text-muted-foreground">Kalan SMS Hakkı</div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50/80 backdrop-blur-sm border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <MessageSquare className="h-5 w-5" />
            SMS Sistemi Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-blue-700">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm">
              <strong>Otomatik Hatırlatma:</strong> Sistem her dakika kontrol eder ve ayarladığınız süre öncesinde müşterilere SMS hatırlatması gönderir.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm">
              <strong>İşletme Bildirimi:</strong> Yeni online randevular geldiğinde işletmeye otomatik bildirim SMS'i gönderilir.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm">
              <strong>Günlük Limit:</strong> İşletme bildirimi SMS'leri için günlük 3 SMS'e kadar sistem tarafından karşılanır.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm">
              <strong>SMS Hakkı:</strong> İşletme bildirimi ve randevu hatırlatma SMS'leri işletmenin SMS hakkından düşülür. Telefon doğrulama ve müşteri onay SMS'leri sistem tarafından karşılanır.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm">
              <strong>Günlük Limit:</strong> İşletme bildirimi SMS'leri için günlük 3 SMS'e kadar sistem tarafından karşılanır, sonrası işletmenin hakkından düşülür.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SMS Türleri Açıklama Kartı */}
      <Card className="bg-green-50/80 backdrop-blur-sm border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <MessageSquare className="h-5 w-5" />
            SMS Türleri ve Örnekleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-green-700">
          <div className="space-y-2">
            <h4 className="font-semibold text-green-800">1. Örnek Müşteri Hatırlatma Mesajı</h4>
            <p className="text-sm">Müşterilere randevularından önce gönderilen hatırlatma:</p>
            <div className="bg-white/50 p-3 rounded border text-xs font-mono">
              "Randevu hatırlatması: 25.01.2025 tarihli randevunuza 30 dakika kalmistir. KendineGore"
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-green-800">2. Örnek İşletme Bildirimi</h4>
            <p className="text-sm">Yeni online randevu geldiğinde işletmeye gönderilen bildirim:</p>
            <div className="bg-white/50 p-3 rounded border text-xs font-mono">
              "25.01.2025 tarihine yeni bir online randevunuz var. Lutfen panelinizi kontrol ediniz. KendineGore"
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            SMS mesaj şablonları sistem tarafından standart olarak belirlenmiştir ve değiştirilemez. Tarih bilgileri otomatik olarak güncellenir. Randevu hatırlatma mesajlarındaki süre, ayarlarınızda belirlediğiniz hatırlatma süresi ile uyumlu olarak görüntülenir.
          </p>
        </CardFooter>
      </Card>

      {/* SMS Settings */}
      {/* SMS Settings */}
      <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            SMS Ayarları
          </CardTitle>
          <CardDescription>
            SMS entegrasyonu ve bildirim ayarlarını yapılandırın.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings && (
            <>
              {/* General SMS Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Genel Ayarlar</h3>
                
                <div className="flex items-center justify-between p-4 border rounded-lg bg-white/50">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">SMS Entegrasyonu</Label>
                    <p className="text-sm text-muted-foreground">
                      SMS gönderimini etkinleştir/devre dışı bırak
                    </p>
                  </div>
                  <Switch
                    checked={settings.is_enabled}
                    onCheckedChange={(checked) => handleSettingChange('is_enabled', checked)}
                  />
                </div>
              </div>

              {/* Reminder Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Hatırlatma Ayarları</h3>
                
                <div className="flex items-center justify-between p-4 border rounded-lg bg-white/50">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Randevu Hatırlatması</Label>
                    <p className="text-sm text-muted-foreground">
                      Müşterilere randevu hatırlatma SMS'i gönder
                    </p>
                  </div>
                  <Switch
                    checked={settings.reminder_enabled}
                    onCheckedChange={(checked) => handleSettingChange('reminder_enabled', checked)}
                    disabled={!settings.is_enabled}
                  />
                </div>

                {settings.reminder_enabled && (
                  <div className="space-y-2 p-4 border rounded-lg bg-white/50">
                    <Label htmlFor="reminder_minutes" className="text-base font-medium">Hatırlatma Süresi (Dakika)</Label>
                    <Input
                      id="reminder_minutes"
                      type="number"
                      min="15"
                      max="1440"
                      value={settings.reminder_minutes}
                      onChange={(e) => handleSettingChange('reminder_minutes', parseInt(e.target.value))}
                      className="w-32"
                    />
                    <p className="text-sm text-muted-foreground">
                      Randevudan kaç dakika önce hatırlatma gönderilsin (15-1440 dakika arası)
                    </p>
                  </div>
                )}
              </div>

              {/* Business Notification Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">İşletme Bildirimleri</h3>
                
                <div className="flex items-center justify-between p-4 border rounded-lg bg-white/50">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Yeni Randevu Bildirimi</Label>
                    <p className="text-sm text-muted-foreground">
                      İşletmeye yeni online randevu bildirimi gönder
                    </p>
                  </div>
                  <Switch
                    checked={settings.business_notification_enabled}
                    onCheckedChange={(checked) => handleSettingChange('business_notification_enabled', checked)}
                    disabled={!settings.is_enabled}
                  />
                </div>

                {settings.business_notification_enabled && (
                  <div className="p-4 border rounded-lg bg-white/50 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Bildirim Telefon Numarası</Label>
                      <p className="text-sm text-muted-foreground">
                        Yeni randevu bildirimlerinin hangi numaraya gönderileceğini seçin
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="business-phone"
                          name="notification-phone"
                          value="business"
                          checked={settings.notification_phone_source === 'business'}
                          onChange={(e) => handleSettingChange('notification_phone_source', e.target.value)}
                          className="w-4 h-4 text-brand-primary"
                        />
                        <div className="flex-1">
                          <Label htmlFor="business-phone" className="text-sm font-medium cursor-pointer">
                            İşletme Telefonu
                          </Label>
                          <p className="text-xs text-muted-foreground">{businessPhone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="profile-phone"
                          name="notification-phone"
                          value="profile"
                          checked={settings.notification_phone_source === 'profile'}
                          onChange={(e) => handleSettingChange('notification_phone_source', e.target.value)}
                          className="w-4 h-4 text-brand-primary"
                        />
                        <div className="flex-1">
                          <Label htmlFor="profile-phone" className="text-sm font-medium cursor-pointer">
                            Profil Telefonu
                          </Label>
                          <p className="text-xs text-muted-foreground">{profilePhone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* SMS Logs */}
      <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            SMS Geçmişi
          </CardTitle>
          <CardDescription>
            Son gönderilen SMS'lerin durumu ve detayları.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {smsLogs.length > 0 ? (
              smsLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.phone_number}</span>
                      <Badge className={getSMSStatusColor(log.status)}>
                        {getSMSStatusIcon(log.status)}
                        <span className="ml-1">{log.status === 'sent' ? 'Gönderildi' : log.status === 'failed' ? 'Başarısız' : 'Bekliyor'}</span>
                      </Badge>
                      <Badge variant="outline">{getSMSTypeLabel(log.sms_type)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Henüz SMS gönderilmemiş.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMSIntegration;

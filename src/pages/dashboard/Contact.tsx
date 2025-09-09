import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Clock, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ContactMessage {
  id: string;
  subject: string;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  admin_reply?: string;
  replied_at?: string;
}

export default function Contact() {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent'
  });
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<{name: string, email: string} | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBusinessInfo();
    fetchMessages();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from('businesses')
        .select('name, email')
        .eq('owner_id', user.id)
        .single();

      if (business) {
        setBusinessInfo(business);
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!business) return;

      const { data: messages, error } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Hata",
        description: "Mesajlar yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    if (!businessInfo) {
      toast({
        title: "Hata",
        description: "İşletme bilgileri bulunamadı.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!business) return;

      const { error } = await supabase
        .from('contact_messages')
        .insert({
          business_id: business.id,
          business_name: businessInfo.name,
          business_email: businessInfo.email,
          subject: formData.subject,
          message: formData.message,
          priority: formData.priority
        });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.",
      });

      setFormData({ subject: '', message: '', priority: 'normal' });
      fetchMessages();
    } catch (error) {
      console.error('Error submitting message:', error);
      toast({
        title: "Hata",
        description: "Mesaj gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'read':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'replied':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'read':
        return 'Okundu';
      case 'replied':
        return 'Yanıtlandı';
      case 'closed':
        return 'Kapatıldı';
      default:
        return 'Bilinmiyor';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'Düşük';
      case 'normal':
        return 'Normal';
      case 'high':
        return 'Yüksek';
      case 'urgent':
        return 'Acil';
      default:
        return 'Normal';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bize Ulaş</h1>
        <p className="text-muted-foreground">
          Sorularınız, önerileriniz veya destek talepleriniz için bizimle iletişime geçin.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mesaj Gönderme Formu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Yeni Mesaj Gönder
            </CardTitle>
            <CardDescription>
              Mesajınızı gönderin, en kısa sürede size dönüş yapacağız.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Konu</Label>
                <Input
                  id="subject"
                  placeholder="Mesajınızın konusunu yazın..."
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Öncelik</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') => 
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="urgent">Acil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mesaj</Label>
                <Textarea
                  id="message"
                  placeholder="Mesajınızı detaylı bir şekilde yazın..."
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Mesaj Gönder
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* İletişim Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle>İletişim Bilgileri</CardTitle>
            <CardDescription>
              Alternatif iletişim yöntemleri
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">E-posta</p>
                <p className="text-sm text-muted-foreground">iletisim@kendinegore.com</p>
              </div>
            </div>
            

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Destek Saatleri</h4>
              <p className="text-sm text-green-700">
                Pazartesi - Cuma: 09:00 - 18:00<br />
                Hafta sonları: Sadece acil durumlar
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mesaj Geçmişi */}
      <Card>
        <CardHeader>
          <CardTitle>Mesaj Geçmişi</CardTitle>
          <CardDescription>
            Gönderdiğiniz mesajlar ve durumları
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz mesaj göndermediniz.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{message.subject}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(message.created_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(message.priority)}>
                        {getPriorityText(message.priority)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(message.status)}
                        <span className="text-sm">{getStatusText(message.status)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  </div>

                  {message.admin_reply && (
                    <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                      <h5 className="font-medium text-blue-900 mb-2">Yanıt</h5>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">
                        {message.admin_reply}
                      </p>
                      {message.replied_at && (
                        <p className="text-xs text-blue-600 mt-2">
                          {new Date(message.replied_at).toLocaleString('tr-TR')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

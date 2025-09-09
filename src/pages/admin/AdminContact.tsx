import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Search, Filter, Reply, Eye, Clock, CheckCircle, AlertCircle, MessageSquare, User, Calendar, Phone, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { adminAuthService } from '@/services/adminAuth';

interface ContactMessage {
  id: string;
  business_id: string;
  business_name: string;
  business_email: string;
  business_phone?: string;
  profile_phone?: string;
  subject: string;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  admin_notes?: string;
  admin_reply?: string;
  replied_at?: string;
}

export default function AdminContact() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [replying, setReplying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAuth();
    fetchMessages();
  }, []);

  const checkAdminAuth = () => {
    const session = adminAuthService.getCurrentSession();
    setIsAdminAuthenticated(!!session);
  };

  useEffect(() => {
    filterMessages();
  }, [messages, searchTerm, statusFilter, priorityFilter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      // Admin authentication kontrolü
      const session = adminAuthService.getCurrentSession();
      if (!session) {
        throw new Error('Admin authentication gerekli');
      }

      // RLS bypass için RPC fonksiyonu kullan
      const { data: messages, error } = await supabase.rpc('admin_get_contact_messages', {
        admin_id: session.adminUser.id
      });

      if (error) throw error;
      
      setMessages(messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Hata",
        description: "Mesajlar yüklenirken bir hata oluştu: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = messages;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(message =>
        message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.business_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(message => message.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(message => message.priority === priorityFilter);
    }

    setFilteredMessages(filtered);
  };

  const updateMessageStatus = async (messageId: string, status: string) => {
    try {
      // Admin authentication kontrolü
      const session = adminAuthService.getCurrentSession();
      if (!session) {
        throw new Error('Admin authentication gerekli');
      }

      // RLS bypass için RPC fonksiyonu kullan
      const { error } = await supabase.rpc('admin_update_message_status', {
        message_id: messageId,
        new_status: status,
        admin_id: session.adminUser.id
      });

      if (error) throw error;

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: status as any } : msg
      ));

      toast({
        title: "Başarılı",
        description: "Mesaj durumu güncellendi.",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Hata",
        description: "Durum güncellenirken bir hata oluştu: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen yanıt metnini yazın.",
        variant: "destructive",
      });
      return;
    }

    if (!isAdminAuthenticated) {
      toast({
        title: "Hata",
        description: "Admin yetkisi gerekli.",
        variant: "destructive",
      });
      return;
    }

    try {
      setReplying(true);
      
      // Admin authentication ile RLS bypass
      const session = adminAuthService.getCurrentSession();
      if (!session) {
        throw new Error('Admin session bulunamadı');
      }

      // Direct SQL update ile RLS bypass
      const { error } = await supabase.rpc('admin_update_contact_message', {
        message_id: selectedMessage.id,
        reply_text: replyText,
        notes_text: adminNotes || null,
        admin_id: session.adminUser.id
      });

      if (error) throw error;

      // Local state güncelle
      setMessages(prev => prev.map(msg => 
        msg.id === selectedMessage.id 
          ? { 
              ...msg, 
              admin_reply: replyText,
              status: 'replied',
              replied_at: new Date().toISOString(),
              admin_notes: adminNotes || null
            } 
          : msg
      ));

      toast({
        title: "Başarılı",
        description: "Yanıt başarıyla gönderildi.",
      });

      setReplyText('');
      setAdminNotes('');
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Hata",
        description: "Yanıt gönderilirken bir hata oluştu: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setReplying(false);
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

  const getStatusCounts = () => {
    return {
      pending: messages.filter(m => m.status === 'pending').length,
      read: messages.filter(m => m.status === 'read').length,
      replied: messages.filter(m => m.status === 'replied').length,
      closed: messages.filter(m => m.status === 'closed').length,
      total: messages.length
    };
  };

  const stats = getStatusCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">İletişim Mesajları</h1>
        <p className="text-muted-foreground">
          İşletmelerden gelen mesajları yönetin ve yanıtlayın.
        </p>
      </div>

      {/* İstatistikler */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Toplam</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Beklemede</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Okundu</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.read}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Yanıtlandı</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Kapatıldı</span>
            </div>
            <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Arama</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Konu, işletme adı veya e-posta ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="read">Okundu</SelectItem>
                  <SelectItem value="replied">Yanıtlandı</SelectItem>
                  <SelectItem value="closed">Kapatıldı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Öncelik</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="urgent">Acil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mesaj Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Mesajlar ({filteredMessages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                ? 'Filtrelere uygun mesaj bulunamadı.' 
                : 'Henüz mesaj bulunmuyor.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <div key={message.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{message.business_name}</span>
                        <span className="text-sm text-muted-foreground">({message.business_email})</span>
                      </div>
                      <h4 className="font-medium text-lg mb-2">{message.subject}</h4>
                      
                      {/* İletişim Bilgileri */}
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{message.business_email}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {message.business_phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs text-muted-foreground">İşletme:</span>
                              <a 
                                href={`tel:${message.business_phone}`}
                                className="hover:text-primary hover:underline"
                              >
                                {message.business_phone}
                              </a>
                            </div>
                          )}
                          {message.profile_phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs text-muted-foreground">Profil:</span>
                              <a 
                                href={`tel:${message.profile_phone}`}
                                className="hover:text-primary hover:underline"
                              >
                                {message.profile_phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(message.created_at).toLocaleString('tr-TR')}
                        </span>
                      </div>
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
                  
                  {/* Mesaj İçeriği - Daha iyi görüntüleme */}
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="max-h-32 overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.message}</p>
                    </div>
                    {message.message.length > 200 && (
                      <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                        <span className="text-xs text-muted-foreground">
                          {message.message.length} karakter
                        </span>
                      </div>
                    )}
                  </div>

                  {message.admin_reply && (
                    <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                      <h5 className="font-medium text-blue-900 mb-2">Yanıtımız</h5>
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

                  {message.admin_notes && (
                    <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
                      <h5 className="font-medium text-yellow-900 mb-2">Notlarım</h5>
                      <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                        {message.admin_notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Select
                      value={message.status}
                      onValueChange={(value) => updateMessageStatus(message.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Beklemede</SelectItem>
                        <SelectItem value="read">Okundu</SelectItem>
                        <SelectItem value="replied">Yanıtlandı</SelectItem>
                        <SelectItem value="closed">Kapatıldı</SelectItem>
                      </SelectContent>
                    </Select>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedMessage(message);
                            setReplyText('');
                            setAdminNotes('');
                          }}
                        >
                          <Reply className="h-4 w-4 mr-2" />
                          Yanıtla
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Mesaj Yanıtla</DialogTitle>
                          <DialogDescription>
                            <div className="space-y-2">
                              <div className="font-medium">{message.business_name} - {message.subject}</div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <span>{message.business_email}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  {message.business_phone && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      <span className="text-xs text-muted-foreground">İşletme:</span>
                                      <a 
                                        href={`tel:${message.business_phone}`}
                                        className="hover:text-primary hover:underline"
                                      >
                                        {message.business_phone}
                                      </a>
                                    </div>
                                  )}
                                  {message.profile_phone && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      <span className="text-xs text-muted-foreground">Profil:</span>
                                      <a 
                                        href={`tel:${message.profile_phone}`}
                                        className="hover:text-primary hover:underline"
                                      >
                                        {message.profile_phone}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="bg-muted p-4 rounded-lg">
                            <h5 className="font-medium mb-3">Orijinal Mesaj:</h5>
                            <div className="max-h-40 overflow-y-auto">
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.message}</p>
                            </div>
                            <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                              <span className="text-xs text-muted-foreground">
                                {message.message.length} karakter
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="reply">Yanıt</Label>
                            <Textarea
                              id="reply"
                              placeholder="Yanıtınızı yazın..."
                              rows={4}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
                            <Textarea
                              id="notes"
                              placeholder="İç notlar..."
                              rows={2}
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedMessage(null);
                                setReplyText('');
                                setAdminNotes('');
                              }}
                            >
                              İptal
                            </Button>
                            <Button
                              onClick={sendReply}
                              disabled={replying || !replyText.trim()}
                            >
                              {replying ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                  Gönderiliyor...
                                </>
                              ) : (
                                <>
                                  <Reply className="h-4 w-4 mr-2" />
                                  Yanıt Gönder
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

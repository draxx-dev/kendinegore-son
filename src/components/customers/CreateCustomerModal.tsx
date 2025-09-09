import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Save, X } from "lucide-react";

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

interface CreateCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (customer: { id: string; first_name: string; last_name: string; phone: string }) => void;
}

export const CreateCustomerModal = ({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateCustomerModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    notes: "",
    country_code: "+90"
  });

  const { toast } = useToast();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.phone) {
      toast({
        title: "Hata",
        description: "Lütfen zorunlu alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const businessId = await getBusinessId();
      
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          business_id: businessId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          email: formData.email || null,
          notes: formData.notes || null
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Yeni müşteri eklendi.",
      });

      // Form'u temizle
          setFormData({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      notes: "",
      country_code: "+90"
    });

      onSuccess(data);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Müşteri eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-brand-primary" />
            Yeni Müşteri Ekle
          </DialogTitle>
          <DialogDescription>
            Yeni bir müşteri kaydı oluşturun.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Textarea
              id="notes"
              name="notes"
              placeholder="Özel notlar, tercihler..."
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              variant="brand" 
              disabled={loading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Kaydediliyor..." : "Müşteri Ekle"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              İptal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
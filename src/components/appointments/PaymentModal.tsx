import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Save, X } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  totalAmount: number;
  customerName: string;
  onSuccess: () => void;
}

export const PaymentModal = ({ 
  open, 
  onOpenChange, 
  appointmentId,
  totalAmount,
  customerName,
  onSuccess 
}: PaymentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: totalAmount,
    payment_method: "",
    notes: "",
    expected_payment_date: ""
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.payment_method) {
      toast({
        title: "Hata",
        description: "Lütfen ödeme yöntemini seçin.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create payment record
      const paymentData = {
        appointment_id: appointmentId,
        amount: formData.amount,
        payment_method: formData.payment_method,
        payment_status: formData.payment_method === 'credit' ? 'pending' : 'completed',
        payment_date: formData.payment_method === 'credit' ? null : new Date().toISOString(),
        notes: formData.notes || null,
        expected_payment_date: formData.payment_method === 'credit' && formData.expected_payment_date 
          ? formData.expected_payment_date 
          : null
      };

      const { error } = await supabase
        .from('payments')
        .insert([paymentData]);

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Ödeme kaydı oluşturuldu.",
      });

      // Reset form
      setFormData({
        amount: totalAmount,
        payment_method: "",
        notes: "",
        expected_payment_date: ""
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ödeme kaydı oluşturulurken bir hata oluştu.",
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
            <CreditCard className="h-5 w-5 text-brand-primary" />
            Ödeme Al
          </DialogTitle>
          <DialogDescription>
            {customerName} için ödeme bilgilerini girin.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Tutar *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Ödeme Yöntemi *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ödeme yöntemi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Nakit</SelectItem>
                <SelectItem value="card">Kart</SelectItem>
                <SelectItem value="credit">Veresiye</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.payment_method === 'credit' && (
            <div className="space-y-2">
              <Label htmlFor="expected_payment_date">Ödemenin Alınacağı Tarih</Label>
              <Input
                id="expected_payment_date"
                type="date"
                value={formData.expected_payment_date}
                onChange={(e) => setFormData({ ...formData, expected_payment_date: e.target.value })}
                placeholder="Opsiyonel"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ödeme ile ilgili notlar..."
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
              {loading ? "Kaydediliyor..." : "Ödemeyi Kaydet"}
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
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Save, X } from "lucide-react";

interface WorkingHoursModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  staffName: string;
}

interface WorkingHour {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
}

const DAYS = [
  { id: 1, name: "Pazartesi" },
  { id: 2, name: "Salı" },
  { id: 3, name: "Çarşamba" },
  { id: 4, name: "Perşembe" },
  { id: 5, name: "Cuma" },
  { id: 6, name: "Cumartesi" },
  { id: 0, name: "Pazar" }
];

export const WorkingHoursModal = ({ 
  open, 
  onOpenChange, 
  staffId, 
  staffName 
}: WorkingHoursModalProps) => {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (open && staffId) {
      fetchWorkingHours();
    }
  }, [open, staffId]);

  const fetchWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select('*')
        .eq('staff_id', staffId)
        .order('day_of_week');

      if (error) throw error;

      // Initialize with default hours for all days if none exist
      const existingDays = (data || []).map(wh => wh.day_of_week);
      const allDaysHours = DAYS.map(day => {
        const existing = (data || []).find(wh => wh.day_of_week === day.id);
        return existing || {
          day_of_week: day.id,
          start_time: "09:00",
          end_time: "18:00",
          is_closed: false
        };
      });

      setWorkingHours(allDaysHours);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Çalışma saatleri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
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

  const handleSave = async () => {
    setLoading(true);

    try {
      const businessId = await getBusinessId();
      
      // Validate required fields
      if (!businessId) {
        throw new Error("İşletme ID'si alınamadı");
      }
      if (!staffId) {
        throw new Error("Personel ID'si bulunamadı");
      }

      // First, delete existing working hours for this staff
      const { error: deleteError } = await supabase
        .from('working_hours')
        .delete()
        .eq('staff_id', staffId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      // Then insert new working hours - staff için business_id null olmalı
      const hoursToInsert = workingHours
        .filter(wh => wh.start_time && wh.end_time) // Only include hours with valid times
        .map(wh => ({
          business_id: null, // Personel çalışma saatleri için business_id null olmalı
          staff_id: staffId,
          day_of_week: wh.day_of_week,
          start_time: wh.start_time,
          end_time: wh.end_time,
          is_closed: wh.is_closed || false
        }));


      const { error: insertError } = await supabase
        .from('working_hours')
        .insert(hoursToInsert);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      toast({
        title: "Başarılı!",
        description: "Çalışma saatleri güncellendi.",
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Hata",
        description: error?.message || "Çalışma saatleri kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateWorkingHour = (dayOfWeek: number, field: keyof WorkingHour, value: any) => {
    setWorkingHours(prev => prev.map(wh => 
      wh.day_of_week === dayOfWeek 
        ? { ...wh, [field]: value }
        : wh
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-primary" />
            {staffName} - Çalışma Saatleri
          </DialogTitle>
          <DialogDescription>
            Personelin haftalık çalışma saatlerini ayarlayın.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {DAYS.map((day) => {
            const dayHours = workingHours.find(wh => wh.day_of_week === day.id);
            if (!dayHours) return null;

            return (
              <Card key={day.id} className="bg-white/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{day.name}</h3>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`closed-${day.id}`} className="text-sm">
                        Kapalı
                      </Label>
                      <Switch
                        id={`closed-${day.id}`}
                        checked={dayHours.is_closed}
                        onCheckedChange={(checked) => 
                          updateWorkingHour(day.id, 'is_closed', checked)
                        }
                      />
                    </div>
                  </div>
                  
                  {!dayHours.is_closed && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`start-${day.id}`}>Başlangıç</Label>
                        <Input
                          id={`start-${day.id}`}
                          type="time"
                          value={dayHours.start_time}
                          onChange={(e) => 
                            updateWorkingHour(day.id, 'start_time', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`end-${day.id}`}>Bitiş</Label>
                        <Input
                          id={`end-${day.id}`}
                          type="time"
                          value={dayHours.end_time}
                          onChange={(e) => 
                            updateWorkingHour(day.id, 'end_time', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleSave} 
            variant="brand" 
            disabled={loading}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            İptal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
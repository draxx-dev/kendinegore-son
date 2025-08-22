import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Save } from "lucide-react";

interface WorkingHour {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
}

const WorkingHours = () => {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const dayNames = [
    "Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"
  ];

  useEffect(() => {
    fetchWorkingHours();
  }, []);

  const fetchWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select('*')
        .is('staff_id', null)
        .order('day_of_week');

      if (error) throw error;
      setWorkingHours(data || []);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Çalışma saatleri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    setWorkingHours(prev => 
      prev.map(wh => 
        wh.day_of_week === dayOfWeek 
          ? { ...wh, [field]: value }
          : wh
      )
    );
  };

  const handleToggleDay = (dayOfWeek: number, isClosed: boolean) => {
    setWorkingHours(prev => 
      prev.map(wh => 
        wh.day_of_week === dayOfWeek 
          ? { ...wh, is_closed: isClosed }
          : wh
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const workingHour of workingHours) {
        const { error } = await supabase
          .from('working_hours')
          .update({
            start_time: workingHour.start_time,
            end_time: workingHour.end_time,
            is_closed: workingHour.is_closed
          })
          .eq('id', workingHour.id);

        if (error) throw error;
      }

      toast({
        title: "Başarılı!",
        description: "Çalışma saatleri güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Çalışma saatleri güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-8 w-8 text-brand-primary" />
          Çalışma Saatleri
        </h1>
        <p className="text-muted-foreground mt-1">
          Salon açılış ve kapanış saatlerinizi belirleyin.
        </p>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
        <CardHeader>
          <CardTitle>Haftalık Çalışma Programı</CardTitle>
          <CardDescription>
            Her gün için çalışma saatlerinizi ayarlayın.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {workingHours.map((workingHour) => (
            <div key={workingHour.day_of_week} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-brand-primary/10">
              <div className="flex items-center gap-4">
                <div className="w-20">
                  <span className="font-medium text-foreground">
                    {dayNames[workingHour.day_of_week]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!workingHour.is_closed}
                    onCheckedChange={(checked) => handleToggleDay(workingHour.day_of_week, !checked)}
                  />
                  <Label className="text-sm text-muted-foreground">
                    {workingHour.is_closed ? "Kapalı" : "Açık"}
                  </Label>
                </div>
              </div>

              {!workingHour.is_closed && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Başlangıç:</Label>
                    <input
                      type="time"
                      value={workingHour.start_time}
                      onChange={(e) => handleTimeChange(workingHour.day_of_week, 'start_time', e.target.value)}
                      className="px-3 py-1 border border-brand-primary/20 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Bitiş:</Label>
                    <input
                      type="time"
                      value={workingHour.end_time}
                      onChange={(e) => handleTimeChange(workingHour.day_of_week, 'end_time', e.target.value)}
                      className="px-3 py-1 border border-brand-primary/20 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="pt-4 border-t border-brand-primary/10">
            <Button 
              onClick={handleSave}
              disabled={saving}
              variant="brand"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50/50 backdrop-blur-sm border-blue-200/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Çalışma Saatleri Hakkında
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Çalışma saatleri online randevu sisteminde kullanılır</li>
                <li>• Kapalı günlerde randevu alınamaz</li>
                <li>• Personel bazlı farklı saatler Personel bölümünden ayarlanabilir</li>
                <li>• Özel günler ve tatiller için ileride ayrı ayar eklenecek</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkingHours;
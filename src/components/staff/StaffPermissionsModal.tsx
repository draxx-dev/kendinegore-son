import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Save, X } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface StaffPermission {
  permission_id: string;
}

interface StaffPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  staffName: string;
}

const categoryLabels: Record<string, string> = {
  appointments: "Randevular",
  customers: "Müşteriler", 
  services: "Hizmetler",
  payments: "Ödemeler",
  reports: "Raporlar",
  staff: "Personel",
  business: "İşletme"
};

export const StaffPermissionsModal = ({ isOpen, onClose, staffId, staffName }: StaffPermissionsModalProps) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [assignedPermissions, setAssignedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && staffId) {
      fetchPermissions();
      fetchAssignedPermissions();
    }
  }, [isOpen, staffId]);

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_permissions')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yetkiler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const fetchAssignedPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_role_assignments')
        .select('permission_id')
        .eq('staff_id', staffId);

      if (error) throw error;
      setAssignedPermissions((data || []).map((item: StaffPermission) => item.permission_id));
    } catch (error) {
      toast({
        title: "Hata",
        description: "Atanmış yetkiler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setAssignedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get current user for granted_by field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      // Remove all existing permissions for this staff
      const { error: deleteError } = await supabase
        .from('staff_role_assignments')
        .delete()
        .eq('staff_id', staffId);

      if (deleteError) throw deleteError;

      // Add new permissions
      if (assignedPermissions.length > 0) {
        const assignments = assignedPermissions.map(permissionId => ({
          staff_id: staffId,
          permission_id: permissionId,
          granted_by: user.id
        }));

        const { error: insertError } = await supabase
          .from('staff_role_assignments')
          .insert(assignments);

        if (insertError) throw insertError;
      }

      toast({
        title: "Başarılı!",
        description: "Personel yetkileri güncellendi.",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yetkiler güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-primary" />
            {staffName} - Yetki Yönetimi
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
              <div key={category} className="space-y-3">
                <h3 className="font-medium text-lg text-foreground border-b pb-2">
                  {categoryLabels[category] || category}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {categoryPermissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={permission.id}
                        checked={assignedPermissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={permission.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {permission.description}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSave} disabled={saving} variant="brand">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          <Button onClick={onClose} variant="outline">
            <X className="h-4 w-4 mr-2" />
            İptal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings, User, Shield, Phone, Mail, Calendar, LogOut } from "lucide-react";

interface StaffProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
  is_active: boolean;
  permissions: any;
  business_name: string;
}

interface Permission {
  id: string;
  name: string;
  description?: string;
  category: string;
}

const StaffSettings = () => {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStaffProfile();
    fetchPermissions();
  }, []);

  const fetchStaffProfile = async () => {
    try {
      const staffSession = localStorage.getItem('staff_session');
      if (!staffSession) {
        navigate('/staff-login');
        return;
      }

      const session = JSON.parse(staffSession);
      
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          businesses (name)
        `)
        .eq('id', session.staff.id)
        .single();

      if (error) throw error;
      
      setProfile({
        ...data,
        business_name: data.businesses?.name || session.staff.business_name
      });
    } catch (error) {
      console.error('Error fetching staff profile:', error);
      toast({
        title: "Hata",
        description: "Profil bilgileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const fetchPermissions = async () => {
    try {
      const staffSession = localStorage.getItem('staff_session');
      if (!staffSession) return;

      const session = JSON.parse(staffSession);
      
      const { data, error } = await supabase
        .from('staff_role_assignments')
        .select(`
          staff_permissions (
            id,
            name,
            description,
            category
          )
        `)
        .eq('staff_id', session.staff.id);

      if (error) throw error;
      
      const staffPermissions = data?.map(item => item.staff_permissions).filter(Boolean) || [];
      setPermissions(staffPermissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: "Hata",
        description: "Yetki bilgileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('staff_session');
    toast({
      title: "Çıkış Yapıldı",
      description: "Başarıyla çıkış yaptınız.",
    });
    navigate('/');
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Ayarlar
        </h1>
        <p className="text-muted-foreground">
          Profil bilgilerinizi ve yetkilerinizi görüntüleyin.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">İsim</Label>
                <Input
                  id="name"
                  value={profile.name}
                  disabled
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="business">İşletme</Label>
                <Input
                  id="business"
                  value={profile.business_name}
                  disabled
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  value={profile.email || 'Belirtilmemiş'}
                  disabled
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={profile.phone || 'Belirtilmemiş'}
                  disabled
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Kayıt Tarihi: {new Date(profile.created_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
              <Badge variant={profile.is_active ? "default" : "secondary"}>
                {profile.is_active ? "Aktif" : "Pasif"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Yetkilerim
            </CardTitle>
          </CardHeader>
          <CardContent>
            {permissions.length === 0 ? (
              <p className="text-muted-foreground">Henüz size atanmış yetki bulunmuyor.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category}>
                    <h3 className="font-medium text-foreground mb-3 capitalize">
                      {category.replace('_', ' ')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {perms.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {permission.name.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            {permission.description && (
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Aktif
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              İşlemler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Çıkış Yap
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffSettings;
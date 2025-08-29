import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, LogIn, ArrowLeft } from "lucide-react";

export const StaffLogin = () => {
  const [formData, setFormData] = useState({
    businessEmail: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessEmail || !formData.password) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
        // Staff login
        const { data, error } = await supabase.rpc('authenticate_staff', {
          business_email_param: formData.businessEmail,
          staff_password_param: formData.password
        });

        if (error) throw error;

        const result = data as any;
        
        if (result.success) {
          localStorage.setItem('staff_session', JSON.stringify({
            staff: result.staff,
            loginTime: new Date().toISOString()
          }));

          toast({
            title: "Başarılı!",
            description: `Hoş geldiniz, ${result.staff.name}!`,
          });

          navigate('/staff-dashboard');
        } else {
          toast({
            title: "Giriş Hatası",
            description: result.error || "Geçersiz bilgiler.",
            variant: "destructive",
          });
        }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Giriş yapılırken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to main site button */}
        <div className="text-center">
          <Button 
            onClick={() => navigate('/')} 
            variant="ghost" 
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ana Sayfaya Dön
          </Button>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20 shadow-soft">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-brand-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Personel Girişi
            </CardTitle>
            <p className="text-muted-foreground">
              İşletmenizin size verdiği bilgilerle giriş yapın
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessEmail">İşletme E-posta Adresi</Label>
                <Input
                  id="businessEmail"
                  name="businessEmail"
                  type="email"
                  placeholder="ornek@isletme.com"
                  value={formData.businessEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Size Verilen Şifre</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="İşletmenin size verdiği şifre"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                variant="brand"
                disabled={loading}
              >
                <LogIn className="h-4 w-4 mr-2" />
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                Şifrenizi hatırlamıyor musunuz?<br />
                İşletme yöneticinizle iletişime geçin.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            onClick={() => navigate('/auth')} 
            variant="outline"
            className="text-sm"
          >
            İşletme Sahibi Girişi
          </Button>
        </div>
      </div>
    </div>
  );
};
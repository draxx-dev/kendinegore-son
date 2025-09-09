import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, LogIn, UserPlus, Shield, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const AuthPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<'business' | 'staff'>('business');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    businessEmail: "",
    country_code: "+90"
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  // Kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (loginType === 'staff') {
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
      } else {
        // Business login
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Giriş Hatası",
              description: "Email veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Giriş Hatası",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Başarılı!",
            description: "Giriş yapılıyor...",
          });
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast({
        title: "Beklenmeyen Hata",
        description: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            country_code: formData.country_code,
          }
        }
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Kayıt Hatası",
            description: "Bu email adresi zaten kayıtlı. Giriş yapmayı deneyin.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Kayıt Hatası",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Başarılı!",
          description: "Hesabınız oluşturuldu. Email doğrulama linkini kontrol edin.",
        });
      }
    } catch (error) {
      toast({
        title: "Beklenmeyen Hata",
        description: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden flex items-center justify-center p-4">
      {/* Indigo Center Glow */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none" 
        style={{ 
          backgroundImage: `radial-gradient(circle at 50% 50%, #6366f1, transparent)`,
        }} 
      />
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white">KendineGöre</h1>
          </Link>
          <p className="text-white/80 mt-2">Güzellik Salonu CRM</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-elevated border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              Hesabınıza Erişin
            </CardTitle>
            <CardDescription>
              Salon yönetim panelinize giriş yapın veya yeni hesap oluşturun
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Login Type Toggle */}
            <div className="mb-6">
              <div className="grid w-full grid-cols-2 gap-1 rounded-md bg-muted p-1">
                <Button
                  type="button"
                  variant={loginType === 'business' ? 'default' : 'ghost'}
                  className="rounded-sm"
                  onClick={() => setLoginType('business')}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  İşletme
                </Button>
                <Button
                  type="button"
                  variant={loginType === 'staff' ? 'default' : 'ghost'}
                  className="rounded-sm"
                  onClick={() => setLoginType('staff')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Personel
                </Button>
              </div>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Giriş Yap
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2" disabled={loginType === 'staff'}>
                  <UserPlus className="h-4 w-4" />
                  Kayıt Ol
                </TabsTrigger>
              </TabsList>

              {/* Giriş Formu */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginType === 'staff' && (
                    <div className="space-y-2">
                      <Label htmlFor="business-email">İşletme Email Adresi</Label>
                      <Input
                        id="business-email"
                        name="businessEmail"
                        type="email"
                        placeholder="isletme@email.com"
                        value={formData.businessEmail}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  )}
                  {loginType === 'business' && (
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        placeholder="ornek@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">
                      {loginType === 'staff' ? 'Size Verilen Şifre' : 'Şifre'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={loginType === 'staff' ? "İşletmenin size verdiği şifre" : "••••••••"}
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="brand"
                    disabled={isLoading}
                  >
                    {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
                  </Button>
                </form>
              </TabsContent>

              {/* Kayıt Formu */}
              <TabsContent value="signup">
                {loginType === 'staff' && (
                  <div className="text-center py-8">
                    <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Personel Kayıt</h3>
                    <p className="text-muted-foreground">
                      Personel hesapları yalnızca işletme yöneticileri tarafından oluşturulabilir.
                      Giriş bilgileriniz için işletme yöneticinizle iletişime geçin.
                    </p>
                  </div>
                )}
                {loginType === 'business' && (
                  <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Ad</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="Adınız"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Soyad</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Soyadınız"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <div className="flex gap-2">
                      <select
                        name="country_code"
                        value={formData.country_code}
                        onChange={handleInputChange}
                        className="flex h-10 w-24 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="+90">🇹🇷 +90</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+39">🇮🇹 +39</option>
                        <option value="+34">🇪🇸 +34</option>
                        <option value="+31">🇳🇱 +31</option>
                        <option value="+32">🇧🇪 +32</option>
                        <option value="+41">🇨🇭 +41</option>
                        <option value="+43">🇦🇹 +43</option>
                        <option value="+45">🇩🇰 +45</option>
                        <option value="+46">🇸🇪 +46</option>
                        <option value="+47">🇳🇴 +47</option>
                        <option value="+358">🇫🇮 +358</option>
                        <option value="+420">🇨🇿 +420</option>
                        <option value="+421">🇸🇰 +421</option>
                        <option value="+36">🇭🇺 +36</option>
                        <option value="+40">🇷🇴 +40</option>
                        <option value="+359">🇧🇬 +359</option>
                        <option value="+385">🇭🇷 +385</option>
                        <option value="+386">🇸🇮 +386</option>
                        <option value="+372">🇪🇪 +372</option>
                        <option value="+371">🇱🇻 +371</option>
                        <option value="+370">🇱🇹 +370</option>
                        <option value="+48">🇵🇱 +48</option>
                        <option value="+7">🇷🇺 +7</option>
                        <option value="+380">🇺🇦 +380</option>
                        <option value="+375">🇧🇾 +375</option>
                        <option value="+370">🇱🇹 +370</option>
                        <option value="+371">🇱🇻 +371</option>
                        <option value="+372">🇪🇪 +372</option>
                        <option value="+386">🇸🇮 +386</option>
                        <option value="+385">🇭🇷 +385</option>
                        <option value="+359">🇧🇬 +359</option>
                        <option value="+40">🇷🇴 +40</option>
                        <option value="+36">🇭🇺 +36</option>
                        <option value="+421">🇸🇰 +421</option>
                        <option value="+420">🇨🇿 +420</option>
                        <option value="+358">🇫🇮 +358</option>
                        <option value="+47">🇳🇴 +47</option>
                        <option value="+46">🇸🇪 +46</option>
                        <option value="+45">🇩🇰 +45</option>
                        <option value="+43">🇦🇹 +43</option>
                        <option value="+41">🇨🇭 +41</option>
                        <option value="+32">🇧🇪 +32</option>
                        <option value="+31">🇳🇱 +31</option>
                        <option value="+34">🇪🇸 +34</option>
                        <option value="+39">🇮🇹 +39</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+90">🇹🇷 +90</option>
                      </select>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="555 123 45 67"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Şifre</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="En az 6 karakter"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="brand"
                    disabled={isLoading}
                  >
                    {isLoading ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
                  </Button>
                </form>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Link 
                to="/" 
                className="text-sm text-muted-foreground hover:text-brand-primary transition-colors"
              >
                ← Ana Sayfaya Dön
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
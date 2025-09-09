import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./Sidebar";
import { Settings, LogOut, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Business ID'yi set et
  useEffect(() => {
    const setBusinessId = async () => {
      if (user) {
        try {
          const { data: businesses, error } = await supabase
            .from('businesses')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle();

          if (error) throw error;
          if (businesses) {
            localStorage.setItem('businessId', businesses.id);
          }
        } catch (error) {
          console.error('Business ID fetch error:', error);
        }
      }
    };

    setBusinessId();
  }, [user]);

  useEffect(() => {
    // Auth state listener'ı ilk olarak kur
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session && !loading) {
          navigate("/auth");
        }
      }
    );

    // Sonra mevcut oturumu kontrol et
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, [navigate, loading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return null; // useEffect navigate'i hallediyor
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
            <div className="flex justify-between items-center h-16 px-4 sm:px-6">
              <div className="flex items-center gap-4">
                {isMobile && (
                  <SidebarTrigger className="p-0 hover:bg-secondary/50" />
                )}
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                    Yönetim Paneli
                  </h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    KendineGöre Salon CRM
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-sm text-muted-foreground hidden lg:block px-3 py-1.5 bg-secondary/50 rounded-full max-w-48 truncate">
                  Hoş geldiniz, {user.user_metadata?.first_name || user.email}
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="hover:bg-secondary/50 h-9 w-9 sm:h-10 sm:w-10"
                  onClick={() => navigate("/dashboard/settings")}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout} 
                  className="hover:bg-destructive/10 hover:text-destructive h-9 px-2 sm:px-3"
                >
                  <LogOut className="h-4 w-4 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Çıkış</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 bg-slate-50/50 min-w-0 overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
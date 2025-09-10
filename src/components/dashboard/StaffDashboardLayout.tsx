import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StaffSidebar } from "./StaffSidebar";
import { Settings, LogOut, Shield } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

interface StaffSession {
  staff: {
    id: string;
    name: string;
    email: string;
    business_id: string;
    business_name: string;
  };
  loginTime: string;
}

interface StaffDashboardLayoutProps {
  children: React.ReactNode;
}

export const StaffDashboardLayout = ({ children }: StaffDashboardLayoutProps) => {
  const [staffSession, setStaffSession] = useState<StaffSession | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    const sessionData = localStorage.getItem('staff_session');
    if (!sessionData) {
      navigate('/staff-login');
      return;
    }

    try {
      const session = JSON.parse(sessionData);
      setStaffSession(session);
    } catch (error) {
      localStorage.removeItem('staff_session');
      navigate('/staff-login');
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('staff_session');
    toast({
      title: "Çıkış Yapıldı",
      description: "Başarıyla çıkış yaptınız.",
    });
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!staffSession) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background">
        <StaffSidebar 
          staffName={staffSession.staff.name}
          businessName={staffSession.staff.business_name}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
            <div className="flex justify-between items-center h-16 px-4 sm:px-6">
              <div className="flex items-center gap-4">
                {isMobile && (
                  <SidebarTrigger className="p-0 hover:bg-secondary/50" />
                )}
                <div className="min-w-0 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                      Personel Paneli
                    </h1>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                      {staffSession.staff.business_name}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-sm text-muted-foreground hidden lg:block px-3 py-1.5 bg-secondary/50 rounded-full max-w-48 truncate">
                  {staffSession.staff.name}
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="hover:bg-secondary/50 h-9 w-9 sm:h-10 sm:w-10"
                  onClick={() => navigate("/staff-dashboard/settings")}
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
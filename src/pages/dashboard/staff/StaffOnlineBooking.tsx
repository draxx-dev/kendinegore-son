import { PermissionGuard } from "@/components/PermissionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const StaffOnlineBooking = () => {
  return (
    <PermissionGuard permission="view_business_settings">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Online Randevu
          </h1>
          <p className="text-muted-foreground">
            Online randevu ayarlarını görüntüleyin.
          </p>
        </div>

        <Card>
          <CardContent className="py-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Online randevu ayarları yakında eklenecek.</p>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default StaffOnlineBooking;
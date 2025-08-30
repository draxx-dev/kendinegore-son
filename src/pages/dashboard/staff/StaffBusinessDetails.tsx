import { PermissionGuard } from "@/components/PermissionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from "lucide-react";

const StaffBusinessDetails = () => {
  return (
    <PermissionGuard permission="view_business_settings">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            İşletme Detayları
          </h1>
          <p className="text-muted-foreground">
            İşletme bilgilerini görüntüleyin.
          </p>
        </div>

        <Card>
          <CardContent className="py-8 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">İşletme detayları yakında eklenecek.</p>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default StaffBusinessDetails;
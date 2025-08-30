import { PermissionGuard } from "@/components/PermissionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors } from "lucide-react";

const StaffServices = () => {
  return (
    <PermissionGuard permission="view_services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Hizmetler
          </h1>
          <p className="text-muted-foreground">
            İşletme hizmetlerini görüntüleyin.
          </p>
        </div>

        <Card>
          <CardContent className="py-8 text-center">
            <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Hizmet listesi yakında eklenecek.</p>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default StaffServices;
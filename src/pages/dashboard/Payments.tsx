import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

const Payments = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-8 w-8 text-brand-primary" />
          Ödeme ve Finans Takibi
        </h1>
        <p className="text-muted-foreground mt-1">
          Gelir raporları ve ödeme takibi.
        </p>
      </div>

      <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Ödeme Takibi
          </h3>
          <p className="text-muted-foreground text-center">
            Bu sayfa geliştirilme aşamasında.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
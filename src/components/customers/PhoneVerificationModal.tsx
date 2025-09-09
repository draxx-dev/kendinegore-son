import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Smartphone, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { phoneVerificationAPI, netGSMService } from "@/integrations/supabase/sms";

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  businessId: string;
  onVerificationSuccess: () => void;
}

const PhoneVerificationModal = ({
  isOpen,
  onClose,
  phoneNumber,
  businessId,
  onVerificationSuccess
}: PhoneVerificationModalProps) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      sendVerificationCode();
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendVerificationCode = async () => {
    setIsLoading(true);
    try {
      const result = await phoneVerificationAPI.createVerification(phoneNumber, businessId);
      
      if (result) {
        setCountdown(600); // 10 minutes
        toast({
          title: "Doğrulama kodu gönderildi",
          description: `${phoneNumber} numarasına 6 haneli doğrulama kodu gönderildi.`,
        });
      } else {
        toast({
          title: "Hata",
          description: "Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Verification code send error:', error);
      toast({
        title: "Hata",
        description: "Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      await sendVerificationCode();
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen doğrulama kodunu girin.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await phoneVerificationAPI.verifyCode(phoneNumber, verificationCode, businessId);
      
      if (isValid) {
        setVerificationResult({
          success: true,
          message: "Telefon numarası başarıyla doğrulandı!"
        });
        
        toast({
          title: "Başarılı!",
          description: "Telefon numarası doğrulandı.",
        });

        // Close modal after 2 seconds
        setTimeout(() => {
          onVerificationSuccess();
          onClose();
        }, 2000);
      } else {
        setVerificationResult({
          success: false,
          message: "Geçersiz doğrulama kodu. Lütfen tekrar deneyin."
        });
        
        toast({
          title: "Hata",
          description: "Geçersiz doğrulama kodu. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Code verification error:', error);
      toast({
        title: "Hata",
        description: "Doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-brand-primary" />
            Telefon Doğrulama
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Phone Number Display */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Doğrulama kodu gönderildi:
            </p>
            <p className="text-lg font-semibold text-foreground">
              {phoneNumber}
            </p>
          </div>

          {/* Verification Code Input */}
          <div className="space-y-2">
            <Label htmlFor="verification-code">Doğrulama Kodu</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="6 haneli kodu girin"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>

          {/* Countdown Timer */}
          {countdown > 0 && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Kod geçerliliği: {formatCountdown(countdown)}</span>
              </div>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <div className={`p-3 rounded-lg text-center ${
              verificationResult.success 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-center justify-center gap-2">
                {verificationResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {verificationResult.message}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleVerifyCode}
              disabled={isLoading || !verificationCode.trim()}
              className="flex-1"
              variant="brand"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Doğrula
            </Button>
            
            <Button
              onClick={handleResendCode}
              disabled={isResending || countdown > 0}
              variant="outline"
            >
              {isResending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Tekrar Gönder
            </Button>
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneVerificationModal;

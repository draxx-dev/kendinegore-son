import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  X,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  skipped: boolean;
  actionUrl: string;
  actionText: string;
}

interface SetupProgressCardProps {
  steps: SetupStep[];
  progress: number;
  loading: boolean;
  onSkip: (stepId: string) => void;
  onUnskip: (stepId: string) => void;
  onRefresh: () => void;
}

export const SetupProgressCard = ({ 
  steps, 
  progress, 
  loading, 
  onSkip, 
  onUnskip, 
  onRefresh 
}: SetupProgressCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHidden, setIsHidden] = useState(() => {
    // localStorage'dan gizleme durumunu kontrol et
    return localStorage.getItem('setupProgressHidden') === 'true';
  });
  const navigate = useNavigate();

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const isFullyCompleted = completedSteps === totalSteps;

  // Kurulum tamamlandıysa ve daha önce gizlenmemişse otomatik gizle
  useEffect(() => {
    if (isFullyCompleted && !isHidden) {
      const autoHideTimer = setTimeout(() => {
        handleHide();
      }, 5000); // 5 saniye sonra otomatik gizle

      return () => clearTimeout(autoHideTimer);
    }
  }, [isFullyCompleted, isHidden]);

  if (isHidden) return null;

  const handleAction = (step: SetupStep) => {
    navigate(step.actionUrl);
  };

  const handleHide = () => {
    setIsHidden(true);
    localStorage.setItem('setupProgressHidden', 'true');
  };

  const handleShow = () => {
    setIsHidden(false);
    localStorage.removeItem('setupProgressHidden');
  };

  const getStepIcon = (step: SetupStep) => {
    if (step.completed) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (step.skipped) {
      return <Circle className="h-5 w-5 text-gray-400" />;
    }
    return <Circle className="h-5 w-5 text-blue-600" />;
  };

  const getStepStatus = (step: SetupStep) => {
    if (step.completed) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Tamamlandı</Badge>;
    }
    if (step.skipped) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Atlandı</Badge>;
    }
    return <Badge variant="outline" className="border-blue-200 text-blue-600">Bekliyor</Badge>;
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-blue-600">Kurulum durumu kontrol ediliyor...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 transition-all duration-300",
      isFullyCompleted && "from-green-50 to-emerald-50 border-green-200"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isFullyCompleted ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <Circle className="h-6 w-6 text-blue-600" />
              )}
              <div>
                <CardTitle className="text-lg">
                  {isFullyCompleted ? 'Kurulum Tamamlandı! 🎉' : 'Kurulum Adımları'}
                </CardTitle>
                <CardDescription>
                  {isFullyCompleted 
                    ? 'Tebrikler! Tüm kurulum adımlarını tamamladınız.'
                    : `${completedSteps}/${totalSteps} adım tamamlandı`
                  }
                </CardDescription>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="text-blue-600 hover:text-blue-700"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-700"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHide}
              className="text-gray-500 hover:text-gray-700"
              title="Kurulum kartını gizle"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isFullyCompleted && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-blue-700 mb-2">
              <span>İlerleme</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
                  step.completed 
                    ? "bg-green-50 border-green-200" 
                    : step.skipped
                    ? "bg-gray-50 border-gray-200"
                    : "bg-white border-blue-200 hover:border-blue-300"
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {getStepIcon(step)}
                    <span className="font-medium text-sm">{index + 1}.</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{step.title}</h4>
                      {getStepStatus(step)}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!step.completed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(step)}
                      className="text-xs h-7 px-3"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {step.actionText}
                    </Button>
                  )}
                  
                  {!step.completed && !step.skipped && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSkip(step.id)}
                      className="text-xs h-7 px-2 text-gray-500 hover:text-gray-700"
                    >
                      Atla
                    </Button>
                  )}
                  
                  {step.skipped && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onUnskip(step.id)}
                      className="text-xs h-7 px-2 text-blue-600 hover:text-blue-700"
                    >
                      Geri Al
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isFullyCompleted && (
            <div className="mt-4 p-4 bg-green-100 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Kurulum başarıyla tamamlandı!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Artık tüm özellikleri kullanabilirsiniz. İyi çalışmalar! 🚀
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleHide}
                  className="text-green-700 border-green-300 hover:bg-green-50"
                >
                  Kartı Gizle
                </Button>
                <span className="text-xs text-green-600">
                  (5 saniye sonra otomatik gizlenecek)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

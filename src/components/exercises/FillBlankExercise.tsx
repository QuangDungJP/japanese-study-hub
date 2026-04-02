import { useState, useEffect } from 'react';
import { Check, X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FillBlankItem {
  sentence: string; // Use ___ for blank
  answer: string;
  hint?: string;
}

interface FillBlankExerciseProps {
  items: FillBlankItem[];
  onComplete: (correctCount: number) => void;
}

const FillBlankExercise = ({ items, onComplete }: FillBlankExerciseProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>(Array(items.length).fill(''));
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<boolean[]>([]);
  const [isShaking, setIsShaking] = useState(false);

  const currentItem = items[currentIndex];
  const progress = ((currentIndex + 1) / items.length) * 100;

  // Split sentence by blank marker
  const parts = currentItem.sentence.split('___');

  const handleSubmit = () => {
    const isCorrect = userAnswers[currentIndex].toLowerCase().trim() === 
                      currentItem.answer.toLowerCase().trim();
    
    const newCorrectAnswers = [...correctAnswers];
    newCorrectAnswers[currentIndex] = isCorrect;
    setCorrectAnswers(newCorrectAnswers);
    setShowResult(true);

    if (!isCorrect) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowResult(false);
      setShowHint(false);
    } else {
      const totalCorrect = correctAnswers.filter(Boolean).length + 
        (userAnswers[currentIndex].toLowerCase().trim() === currentItem.answer.toLowerCase().trim() ? 1 : 0);
      onComplete(totalCorrect);
    }
  };

  const handleInputChange = (value: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = value;
    setUserAnswers(newAnswers);
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Câu {currentIndex + 1}/{items.length}
          </span>
          <span className="text-primary font-medium">
            Đúng: {correctAnswers.filter(Boolean).length}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Exercise Card */}
      <div 
        className={cn(
          "bg-card rounded-3xl border border-border p-8 transition-all duration-300",
          isShaking && "animate-shake"
        )}
      >
        <h3 className="text-lg font-medium text-muted-foreground mb-6">
          Điền vào chỗ trống:
        </h3>

        <div className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed flex flex-wrap items-center gap-2">
          {parts.map((part, index) => (
            <span key={index} className="flex items-center gap-2">
              <span>{part}</span>
              {index < parts.length - 1 && (
                <div className="relative inline-block">
                  <Input
                    value={userAnswers[currentIndex]}
                    onChange={(e) => handleInputChange(e.target.value)}
                    disabled={showResult}
                    className={cn(
                      "w-40 text-xl font-medium text-center border-b-4 rounded-lg transition-all",
                      showResult && correctAnswers[currentIndex] && "border-green-500 bg-green-50 dark:bg-green-950/30",
                      showResult && !correctAnswers[currentIndex] && "border-red-500 bg-red-50 dark:bg-red-950/30",
                      !showResult && "border-primary focus:ring-2 focus:ring-primary/20"
                    )}
                    onKeyDown={(e) => e.key === 'Enter' && !showResult && handleSubmit()}
                  />
                  {showResult && (
                    <div className={cn(
                      "absolute -right-8 top-1/2 -translate-y-1/2",
                      "animate-scale-in"
                    )}>
                      {correctAnswers[currentIndex] ? (
                        <Check className="w-6 h-6 text-green-500" />
                      ) : (
                        <X className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </span>
          ))}
        </div>

        {/* Hint */}
        {currentItem.hint && !showResult && (
          <div className="mt-6">
            {showHint ? (
              <div className="flex items-center gap-2 text-accent animate-fade-in">
                <Lightbulb className="w-5 h-5" />
                <span>{currentItem.hint}</span>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(true)}
                className="text-muted-foreground"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Xem gợi ý
              </Button>
            )}
          </div>
        )}

        {/* Result */}
        {showResult && !correctAnswers[currentIndex] && (
          <div className="mt-6 p-4 rounded-xl bg-muted/50 animate-fade-in">
            <p className="text-muted-foreground">
              Đáp án đúng: <span className="font-bold text-primary">{currentItem.answer}</span>
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {!showResult ? (
          <Button
            variant="hero"
            size="lg"
            onClick={handleSubmit}
            disabled={!userAnswers[currentIndex].trim()}
            className="px-8 rounded-full"
          >
            Kiểm tra
          </Button>
        ) : (
          <Button
            variant="default"
            size="lg"
            onClick={handleNext}
            className="px-8 rounded-full"
          >
            {currentIndex < items.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FillBlankExercise;

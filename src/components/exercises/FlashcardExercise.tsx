import { useState } from 'react';
import { RotateCw, ChevronLeft, ChevronRight, Check, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FlashcardItem {
  word: string;
  meaning: string;
  pronunciation?: string;
  example?: string;
  exampleVi?: string;
}

interface FlashcardExerciseProps {
  items: FlashcardItem[];
  onComplete: (masteredCount: number) => void;
}

const FlashcardExercise = ({ items, onComplete }: FlashcardExerciseProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastered, setMastered] = useState<Set<number>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const currentItem = items[currentIndex];
  const progress = ((currentIndex + 1) / items.length) * 100;

  const handleFlip = () => {
    if (!isAnimating) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleNext = (isMastered: boolean) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSlideDirection('left');

    if (isMastered) {
      setMastered(prev => new Set([...prev, currentIndex]));
    }

    setTimeout(() => {
      if (currentIndex < items.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        onComplete(isMastered ? mastered.size + 1 : mastered.size);
      }
      setSlideDirection(null);
      setIsAnimating(false);
    }, 300);
  };

  const handlePrevious = () => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setSlideDirection('right');
      
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setIsFlipped(false);
        setSlideDirection(null);
        setIsAnimating(false);
      }, 300);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Thẻ {currentIndex + 1}/{items.length}
          </span>
          <span className="text-primary font-medium">
            Đã thuộc: {mastered.size}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="perspective-1000">
        <div
          onClick={handleFlip}
          className={cn(
            "relative w-full aspect-[3/2] cursor-pointer transition-all duration-500 transform-style-3d",
            isFlipped && "rotate-y-180",
            slideDirection === 'left' && "animate-slide-out-left",
            slideDirection === 'right' && "animate-slide-out-right"
          )}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front side */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/10 via-card to-primary/5 rounded-3xl border border-border shadow-lg flex flex-col items-center justify-center p-8 backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
              Nhấn để lật thẻ
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground text-center mb-4">
              {currentItem.word}
            </h2>
            {currentItem.pronunciation && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Volume2 className="w-4 h-4" />
                <span className="text-lg">{currentItem.pronunciation}</span>
              </div>
            )}
            <div className="absolute bottom-6 flex items-center gap-2 text-sm text-muted-foreground">
              <RotateCw className="w-4 h-4" />
              <span>Lật thẻ</span>
            </div>
          </div>

          {/* Back side */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-accent/10 via-card to-accent/5 rounded-3xl border border-border shadow-lg flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <span className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
              Nghĩa
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-6">
              {currentItem.meaning}
            </h2>
            {currentItem.example && (
              <div className="text-center space-y-2 max-w-md">
                <p className="text-muted-foreground italic">"{currentItem.example}"</p>
                {currentItem.exampleVi && (
                  <p className="text-sm text-muted-foreground/70">{currentItem.exampleVi}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={currentIndex === 0 || isAnimating}
          className="w-12 h-12 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={() => handleNext(false)}
          disabled={isAnimating}
          className="px-6 rounded-full"
        >
          <X className="w-5 h-5 mr-2" />
          Chưa thuộc
        </Button>

        <Button
          variant="default"
          size="lg"
          onClick={() => handleNext(true)}
          disabled={isAnimating}
          className="px-6 rounded-full bg-green-500 hover:bg-green-600"
        >
          <Check className="w-5 h-5 mr-2" />
          Đã thuộc
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => handleNext(false)}
          disabled={isAnimating}
          className="w-12 h-12 rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default FlashcardExercise;

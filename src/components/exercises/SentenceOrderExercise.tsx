import { useState, useEffect } from 'react';
import { Check, X, RotateCcw, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SentenceOrderItem {
  correctOrder: string[];
  translation?: string;
}

interface SentenceOrderExerciseProps {
  items: SentenceOrderItem[];
  onComplete: (correctCount: number) => void;
}

const SentenceOrderExercise = ({ items, onComplete }: SentenceOrderExerciseProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const currentItem = items[currentIndex];
  const progress = ((currentIndex + 1) / items.length) * 100;

  useEffect(() => {
    // Shuffle words for current item
    const shuffled = [...currentItem.correctOrder].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setSelectedWords([]);
    setShowResult(false);
  }, [currentIndex, currentItem]);

  const handleWordClick = (word: string, fromSelected: boolean) => {
    if (showResult) return;

    if (fromSelected) {
      // Remove from selected, add back to available
      setSelectedWords(prev => prev.filter(w => w !== word));
      setShuffledWords(prev => [...prev, word]);
    } else {
      // Add to selected, remove from available
      setSelectedWords(prev => [...prev, word]);
      setShuffledWords(prev => prev.filter(w => w !== word));
    }
  };

  const handleCheck = () => {
    const correct = selectedWords.join(' ') === currentItem.correctOrder.join(' ');
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(correctCount + (isCorrect ? 1 : 0));
    }
  };

  const handleReset = () => {
    const shuffled = [...currentItem.correctOrder].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setSelectedWords([]);
    setShowResult(false);
  };

  // Drag and drop handlers for reordering selected words
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...selectedWords];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setSelectedWords(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
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
            Đúng: {correctCount}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Translation hint */}
      {currentItem.translation && (
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-muted-foreground">{currentItem.translation}</p>
        </div>
      )}

      {/* Selected words area */}
      <div 
        className={cn(
          "min-h-24 bg-card rounded-2xl border-2 border-dashed p-4 transition-all",
          showResult && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950/20",
          showResult && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-950/20",
          !showResult && selectedWords.length > 0 && "border-primary",
          !showResult && selectedWords.length === 0 && "border-muted-foreground/30"
        )}
      >
        {selectedWords.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nhấn vào các từ bên dưới để sắp xếp câu
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedWords.map((word, index) => (
              <div
                key={`selected-${word}-${index}`}
                draggable={!showResult}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => handleWordClick(word, true)}
                className={cn(
                  "flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer",
                  "hover:scale-105 active:scale-95",
                  showResult && isCorrect && "bg-green-500 text-white",
                  showResult && !isCorrect && "bg-red-500/20 text-red-700 dark:text-red-400",
                  !showResult && "bg-primary text-primary-foreground",
                  draggedIndex === index && "opacity-50"
                )}
              >
                {!showResult && <GripVertical className="w-4 h-4 opacity-50" />}
                {word}
              </div>
            ))}
            {showResult && (
              <div className="ml-2 animate-scale-in">
                {isCorrect ? (
                  <Check className="w-6 h-6 text-green-500" />
                ) : (
                  <X className="w-6 h-6 text-red-500" />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Available words */}
      <div className="flex flex-wrap gap-2 justify-center min-h-16">
        {shuffledWords.map((word, index) => (
          <button
            key={`available-${word}-${index}`}
            onClick={() => handleWordClick(word, false)}
            disabled={showResult}
            className={cn(
              "px-4 py-2 rounded-lg border-2 border-border bg-card font-medium transition-all",
              "hover:border-primary hover:bg-primary/5 hover:scale-105",
              "active:scale-95",
              showResult && "opacity-50 cursor-not-allowed"
            )}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Correct answer */}
      {showResult && !isCorrect && (
        <div className="bg-muted rounded-xl p-4 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-1">Đáp án đúng:</p>
          <p className="font-medium text-foreground">
            {currentItem.correctOrder.join(' ')}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {!showResult ? (
          <>
            <Button
              variant="outline"
              size="lg"
              onClick={handleReset}
              className="rounded-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Làm lại
            </Button>
            <Button
              variant="hero"
              size="lg"
              onClick={handleCheck}
              disabled={selectedWords.length !== currentItem.correctOrder.length}
              className="px-8 rounded-full"
            >
              Kiểm tra
            </Button>
          </>
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

export default SentenceOrderExercise;

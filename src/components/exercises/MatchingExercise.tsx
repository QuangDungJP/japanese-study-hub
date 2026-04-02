import { useState, useEffect } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MatchingPair {
  left: string;
  right: string;
}

interface MatchingExerciseProps {
  pairs: MatchingPair[];
  onComplete: (correctCount: number) => void;
}

const MatchingExercise = ({ pairs, onComplete }: MatchingExerciseProps) => {
  const [shuffledRight, setShuffledRight] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [wrongPair, setWrongPair] = useState<{left: number; right: number} | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // Shuffle right column
    const shuffled = [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5);
    setShuffledRight(shuffled);
  }, [pairs]);

  useEffect(() => {
    if (selectedLeft !== null && selectedRight !== null) {
      const leftItem = pairs[selectedLeft].left;
      const rightItem = shuffledRight[selectedRight];
      const isCorrect = pairs[selectedLeft].right === rightItem;

      setAttempts(prev => prev + 1);

      if (isCorrect) {
        setMatchedPairs(prev => new Set([...prev, selectedLeft]));
        setTimeout(() => {
          setSelectedLeft(null);
          setSelectedRight(null);
          
          if (matchedPairs.size + 1 === pairs.length) {
            // All matched!
            const score = Math.max(0, pairs.length - (attempts - pairs.length));
            onComplete(score);
          }
        }, 500);
      } else {
        setWrongPair({ left: selectedLeft, right: selectedRight });
        setTimeout(() => {
          setWrongPair(null);
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 800);
      }
    }
  }, [selectedLeft, selectedRight]);

  const handleLeftClick = (index: number) => {
    if (matchedPairs.has(index)) return;
    setSelectedLeft(index);
  };

  const handleRightClick = (index: number) => {
    const originalIndex = pairs.findIndex(p => p.right === shuffledRight[index]);
    if (matchedPairs.has(originalIndex)) return;
    setSelectedRight(index);
  };

  const getLeftItemStyle = (index: number) => {
    if (matchedPairs.has(index)) {
      return "bg-green-100 border-green-500 text-green-700 dark:bg-green-950/30 dark:text-green-400 opacity-60";
    }
    if (wrongPair?.left === index) {
      return "bg-red-100 border-red-500 text-red-700 dark:bg-red-950/30 dark:text-red-400 animate-shake";
    }
    if (selectedLeft === index) {
      return "bg-primary/20 border-primary text-primary ring-2 ring-primary/30";
    }
    return "bg-card border-border hover:border-primary/50 hover:bg-primary/5";
  };

  const getRightItemStyle = (index: number) => {
    const originalIndex = pairs.findIndex(p => p.right === shuffledRight[index]);
    if (matchedPairs.has(originalIndex)) {
      return "bg-green-100 border-green-500 text-green-700 dark:bg-green-950/30 dark:text-green-400 opacity-60";
    }
    if (wrongPair?.right === index) {
      return "bg-red-100 border-red-500 text-red-700 dark:bg-red-950/30 dark:text-red-400 animate-shake";
    }
    if (selectedRight === index) {
      return "bg-accent/20 border-accent text-accent ring-2 ring-accent/30";
    }
    return "bg-card border-border hover:border-accent/50 hover:bg-accent/5";
  };

  const handleReset = () => {
    setMatchedPairs(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
    setWrongPair(null);
    setAttempts(0);
    const shuffled = [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5);
    setShuffledRight(shuffled);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Đã nối: <span className="font-bold text-primary">{matchedPairs.size}/{pairs.length}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-muted-foreground"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Làm lại
        </Button>
      </div>

      {/* Progress */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(matchedPairs.size / pairs.length) * 100}%` }}
        />
      </div>

      {/* Matching Area */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-3">
          {pairs.map((pair, index) => (
            <button
              key={`left-${index}`}
              onClick={() => handleLeftClick(index)}
              disabled={matchedPairs.has(index)}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all duration-300",
                "font-medium",
                getLeftItemStyle(index)
              )}
            >
              <div className="flex items-center justify-between">
                <span>{pair.left}</span>
                {matchedPairs.has(index) && (
                  <Check className="w-5 h-5 text-green-500 animate-scale-in" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          {shuffledRight.map((item, index) => {
            const originalIndex = pairs.findIndex(p => p.right === item);
            return (
              <button
                key={`right-${index}`}
                onClick={() => handleRightClick(index)}
                disabled={matchedPairs.has(originalIndex)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all duration-300",
                  "font-medium",
                  getRightItemStyle(index)
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{item}</span>
                  {matchedPairs.has(originalIndex) && (
                    <Check className="w-5 h-5 text-green-500 animate-scale-in" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connection lines would be rendered with SVG in a more advanced version */}
      
      {/* Instructions */}
      <p className="text-center text-sm text-muted-foreground">
        Nhấn vào một mục bên trái, sau đó nhấn vào mục tương ứng bên phải để nối cặp
      </p>
    </div>
  );
};

export default MatchingExercise;

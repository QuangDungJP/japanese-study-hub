import { useState } from 'react';
import { Check, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface QuizExerciseProps {
  questions: QuizQuestion[];
  onComplete: (correctCount: number) => void;
}

const QuizExercise = ({ questions, onComplete }: QuizExerciseProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>([]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isCorrect = selectedAnswer === currentQuestion.correct;

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleCheck = () => {
    setShowResult(true);
    const newAnswered = [...answeredQuestions];
    newAnswered[currentIndex] = isCorrect;
    setAnsweredQuestions(newAnswered);
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      onComplete(correctCount + (isCorrect ? 1 : 0));
    }
  };

  const getOptionStyle = (index: number) => {
    if (!showResult) {
      if (selectedAnswer === index) {
        return "bg-primary/20 border-primary ring-2 ring-primary/30";
      }
      return "bg-card border-border hover:border-primary/50 hover:bg-primary/5";
    }

    if (index === currentQuestion.correct) {
      return "bg-green-100 border-green-500 text-green-700 dark:bg-green-950/30 dark:text-green-400";
    }
    if (selectedAnswer === index && !isCorrect) {
      return "bg-red-100 border-red-500 text-red-700 dark:bg-red-950/30 dark:text-red-400";
    }
    return "bg-muted/50 border-border opacity-50";
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Câu {currentIndex + 1}/{questions.length}
          </span>
          <span className="text-primary font-medium">
            Đúng: {correctCount}/{currentIndex + (showResult ? 1 : 0)}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question indicators */}
      <div className="flex gap-2 justify-center flex-wrap">
        {questions.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
              index === currentIndex && "ring-2 ring-primary",
              index < currentIndex && answeredQuestions[index] && "bg-green-500 text-white",
              index < currentIndex && !answeredQuestions[index] && "bg-red-500 text-white",
              index > currentIndex && "bg-muted text-muted-foreground",
              index === currentIndex && "bg-primary text-primary-foreground"
            )}
          >
            {index + 1}
          </div>
        ))}
      </div>

      {/* Question Card */}
      <div className="bg-card rounded-3xl border border-border p-8">
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-8">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={showResult}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all duration-300",
                "flex items-center gap-4",
                getOptionStyle(index)
              )}
            >
              <span className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium text-sm",
                selectedAnswer === index && !showResult && "border-primary bg-primary text-primary-foreground",
                showResult && index === currentQuestion.correct && "border-green-500 bg-green-500 text-white",
                showResult && selectedAnswer === index && !isCorrect && "border-red-500 bg-red-500 text-white"
              )}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1 font-medium">{option}</span>
              {showResult && index === currentQuestion.correct && (
                <Check className="w-6 h-6 text-green-500 animate-scale-in" />
              )}
              {showResult && selectedAnswer === index && !isCorrect && (
                <X className="w-6 h-6 text-red-500 animate-scale-in" />
              )}
            </button>
          ))}
        </div>

        {/* Explanation */}
        {showResult && currentQuestion.explanation && (
          <div className="mt-6 p-4 rounded-xl bg-muted/50 animate-fade-in">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Giải thích:</span>{' '}
              {currentQuestion.explanation}
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
            onClick={handleCheck}
            disabled={selectedAnswer === null}
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
            {currentIndex < questions.length - 1 ? (
              <>
                Câu tiếp theo
                <ChevronRight className="w-5 h-5 ml-1" />
              </>
            ) : (
              'Hoàn thành'
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizExercise;

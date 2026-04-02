import { useState, useEffect } from 'react';
import { BookText, Volume2, RotateCcw, Check, X, Zap, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearning } from '@/contexts/LearningContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VocabularyItem {
  id: string;
  word: string;
  meaning_vi: string;
  pronunciation: string | null;
  example: string | null;
  example_vi: string | null;
  category: string | null;
  level: string;
}

const Vocabulary = () => {
  const { addXp, currentLanguage } = useLearning();
  const [vocabularyData, setVocabularyData] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<string[]>([]);
  const [mode, setMode] = useState<'review' | 'quiz'>('review');
  const [quizAnswer, setQuizAnswer] = useState('');
  const [showQuizResult, setShowQuizResult] = useState(false);

  useEffect(() => {
    const fetchVocabulary = async () => {
      const { data } = await supabase
        .from('vocabulary')
        .select('*')
        .eq('language', currentLanguage)
        .order('created_at', { ascending: true });

      if (data) {
        setVocabularyData(data);
      }
      setLoading(false);
    };

    fetchVocabulary();
  }, [currentLanguage]);

  const currentCard = vocabularyData[currentIndex];
  const progress = vocabularyData.length > 0 ? ((currentIndex + 1) / vocabularyData.length) * 100 : 0;

  const handleNext = (mastered: boolean) => {
    if (!currentCard) return;
    
    if (mastered && !masteredCards.includes(currentCard.id)) {
      setMasteredCards(prev => [...prev, currentCard.id]);
      addXp(5);
      toast({
        title: '+5 XP',
        description: 'Đã ghi nhớ từ vựng!',
      });
    }
    
    setIsFlipped(false);
    if (currentIndex < vocabularyData.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      toast({
        title: 'Hoàn thành!',
        description: `Bạn đã ghi nhớ ${masteredCards.length + (mastered ? 1 : 0)}/${vocabularyData.length} từ`,
      });
      setCurrentIndex(0);
    }
  };

  const handleQuizSubmit = () => {
    if (!currentCard) return;
    
    setShowQuizResult(true);
    if (quizAnswer.toLowerCase().trim() === currentCard.meaning_vi.toLowerCase()) {
      addXp(10);
      toast({
        title: 'Chính xác! +10 XP',
        description: `${currentCard.word} = ${currentCard.meaning_vi}`,
      });
    }
  };

  const handleQuizNext = () => {
    setQuizAnswer('');
    setShowQuizResult(false);
    if (currentIndex < vocabularyData.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (vocabularyData.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <BookText className="w-5 h-5 text-indigo-500" />
            </div>
            Từ vựng
          </h1>
          <p className="text-muted-foreground mt-1">Học và ghi nhớ từ vựng với Flashcards</p>
        </div>
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <BookText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có từ vựng nào</h3>
          <p className="text-muted-foreground">Admin hãy thêm từ vựng trong trang quản trị.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <BookText className="w-5 h-5 text-indigo-500" />
            </div>
            Từ vựng
          </h1>
          <p className="text-muted-foreground mt-1">Học và ghi nhớ từ vựng với Flashcards</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/50">
          <button
            onClick={() => setMode('review')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'review' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookText className="w-4 h-4 inline-block mr-2" />
            Xem lại
          </button>
          <button
            onClick={() => setMode('quiz')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'quiz' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Brain className="w-4 h-4 inline-block mr-2" />
            Kiểm tra
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Tiến độ</span>
          <span className="font-medium text-foreground">{currentIndex + 1}/{vocabularyData.length}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {currentCard && mode === 'review' ? (
        /* Flashcard Mode */
        <div className="flex flex-col items-center">
          {/* Flashcard */}
          <div 
            className="w-full max-w-lg aspect-[3/2] perspective-1000 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <div className="absolute inset-0 bg-card rounded-3xl border border-border shadow-card-hover backface-hidden flex flex-col items-center justify-center p-8">
                <p className="text-4xl font-bold text-foreground mb-4">{currentCard.word}</p>
                <p className="text-lg text-muted-foreground mb-4">{currentCard.pronunciation}</p>
                <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                  <Volume2 className="w-5 h-5" />
                  Phát âm
                </button>
                <p className="text-sm text-muted-foreground mt-8">Nhấn để xem nghĩa</p>
              </div>

              {/* Back */}
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl shadow-card-hover backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 text-primary-foreground">
                <p className="text-3xl font-bold mb-4">{currentCard.meaning_vi}</p>
                {currentCard.example && (
                  <div className="bg-white/10 rounded-xl p-4 w-full">
                    <p className="text-lg mb-2">"{currentCard.example}"</p>
                    <p className="text-sm opacity-80">{currentCard.example_vi}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-8">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => handleNext(false)}
              className="gap-2"
            >
              <X className="w-5 h-5 text-destructive" />
              Chưa nhớ
            </Button>
            <Button 
              variant="default" 
              size="lg"
              onClick={() => handleNext(true)}
              className="gap-2"
            >
              <Check className="w-5 h-5" />
              Đã nhớ
            </Button>
          </div>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentIndex(0)}
            className="mt-4 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Học lại từ đầu
          </Button>
        </div>
      ) : currentCard && mode === 'quiz' ? (
        /* Quiz Mode */
        <div className="max-w-lg mx-auto">
          <div className="bg-card rounded-3xl border border-border p-8 shadow-soft">
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground mb-2">Dịch từ này sang tiếng Việt:</p>
              <p className="text-4xl font-bold text-foreground">{currentCard.word}</p>
              <p className="text-muted-foreground mt-2">{currentCard.pronunciation}</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={quizAnswer}
                onChange={(e) => setQuizAnswer(e.target.value)}
                placeholder="Nhập nghĩa tiếng Việt..."
                className="w-full h-14 px-4 rounded-xl bg-muted/50 border border-border text-center text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                disabled={showQuizResult}
                onKeyDown={(e) => e.key === 'Enter' && !showQuizResult && handleQuizSubmit()}
              />

              {showQuizResult && (
                <div className={`p-4 rounded-xl ${
                  quizAnswer.toLowerCase().trim() === currentCard.meaning_vi.toLowerCase()
                    ? 'bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900'
                    : 'bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900'
                }`}>
                  {quizAnswer.toLowerCase().trim() === currentCard.meaning_vi.toLowerCase() ? (
                    <p className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                      <Check className="w-5 h-5" /> Chính xác!
                    </p>
                  ) : (
                    <div>
                      <p className="text-red-700 dark:text-red-400 font-medium flex items-center gap-2 mb-2">
                        <X className="w-5 h-5" /> Chưa đúng
                      </p>
                      <p className="text-sm">Đáp án đúng: <span className="font-bold">{currentCard.meaning_vi}</span></p>
                    </div>
                  )}
                </div>
              )}

              {!showQuizResult ? (
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={handleQuizSubmit}
                  disabled={!quizAnswer.trim()}
                >
                  Kiểm tra
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full"
                  onClick={handleQuizNext}
                >
                  Từ tiếp theo
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-accent" />
              +10 XP mỗi câu đúng
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Vocabulary;

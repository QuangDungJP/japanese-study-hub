import { useState, useEffect } from 'react';
import { BookOpen, Clock, Zap, ChevronRight, Volume2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearning } from '@/contexts/LearningContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Lesson {
  id: string;
  title: string;
  title_vi: string;
  description: string | null;
  level: string;
  duration_minutes: number | null;
  xp_reward: number | null;
  content: {
    text?: string;
    questions?: Array<{
      id: number;
      question: string;
      options: string[];
      correct: number;
    }>;
  } | null;
}

const Reading = () => {
  const { addXp, currentLanguage, completedLessons } = useLearning();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [hoveredWord, setHoveredWord] = useState<{word: string, meaning: string} | null>(null);

  useEffect(() => {
    const fetchLessons = async () => {
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('skill', 'reading')
        .eq('language', currentLanguage)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (data) {
        setLessons(data.map(lesson => ({
          ...lesson,
          content: lesson.content as Lesson['content']
        })));
      }
      setLoading(false);
    };

    fetchLessons();
  }, [currentLanguage]);

  const handleAnswer = (questionId: number, optionIndex: number) => {
    if (!showResults) {
      setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    }
  };

  const handleSubmit = () => {
    if (!activeLesson?.content?.questions) return;
    
    setShowResults(true);
    const correct = activeLesson.content.questions.filter(
      q => selectedAnswers[q.id] === q.correct
    ).length;
    const xpEarned = correct * 10;
    addXp(xpEarned);
    toast({
      title: `Chúc mừng! +${xpEarned} XP`,
      description: `Bạn trả lời đúng ${correct}/${activeLesson.content.questions.length} câu hỏi`,
    });
  };

  const handleWordHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('vocab')) {
      const word = target.dataset.word || '';
      const meaning = target.dataset.meaning || '';
      setHoveredWord({ word, meaning });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
            Kỹ năng Đọc
          </h1>
          <p className="text-muted-foreground mt-1">Luyện đọc hiểu với các bài viết đa dạng</p>
        </div>
      </div>

      {!activeLesson ? (
        /* Lesson List */
        lessons.length > 0 ? (
          <div className="grid gap-4">
            {lessons.map((lesson, index) => {
              const isCompleted = completedLessons.includes(lesson.id);
              return (
                <div
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isCompleted 
                      ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' 
                      : 'bg-card border-border hover:border-primary/30 hover:shadow-soft'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? <Check className="w-6 h-6" /> : index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{lesson.title}</h3>
                      <p className="text-sm text-muted-foreground">{lesson.title_vi}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-full bg-muted">{lesson.level}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {lesson.duration_minutes || 15} phút
                        </span>
                        <span className="flex items-center gap-1 text-accent">
                          <Zap className="w-3 h-3" /> +{lesson.xp_reward || 25} XP
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có bài học nào</h3>
            <p className="text-muted-foreground">Admin hãy thêm bài học trong trang quản trị.</p>
          </div>
        )
      ) : (
        /* Active Lesson */
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => {
            setActiveLesson(null);
            setSelectedAnswers({});
            setShowResults(false);
          }}>
            ← Quay lại danh sách
          </Button>

          {/* Reading Content */}
          {activeLesson.content?.text && (
            <div className="bg-card rounded-2xl border border-border p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">{activeLesson.title}</h2>
              
              {hoveredWord && (
                <div className="mb-4 p-3 rounded-xl bg-accent/10 border border-accent/20 inline-flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-accent" />
                  <span className="font-semibold text-accent">{hoveredWord.word}</span>
                  <span className="text-muted-foreground">= {hoveredWord.meaning}</span>
                </div>
              )}

              <div 
                className="prose prose-lg dark:prose-invert max-w-none leading-relaxed"
                onMouseOver={handleWordHover}
                onMouseOut={() => setHoveredWord(null)}
                dangerouslySetInnerHTML={{ __html: activeLesson.content.text.replace(
                  /class="vocab"/g,
                  'class="vocab bg-accent/20 px-1 rounded cursor-help hover:bg-accent/30 transition-colors"'
                )}}
              />
            </div>
          )}

          {/* Questions */}
          {activeLesson.content?.questions && activeLesson.content.questions.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Câu hỏi kiểm tra</h3>
              
              <div className="space-y-6">
                {activeLesson.content.questions.map((q, qIndex) => (
                  <div key={q.id} className="space-y-3">
                    <p className="font-medium text-foreground">
                      {qIndex + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {q.options.map((option, oIndex) => {
                        const isSelected = selectedAnswers[q.id] === oIndex;
                        const isCorrect = q.correct === oIndex;
                        
                        let buttonClass = 'p-4 rounded-xl border text-left transition-all ';
                        if (showResults) {
                          if (isCorrect) {
                            buttonClass += 'bg-green-50 border-green-500 text-green-700 dark:bg-green-950/30 dark:text-green-400';
                          } else if (isSelected && !isCorrect) {
                            buttonClass += 'bg-red-50 border-red-500 text-red-700 dark:bg-red-950/30 dark:text-red-400';
                          } else {
                            buttonClass += 'bg-muted/50 border-border text-muted-foreground';
                          }
                        } else {
                          buttonClass += isSelected 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'bg-card border-border hover:border-primary/50';
                        }

                        return (
                          <button
                            key={oIndex}
                            onClick={() => handleAnswer(q.id, oIndex)}
                            className={buttonClass}
                            disabled={showResults}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full border flex items-center justify-center text-sm font-medium">
                                {String.fromCharCode(65 + oIndex)}
                              </span>
                              {option}
                              {showResults && isCorrect && <Check className="w-5 h-5 ml-auto text-green-500" />}
                              {showResults && isSelected && !isCorrect && <X className="w-5 h-5 ml-auto text-red-500" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {!showResults ? (
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="mt-6"
                  onClick={handleSubmit}
                  disabled={Object.keys(selectedAnswers).length < (activeLesson.content?.questions?.length || 0)}
                >
                  Nộp bài
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  size="lg" 
                  className="mt-6"
                  onClick={() => {
                    setActiveLesson(null);
                    setSelectedAnswers({});
                    setShowResults(false);
                  }}
                >
                  Hoàn thành bài học
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reading;

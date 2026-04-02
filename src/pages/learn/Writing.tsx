import { useState, useEffect } from 'react';
import { PenTool, Check, Lightbulb, Zap, Send, RotateCcw, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearning } from '@/contexts/LearningContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Lesson {
  id: string;
  title: string;
  title_vi: string;
  level: string;
  duration_minutes: number | null;
  xp_reward: number | null;
  content: {
    type?: 'fill-blank' | 'essay';
    sentences?: Array<{
      text: string;
      answer: string;
      hint: string;
    }>;
    prompt?: string;
    promptVi?: string;
    sampleAnswer?: string;
  } | null;
}

const Writing = () => {
  const { addXp, currentLanguage, completedLessons } = useLearning();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [fillBlanks, setFillBlanks] = useState<Record<number, string>>({});
  const [showFillResults, setShowFillResults] = useState(false);
  const [essayText, setEssayText] = useState('');
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});
  const [essaySubmitted, setEssaySubmitted] = useState(false);
  const [essayFeedback, setEssayFeedback] = useState<string | null>(null);

  useEffect(() => {
    const fetchLessons = async () => {
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('skill', 'writing')
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

  const handleFillSubmit = () => {
    if (!activeLesson?.content?.sentences) return;
    
    setShowFillResults(true);
    const correct = activeLesson.content.sentences.filter(
      (s, i) => fillBlanks[i]?.toLowerCase().trim() === s.answer.toLowerCase()
    ).length;
    const xpEarned = correct * 10;
    addXp(xpEarned);
    toast({
      title: `+${xpEarned} XP`,
      description: `Bạn điền đúng ${correct}/${activeLesson.content.sentences.length} câu`,
    });
  };

  const handleEssaySubmit = () => {
    if (essayText.split(' ').length < 20) {
      toast({
        title: 'Đoạn văn quá ngắn',
        description: 'Hãy viết ít nhất 50 từ',
        variant: 'destructive'
      });
      return;
    }

    setEssaySubmitted(true);
    setTimeout(() => {
      const wordCount = essayText.split(' ').length;
      const score = Math.min(100, Math.floor(wordCount * 1.5) + Math.floor(Math.random() * 20) + 60);
      const xpEarned = Math.floor(score / 5);
      
      setEssayFeedback(`
**Điểm: ${score}/100**

**Nhận xét:**
- Số từ: ${wordCount} từ ✓
- Cấu trúc câu: Khá tốt
- Từ vựng: Đa dạng
- Ngữ pháp: Cần chú ý thì của động từ

**Gợi ý cải thiện:**
- Sử dụng thêm các liên từ (however, moreover, therefore)
- Thêm ví dụ cụ thể để minh họa
      `);
      
      addXp(xpEarned);
      toast({
        title: `Đã nộp bài! +${xpEarned} XP`,
        description: 'AI đang chấm bài của bạn...',
      });
    }, 2000);
  };

  const wordCount = essayText.split(' ').filter(w => w.length > 0).length;

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
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <PenTool className="w-5 h-5 text-purple-500" />
          </div>
          Kỹ năng Viết
        </h1>
        <p className="text-muted-foreground mt-1">Luyện viết với AI chấm bài tự động</p>
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
                  onClick={() => {
                    setActiveLesson(lesson);
                    setFillBlanks({});
                    setShowFillResults(false);
                    setEssayText('');
                    setEssaySubmitted(false);
                    setEssayFeedback(null);
                  }}
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
            <PenTool className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có bài học nào</h3>
            <p className="text-muted-foreground">Admin hãy thêm bài học trong trang quản trị.</p>
          </div>
        )
      ) : (
        /* Active Lesson */
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setActiveLesson(null)}>
            ← Quay lại danh sách
          </Button>

          {activeLesson.content?.type === 'fill-blank' && activeLesson.content.sentences ? (
            /* Fill in the Blanks */
            <div className="bg-card rounded-2xl border border-border p-8">
              <h2 className="text-xl font-bold text-foreground mb-2">{activeLesson.title}</h2>
              <p className="text-muted-foreground mb-6">{activeLesson.title_vi}</p>

              <div className="space-y-6">
                {activeLesson.content.sentences.map((sentence, index) => {
                  const isCorrect = fillBlanks[index]?.toLowerCase().trim() === sentence.answer.toLowerCase();
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-medium text-sm">
                          {index + 1}
                        </span>
                        <p className="text-lg text-foreground flex-1">
                          {sentence.text.split('___')[0]}
                          <input
                            type="text"
                            value={fillBlanks[index] || ''}
                            onChange={(e) => setFillBlanks(prev => ({ ...prev, [index]: e.target.value }))}
                            disabled={showFillResults}
                            className={`w-32 mx-2 px-3 py-1 rounded-lg border text-center ${
                              showFillResults
                                ? isCorrect
                                  ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                                  : 'bg-red-50 border-red-500 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                : 'border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                            }`}
                            placeholder="..."
                          />
                          {sentence.text.split('___')[1]}
                        </p>
                      </div>
                      
                      {/* Hint */}
                      <div className="ml-12 flex items-center gap-2">
                        <button
                          onClick={() => setShowHints(prev => ({ ...prev, [index]: !prev[index] }))}
                          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                        >
                          <Lightbulb className="w-3 h-3" />
                          {showHints[index] ? 'Ẩn gợi ý' : 'Xem gợi ý'}
                        </button>
                        {showHints[index] && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            Gợi ý: {sentence.hint}
                          </span>
                        )}
                      </div>

                      {showFillResults && !isCorrect && (
                        <p className="ml-12 text-sm text-green-600 dark:text-green-400">
                          Đáp án đúng: <span className="font-bold">{sentence.answer}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 mt-8">
                {!showFillResults ? (
                  <Button variant="hero" size="lg" onClick={handleFillSubmit}>
                    <Check className="w-5 h-5" />
                    Kiểm tra
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    size="lg" 
                    onClick={() => {
                      setActiveLesson(null);
                      setFillBlanks({});
                      setShowFillResults(false);
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Hoàn thành
                  </Button>
                )}
              </div>
            </div>
          ) : activeLesson.content?.type === 'essay' || activeLesson.content?.prompt ? (
            /* Essay Writing */
            <div className="bg-card rounded-2xl border border-border p-8">
              <h2 className="text-xl font-bold text-foreground mb-2">{activeLesson.title}</h2>
              <div className="p-4 rounded-xl bg-muted/50 mb-6">
                <p className="text-foreground font-medium">{activeLesson.content?.prompt}</p>
                <p className="text-sm text-muted-foreground mt-1">{activeLesson.content?.promptVi}</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={essayText}
                    onChange={(e) => setEssayText(e.target.value)}
                    disabled={essaySubmitted}
                    placeholder="Start writing here..."
                    className="w-full h-48 p-4 rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <div className="absolute bottom-3 right-3 text-sm text-muted-foreground">
                    {wordCount} từ
                  </div>
                </div>

                {/* Word count indicator */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        wordCount >= 50 ? 'bg-green-500' : wordCount >= 30 ? 'bg-accent' : 'bg-muted-foreground'
                      }`}
                      style={{ width: `${Math.min(100, (wordCount / 100) * 100)}%` }}
                    />
                  </div>
                  <span className={`text-sm ${wordCount >= 50 ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {wordCount >= 50 ? '✓ Đủ độ dài' : `Cần thêm ${50 - wordCount} từ`}
                  </span>
                </div>

                {/* Feedback */}
                {essayFeedback && (
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 dark:bg-purple-950/20 dark:border-purple-900">
                    <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-500" />
                      AI Feedback
                    </h4>
                    <div className="prose prose-sm dark:prose-invert text-sm whitespace-pre-line">
                      {essayFeedback}
                    </div>
                  </div>
                )}

                {/* Sample Answer Toggle */}
                {essaySubmitted && activeLesson.content?.sampleAnswer && (
                  <details className="bg-muted/50 rounded-xl p-4">
                    <summary className="cursor-pointer font-medium text-foreground">
                      Xem bài mẫu
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      {activeLesson.content.sampleAnswer}
                    </p>
                  </details>
                )}

                <div className="flex items-center gap-4">
                  {!essaySubmitted ? (
                    <Button 
                      variant="hero" 
                      size="lg" 
                      onClick={handleEssaySubmit}
                      disabled={wordCount < 20}
                    >
                      <Send className="w-5 h-5" />
                      Nộp bài
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      size="lg" 
                      onClick={() => setActiveLesson(null)}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Hoàn thành
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <p className="text-muted-foreground">Bài học này chưa có nội dung.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Writing;

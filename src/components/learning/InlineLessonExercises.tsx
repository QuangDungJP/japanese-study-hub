import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLearning } from '@/contexts/LearningContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dumbbell, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Trophy, 
  RotateCcw, HelpCircle, FileText, Send, Star, BookOpen, PenTool, Headphones,
  Loader2
} from 'lucide-react';
import QuizExercise from '@/components/exercises/QuizExercise';
import FlashcardExercise from '@/components/exercises/FlashcardExercise';
import FillBlankExercise from '@/components/exercises/FillBlankExercise';
import MatchingExercise from '@/components/exercises/MatchingExercise';
import SentenceOrderExercise from '@/components/exercises/SentenceOrderExercise';

interface Exercise {
  id: string;
  lesson_id: string;
  exercise_type: string;
  title: string;
  title_vi: string;
  instructions?: string | null;
  instructions_vi?: string | null;
  content: any;
  correct_answers?: any;
  explanation?: any;
  requires_grading?: boolean;
  order_index?: number;
}

interface InlineLessonExercisesProps {
  lessonId: string;
  lessonTitle: string;
}

const exerciseTypeIcons: Record<string, any> = {
  quiz: HelpCircle,
  multiple_choice: HelpCircle,
  flashcard: BookOpen,
  vocabulary: BookOpen,
  fill_blank: FileText,
  'fill-blank': FileText,
  matching: Sparkles,
  sentence_order: Sparkles,
  'sentence-order': Sparkles,
  writing: PenTool,
  essay: PenTool,
  listening: Headphones,
};

const exerciseTypeLabels: Record<string, string> = {
  quiz: 'Trắc nghiệm',
  multiple_choice: 'Trắc nghiệm',
  flashcard: 'Từ vựng Flashcard',
  vocabulary: 'Từ vựng',
  fill_blank: 'Điền vào chỗ trống',
  'fill-blank': 'Điền vào chỗ trống',
  matching: 'Nối cặp đáp án',
  sentence_order: 'Sắp xếp câu',
  'sentence-order': 'Sắp xếp câu',
  writing: 'Bài tập Viết / Tự luận',
  essay: 'Bài tập Tự luận',
  listening: 'Nghe hiểu',
};

const exerciseTypeColors: Record<string, string> = {
  quiz: 'bg-pink-500/10 text-pink-600 border-pink-200',
  multiple_choice: 'bg-pink-500/10 text-pink-600 border-pink-200',
  flashcard: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  vocabulary: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  fill_blank: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
  'fill-blank': 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
  matching: 'bg-amber-500/10 text-amber-600 border-amber-200',
  sentence_order: 'bg-purple-500/10 text-purple-600 border-purple-200',
  'sentence-order': 'bg-purple-500/10 text-purple-600 border-purple-200',
  writing: 'bg-orange-500/10 text-orange-600 border-orange-200',
  essay: 'bg-orange-500/10 text-orange-600 border-orange-200',
  listening: 'bg-blue-500/10 text-blue-600 border-blue-200',
};

export const InlineLessonExercises = ({ lessonId, lessonTitle }: InlineLessonExercisesProps) => {
  const { user } = useAuth();
  const { addXp } = useLearning();
  const { toast } = useToast();
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [openExerciseId, setOpenExerciseId] = useState<string | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Record<string, { score: number; maxScore: number }>>({});
  const [writingContent, setWritingContent] = useState<Record<string, string>>({});
  const [submittingWriting, setSubmittingWriting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchExercises();
  }, [lessonId]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('id, lesson_id, exercise_type, title, title_vi, instructions, instructions_vi, content, requires_grading, order_index')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      const list = data || [];
      setExercises(list);
      // Auto open first exercise if list not empty
      if (list.length > 0) {
        setOpenExerciseId(list[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching inline exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = (id: string) => {
    setOpenExerciseId(prev => prev === id ? null : id);
  };

  const handleExerciseComplete = (exerciseId: string, score: number, maxScore: number) => {
    const xpEarned = Math.max(10, Math.round((score / Math.max(1, maxScore)) * 30));
    setCompletedExercises(prev => ({ ...prev, [exerciseId]: { score, maxScore } }));
    addXp(xpEarned);

    toast({
      title: `🎉 Hoàn thành bài tập! +${xpEarned} XP`,
      description: `Kết quả: ${score}/${maxScore} câu đúng.`,
    });
  };

  const handleWritingSubmit = async (exercise: Exercise) => {
    const text = writingContent[exercise.id]?.trim();
    if (!text) {
      toast({ title: 'Vui lòng nhập bài làm của bạn', variant: 'destructive' });
      return;
    }
    if (!user) return;

    try {
      setSubmittingWriting(prev => ({ ...prev, [exercise.id]: true }));
      const { error } = await supabase.from('student_submissions').insert({
        user_id: user.id,
        exercise_id: exercise.id,
        content: text,
        status: 'pending',
        submitted_at: new Date().toISOString()
      });

      if (error) throw error;

      setCompletedExercises(prev => ({ ...prev, [exercise.id]: { score: 1, maxScore: 1 } }));
      addXp(20);

      toast({
        title: 'Đã nộp bài tự luận!',
        description: 'Bài nộp của bạn đã được gửi cho giáo viên chấm điểm. (+20 XP)'
      });
    } catch (err: any) {
      toast({ title: 'Lỗi nộp bài', description: err.message, variant: 'destructive' });
    } finally {
      setSubmittingWriting(prev => ({ ...prev, [exercise.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        Đang tải bài tập tương tác...
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="py-8 text-center text-muted-foreground text-sm space-y-1">
          <Dumbbell className="w-8 h-8 mx-auto opacity-40 mb-2" />
          <p className="font-semibold text-foreground">Bài học này chưa có bài tập trực tiếp</p>
          <p className="text-xs">Giáo viên chưa cập nhật danh sách bài tập cho bài học này.</p>
        </CardContent>
      </Card>
    );
  }

  const completedCount = Object.keys(completedExercises).length;
  const totalCount = exercises.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-4">
      {/* Exercise Section Header */}
      <div className="bg-gradient-to-r from-primary/10 via-card to-accent/10 rounded-2xl p-4 border border-primary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base md:text-lg text-foreground flex items-center gap-2">
              Bài tập & Luyện tập tương tác
              <Badge variant="secondary" className="bg-primary/20 text-primary border-0 text-xs">
                {totalCount} bài tập
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">Làm bài tập ngay bên dưới để tích lũy điểm XP</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full sm:w-48 space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Tiến độ làm bài</span>
            <span className="text-primary">{completedCount}/{totalCount}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Accordion / List of Exercises */}
      <div className="space-y-3">
        {exercises.map((exercise, index) => {
          const isOpen = openExerciseId === exercise.id;
          const isDone = !!completedExercises[exercise.id];
          const Icon = exerciseTypeIcons[exercise.exercise_type] || HelpCircle;
          const colorClass = exerciseTypeColors[exercise.exercise_type] || 'bg-muted text-muted-foreground';
          const label = exerciseTypeLabels[exercise.exercise_type] || exercise.exercise_type;

          return (
            <Card 
              key={exercise.id} 
              className={`transition-all duration-300 border overflow-hidden ${
                isOpen ? 'border-primary/50 shadow-md ring-1 ring-primary/20' : 'hover:border-primary/30'
              }`}
            >
              {/* Collapsible Header */}
              <div 
                onClick={() => toggleExercise(exercise.id)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer bg-card hover:bg-muted/40 transition-colors select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-foreground truncate">
                        Bài {index + 1}: {exercise.title_vi || exercise.title}
                      </span>
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${colorClass}`}>
                        {label}
                      </Badge>
                      {isDone && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-200 text-[10px] gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" /> Đã hoàn thành
                        </Badge>
                      )}
                    </div>
                    {exercise.instructions_vi && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{exercise.instructions_vi}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-semibold text-primary gap-1">
                    {isOpen ? (
                      <>Thu lại <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>Xổ chi tiết <ChevronDown className="w-4 h-4" /></>
                    )}
                  </Button>
                </div>
              </div>

              {/* Collapsible Content */}
              {isOpen && (
                <div className="p-4 md:p-6 border-t bg-muted/20 space-y-4 animate-fade-in">
                  {exercise.instructions_vi && (
                    <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl text-xs md:text-sm text-foreground">
                      <strong>💡 Hướng dẫn làm bài:</strong> {exercise.instructions_vi}
                    </div>
                  )}

                  {/* Render interactive exercise player according to type */}
                  {renderInteractiveExercise(exercise, (score, max) => handleExerciseComplete(exercise.id, score, max), writingContent, setWritingContent, submittingWriting, () => handleWritingSubmit(exercise))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Helper renderer for interactive runners
function renderInteractiveExercise(
  exercise: Exercise, 
  onDone: (score: number, max: number) => void,
  writingState: Record<string, string>,
  setWritingState: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  submittingState: Record<string, boolean>,
  onWritingSubmit: () => void
) {
  const content = exercise.content || {};
  const type = exercise.exercise_type;

  // 1. Quiz / Multiple Choice
  if (type === 'quiz' || type === 'multiple_choice') {
    const questions = content.questions || (content.question ? [{
      question: content.question,
      options: content.options || [],
      correct: Number(exercise.correct_answers) || 0,
      explanation: exercise.explanation
    }] : []);

    if (questions.length > 0) {
      return (
        <QuizExercise
          questions={questions}
          onComplete={(correctCount) => onDone(correctCount, questions.length)}
        />
      );
    }
  }

  // 2. Vocabulary / Flashcard
  if (type === 'flashcard' || type === 'vocabulary') {
    const items = content.items || [];
    if (items.length > 0) {
      return (
        <FlashcardExercise
          items={items}
          onComplete={(correctCount) => onDone(correctCount, items.length)}
        />
      );
    }
  }

  // 3. Fill in the Blank
  if (type === 'fill_blank' || type === 'fill-blank') {
    const items = content.items || content.sentences || [];
    if (items.length > 0) {
      return (
        <FillBlankExercise
          items={items}
          onComplete={(correctCount) => onDone(correctCount, items.length)}
        />
      );
    }
  }

  // 4. Matching
  if (type === 'matching') {
    const pairs = content.pairs || [];
    if (pairs.length > 0) {
      return (
        <MatchingExercise
          pairs={pairs}
          onComplete={(correctCount) => onDone(correctCount, pairs.length)}
        />
      );
    }
  }

  // 5. Sentence Order
  if (type === 'sentence_order' || type === 'sentence-order') {
    const items = content.items || [];
    if (items.length > 0) {
      return (
        <SentenceOrderExercise
          items={items}
          onComplete={(correctCount) => onDone(correctCount, items.length)}
        />
      );
    }
  }

  // 6. Writing / Essay Exercise
  if (type === 'writing' || type === 'essay') {
    const isSubmitting = submittingState[exercise.id] || false;
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="bg-card p-4 rounded-xl border space-y-3">
          <h4 className="font-bold text-sm text-foreground">✍️ Bài tập viết/tự luận</h4>
          <p className="text-xs text-muted-foreground">
            {content.prompt || content.question || exercise.instructions_vi || 'Hãy hoàn thành đoạn văn hoặc câu hỏi tự luận dưới đây:'}
          </p>
          <Textarea
            rows={5}
            value={writingState[exercise.id] || ''}
            onChange={(e) => setWritingState(prev => ({ ...prev, [exercise.id]: e.target.value }))}
            placeholder="Nhập bài làm tự luận hoặc câu trả lời bằng tiếng Nhật/Việt..."
            className="text-sm"
          />
          <div className="flex justify-end">
            <Button 
              onClick={onWritingSubmit} 
              disabled={isSubmitting} 
              className="gap-2 font-bold"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Nộp bài tự luận
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback if data structure is generic
  return (
    <div className="bg-card p-6 rounded-xl border text-center space-y-3">
      <p className="font-semibold text-sm">Nội dung bài tập: {exercise.title_vi}</p>
      {content.prompt && <p className="text-xs text-muted-foreground">{content.prompt}</p>}
      <Button onClick={() => onDone(1, 1)} variant="hero" size="sm" className="gap-1.5 font-bold">
        <CheckCircle2 className="w-4 h-4" /> Đánh dấu hoàn thành (+20 XP)
      </Button>
    </div>
  );
}

export default InlineLessonExercises;

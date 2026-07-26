import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, ArrowRight, Play, Eye, EyeOff,
  CheckCircle2, RefreshCw, X 
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  title_vi: string;
  description_vi: string | null;
  skill: string;
  level: string;
  content_html: string | null;
}

interface Exercise {
  id: string;
  title: string;
  title_vi: string;
  exercise_type: string;
  instructions_vi: string | null;
  correct_answers: any;
  content: any;
}

interface ClassLessonPresentationProps {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClassLessonPresentation = ({ lesson, isOpen, onClose }: ClassLessonPresentationProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (lesson && isOpen) {
      fetchExercises(lesson.id);
      setCurrentSlide(0);
      setShowAnswer(false);
    }
  }, [lesson, isOpen]);

  const fetchExercises = async (lessonId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('lesson_id', lessonId);

      if (error) throw error;
      setExercises(data || []);
    } catch (err) {
      console.error('Error fetching presentation exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!lesson) return null;

  // Slides:
  // Slide 0: Cover / Intro
  // Slide 1: Content html
  // Slide 2 to (2 + exercises.length - 1): Exercises
  const totalSlides = 2 + exercises.length;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
      setShowAnswer(false);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      setShowAnswer(false);
    }
  };

  const getExerciseTypeName = (type: string) => {
    const types: Record<string, string> = {
      'essay': 'Tự luận / Viết luận',
      'fill-blank': 'Điền vào chỗ trống',
      'matching': 'Nối đáp án',
      'speaking': 'Luyện nói',
      'quiz': 'Trắc nghiệm',
      'sentence-order': 'Sắp xếp câu'
    };
    return types[type] || type;
  };

  const renderExerciseSlide = (exercise: Exercise, index: number) => {
    const options = exercise.content?.options || [];
    
    return (
      <div className="space-y-6 animate-fade-in flex flex-col justify-between h-full">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="hero" className="text-sm px-3 py-1">
              Bài tập {index + 1}: {getExerciseTypeName(exercise.exercise_type)}
            </Badge>
            <h3 className="text-2xl font-bold text-foreground">{exercise.title_vi || exercise.title}</h3>
          </div>
          
          {exercise.instructions_vi && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-lg">
                <strong>Yêu cầu:</strong> {exercise.instructions_vi}
              </CardContent>
            </Card>
          )}

          {/* Exercise content (options, etc.) */}
          {exercise.exercise_type === 'quiz' && options.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {options.map((opt: string, oIdx: number) => (
                <div 
                  key={oIdx}
                  className={`p-5 rounded-2xl border-2 text-xl font-medium flex items-center gap-4 transition-all ${
                    showAnswer && Number(exercise.correct_answers) === oIdx
                      ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400'
                      : 'border-border bg-card'
                  }`}
                >
                  <span className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-lg">
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  {opt}
                </div>
              ))}
            </div>
          )}

          {exercise.exercise_type !== 'quiz' && (
            <div className="p-6 rounded-2xl bg-muted/30 border text-xl min-h-[120px] flex items-center justify-center">
              Hãy đặt câu hỏi/yêu cầu học viên tương tác trực tiếp
            </div>
          )}
        </div>

        {/* Answer section */}
        <div className="pt-6 border-t mt-auto space-y-4">
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              className="gap-2 text-lg py-6 px-6"
              onClick={() => setShowAnswer(prev => !prev)}
            >
              {showAnswer ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              {showAnswer ? 'Ẩn đáp án' : 'Hiện đáp án tham khảo'}
            </Button>
          </div>

          {showAnswer && (
            <div className="p-5 rounded-2xl bg-green-500/10 border-2 border-green-500/20 text-lg text-green-800 dark:text-green-400 animate-slide-up flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
              <div>
                <strong>Đáp án đúng: </strong>
                {exercise.exercise_type === 'quiz'
                  ? `${String.fromCharCode(65 + Number(exercise.correct_answers))}. ${options[Number(exercise.correct_answers)] || exercise.correct_answers}`
                  : (typeof exercise.correct_answers === 'string' 
                     ? exercise.correct_answers 
                     : JSON.stringify(exercise.correct_answers))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-2 shadow-2xl rounded-3xl">
        <DialogHeader className="px-6 py-4 border-b bg-muted/40 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">
              📺
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Chế độ trình chiếu bài giảng
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Phù hợp để trình chiếu màn hình, máy chiếu hoặc Zoom
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Đang tải học liệu...</p>
          </div>
        ) : (
          <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-card/50">
            {/* Slide 0: Cover */}
            {currentSlide === 0 && (
              <div className="h-full flex flex-col justify-center items-center text-center space-y-6 max-w-3xl mx-auto animate-fade-in">
                <Badge variant="outline" className="px-4 py-1.5 text-sm uppercase tracking-wider font-bold">
                  {lesson.level} • {lesson.skill.toUpperCase()}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
                  {lesson.title_vi}
                </h1>
                <h2 className="text-2xl text-muted-foreground font-medium">
                  {lesson.title}
                </h2>
                <div className="h-1.5 w-24 bg-primary rounded-full" />
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {lesson.description_vi || 'Bài học trực quan giúp nâng cao trình độ tiếng Nhật nhanh chóng.'}
                </p>
                <Button size="lg" onClick={handleNext} className="gap-2 text-lg py-6 px-8 rounded-full shadow-lg hover:shadow-xl transition-all">
                  <Play className="w-5 h-5 fill-current" /> Bắt đầu bài giảng
                </Button>
              </div>
            )}

            {/* Slide 1: Content HTML */}
            {currentSlide === 1 && (
              <div className="space-y-6 animate-fade-in h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <h2 className="text-3xl font-extrabold text-primary border-b pb-3">{lesson.title_vi}</h2>
                  {lesson.content_html ? (
                    <div 
                      className="prose prose-lg md:prose-xl dark:prose-invert max-w-none text-foreground leading-loose py-4 font-normal"
                      dangerouslySetInnerHTML={{ __html: lesson.content_html }}
                    />
                  ) : (
                    <div className="text-center py-16 text-muted-foreground text-xl">
                      Chưa có nội dung lý thuyết chi tiết cho bài giảng này.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Slide 2 to N: Exercises */}
            {currentSlide >= 2 && renderExerciseSlide(exercises[currentSlide - 2], currentSlide - 2)}
          </div>
        )}

        {/* Footer controls */}
        <div className="px-6 py-4 border-t bg-muted/40 flex justify-between items-center">
          <span className="text-sm font-bold text-muted-foreground">
            Slide {currentSlide + 1} / {totalSlides}
          </span>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handlePrev} 
              disabled={currentSlide === 0}
              className="gap-2 font-bold px-5 py-5 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" /> Trang trước
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={currentSlide === totalSlides - 1}
              className="gap-2 font-bold px-5 py-5 rounded-full"
            >
              Trang sau <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, ArrowRight, Play, Eye, EyeOff,
  CheckCircle2, RefreshCw, X, ExternalLink, FileText, BookOpen, Presentation, Sparkles
} from 'lucide-react';
import PdfPresenter from './PdfPresenter';

interface Lesson {
  id: string;
  title: string;
  title_vi: string;
  description_vi?: string | null;
  skill: string;
  level: string;
  content_html?: string | null;
  document_url?: string | null;
  slide_url?: string | null;
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
  const [useGoogleEmbed, setUseGoogleEmbed] = useState(false);
  const [pdfPresenterOpen, setPdfPresenterOpen] = useState(false);

  useEffect(() => {
    if (lesson && isOpen) {
      fetchExercises(lesson.id);
      setCurrentSlide(0);
      setShowAnswer(false);
      setUseGoogleEmbed(false);
    }
  }, [lesson, isOpen]);

  const fetchExercises = async (lessonId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('id, title, title_vi, exercise_type, instructions_vi, content, audio_url, requires_grading, order_index, lesson_id')
        .eq('lesson_id', lessonId);

      if (error) throw error;
      setExercises((data || []) as any);
    } catch (err) {
      console.error('Error fetching presentation exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!lesson) return null;

  // Helper url extractors
  const pdfUrl = lesson.document_url || (lesson.content_html?.match(/(https?:[^\s<"']+\.pdf[^\s<"']*)/i)?.[1]) || null;
  const slideUrl = lesson.slide_url || (lesson.content_html?.match(/(https?:\/\/(?:docs\.google\.com|canva\.com)[^\s<"']+)/i)?.[1]) || null;

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
      <DialogContent showCloseButton={false} className="max-w-7xl w-[98vw] h-[95vh] flex flex-col p-0 overflow-hidden bg-background border-2 shadow-2xl rounded-3xl">
        <DialogHeader className="px-6 py-3 border-b bg-muted/40 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">
              📺
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Chế độ Trình chiếu bài giảng Website
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {lesson.title_vi}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(pdfUrl || slideUrl) && (
              <Button size="sm" variant="outline" asChild className="gap-1.5 text-xs font-bold border-primary/30 text-primary hover:bg-primary/10">
                <a href={pdfUrl || slideUrl!} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" /> Mở link gốc (Backup)
                </a>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Đang tải học liệu...</p>
          </div>
        ) : (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-card/50 flex flex-col">
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

                {/* Direct PDF / Slide Preview Banner */}
                {(pdfUrl || slideUrl) && (
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl w-full flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      <FileText className="w-7 h-7 text-primary shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-foreground">Tài liệu / Slide đính kèm bài giảng</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{pdfUrl || slideUrl}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={handleNext} className="shrink-0 font-bold gap-1.5 shadow-md">
                      Trình chiếu PDF / Slide ngay
                    </Button>
                  </div>
                )}

                <Button size="lg" onClick={handleNext} className="gap-2 text-lg py-6 px-8 rounded-full shadow-lg hover:shadow-xl transition-all">
                  <Play className="w-5 h-5 fill-current" /> Bắt đầu bài giảng
                </Button>
              </div>
            )}

            {/* Slide 1: In-Browser Live PDF & Slide Presentation */}
            {currentSlide === 1 && (
              <div className="space-y-4 animate-fade-in flex-1 flex flex-col">
                {/* Top Control Bar */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/60 border text-xs shrink-0 flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>Trình chiếu tài liệu trực tiếp trên Website</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {pdfUrl && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs font-bold gap-1 bg-red-600 hover:bg-red-700 text-white shadow-xs"
                        onClick={() => setPdfPresenterOpen(true)}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Chế độ Presenter (Laser & Đồng hồ)
                      </Button>
                    )}
                    {pdfUrl && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => setUseGoogleEmbed(prev => !prev)}>
                        {useGoogleEmbed ? 'Chuyển Native PDF' : 'Chuyển Google Viewer'}
                      </Button>
                    )}
                    {(pdfUrl || slideUrl) && (
                      <Button size="sm" variant="outline" asChild className="h-7 text-xs font-bold gap-1 border-primary/30 text-primary">
                        <a href={pdfUrl || slideUrl!} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" /> Link gốc Backup
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* PDF or Slide Embedder */}
                {pdfUrl ? (
                  <div className="flex-1 w-full min-h-[500px] rounded-2xl overflow-hidden border shadow-inner bg-card relative">
                    <iframe
                      src={useGoogleEmbed ? `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true` : pdfUrl}
                      className="w-full h-full min-h-[550px]"
                      title="Trình chiếu tài liệu PDF"
                    />
                  </div>
                ) : slideUrl ? (
                  <div className="flex-1 w-full min-h-[500px] rounded-2xl overflow-hidden border shadow-inner bg-card">
                    <iframe
                      src={slideUrl}
                      className="w-full h-full min-h-[550px]"
                      title="Trình chiếu Slide"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="flex-1 space-y-4">
                    <h2 className="text-2xl font-extrabold text-primary border-b pb-3">{lesson.title_vi}</h2>
                    {lesson.content_html ? (
                      <div 
                        className="prose prose-lg dark:prose-invert max-w-none text-foreground leading-relaxed p-4 bg-card rounded-2xl border"
                        dangerouslySetInnerHTML={{ __html: lesson.content_html }}
                      />
                    ) : (
                      <div className="text-center py-16 text-muted-foreground text-xl">
                        Chưa có nội dung lý thuyết chi tiết cho bài giảng này.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Slide 2 to N: Exercises */}
            {currentSlide >= 2 && renderExerciseSlide(exercises[currentSlide - 2], currentSlide - 2)}
          </div>
        )}

        {/* Footer controls */}
        <div className="px-6 py-3 border-t bg-muted/40 flex justify-between items-center shrink-0">
          <span className="text-sm font-bold text-muted-foreground">
            Slide {currentSlide + 1} / {totalSlides}
          </span>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handlePrev} 
              disabled={currentSlide === 0}
              className="gap-2 font-bold px-5 py-4 rounded-full text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Trang trước
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={currentSlide === totalSlides - 1}
              className="gap-2 font-bold px-5 py-4 rounded-full text-sm"
            >
              Trang sau <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {pdfUrl && (
          <PdfPresenter
            open={pdfPresenterOpen}
            onOpenChange={setPdfPresenterOpen}
            url={pdfUrl}
            title={lesson.title_vi || lesson.title}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

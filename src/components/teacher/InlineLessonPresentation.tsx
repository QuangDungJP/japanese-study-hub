import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, ArrowRight, Play, Eye, EyeOff,
  CheckCircle2, RefreshCw, X, ExternalLink, BookOpen, FileText, ChevronUp
} from 'lucide-react';

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

interface InlineLessonPresentationProps {
  lesson: Lesson;
  onClose: () => void;
}

export const InlineLessonPresentation = ({ lesson, onClose }: InlineLessonPresentationProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [useGoogleEmbed, setUseGoogleEmbed] = useState(false);

  useEffect(() => {
    fetchExercises(lesson.id);
    setCurrentSlide(0);
    setShowAnswer(false);
  }, [lesson.id]);

  const fetchExercises = async (lessonId: string) => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('lesson_id', lessonId);
      setExercises(data || []);
    } catch (err) {
      console.error('Error fetching exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  // Detect PDF / slide URL from lesson fields or embedded links
  const pdfUrl = (lesson as any).document_url || 
    (lesson.content_html?.match(/(https?:[^\s<"']+\.pdf[^\s<"']*)/i)?.[1]) || null;
  const slideUrl = (lesson as any).slide_url || 
    (lesson.content_html?.match(/(https?:\/\/(?:docs\.google\.com|canva\.com)[^\s<"']+)/i)?.[1]) || null;

  const totalSlides = 2 + exercises.length;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(p => p + 1);
      setShowAnswer(false);
    }
  };
  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(p => p - 1);
      setShowAnswer(false);
    }
  };

  const getExerciseTypeName = (type: string) => {
    const t: Record<string, string> = {
      essay: 'Tự luận', 'fill-blank': 'Điền từ', matching: 'Nối đáp án',
      speaking: 'Luyện nói', quiz: 'Trắc nghiệm', 'sentence-order': 'Sắp xếp câu',
    };
    return t[type] || type;
  };

  const renderExerciseSlide = (exercise: Exercise, index: number) => {
    const options = exercise.content?.options || [];
    return (
      <div className="space-y-4 flex flex-col h-full">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-primary/10 text-primary text-xs">
            Bài tập {index + 1}: {getExerciseTypeName(exercise.exercise_type)}
          </Badge>
          <h3 className="text-xl font-bold text-foreground">{exercise.title_vi || exercise.title}</h3>
        </div>
        {exercise.instructions_vi && (
          <Card className="bg-primary/5 border-primary/20 shrink-0">
            <CardContent className="p-3 text-sm">
              <strong>Yêu cầu:</strong> {exercise.instructions_vi}
            </CardContent>
          </Card>
        )}
        {exercise.exercise_type === 'quiz' && options.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((opt: string, oIdx: number) => (
              <div
                key={oIdx}
                className={`p-4 rounded-xl border-2 font-medium flex items-center gap-3 transition-all ${
                  showAnswer && Number(exercise.correct_answers) === oIdx
                    ? 'border-green-500 bg-green-500/10 text-green-700'
                    : 'border-border bg-card'
                }`}
              >
                <span className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0">
                  {String.fromCharCode(65 + oIdx)}
                </span>
                {opt}
              </div>
            ))}
          </div>
        )}
        {exercise.exercise_type !== 'quiz' && (
          <div className="p-5 rounded-xl bg-muted/30 border text-base min-h-[100px] flex items-center justify-center text-muted-foreground">
            Yêu cầu học viên tương tác trực tiếp với giáo viên
          </div>
        )}

        <div className="pt-3 border-t mt-auto">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowAnswer(p => !p)}
          >
            {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAnswer ? 'Ẩn đáp án' : 'Hiện đáp án'}
          </Button>
          {showAnswer && (
            <div className="mt-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-800 dark:text-green-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <strong>Đáp án: </strong>
                {exercise.exercise_type === 'quiz'
                  ? `${String.fromCharCode(65 + Number(exercise.correct_answers))}. ${options[Number(exercise.correct_answers)] || ''}`
                  : (typeof exercise.correct_answers === 'string' ? exercise.correct_answers : JSON.stringify(exercise.correct_answers))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-b-2xl border border-t-0 border-primary/40 bg-card shadow-inner overflow-hidden">
      {/* Header bar */}
      <div className="px-4 py-2.5 border-b bg-primary/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="text-base">📺</span>
          <span>Trình chiếu: <span className="text-primary">{lesson.title_vi}</span></span>
          <Badge variant="outline" className="text-xs">{currentSlide + 1} / {totalSlides}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {(pdfUrl || slideUrl) && (
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground" asChild>
              <a href={pdfUrl || slideUrl!} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" /> Mở link gốc
              </a>
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={onClose}>
            <ChevronUp className="w-4 h-4" /> Thu lại
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="p-5 min-h-[380px] max-h-[70vh] overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <RefreshCw className="w-7 h-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          </div>
        ) : (
          <>
            {/* Slide 0: Cover */}
            {currentSlide === 0 && (
              <div className="flex flex-col items-center text-center py-8 gap-4 max-w-2xl mx-auto">
                <Badge variant="outline" className="uppercase tracking-wider text-xs font-bold">
                  {lesson.level} • {lesson.skill.toUpperCase()}
                </Badge>
                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">{lesson.title_vi}</h2>
                <p className="text-sm text-muted-foreground">{lesson.title}</p>
                {lesson.description_vi && (
                  <p className="text-sm text-muted-foreground max-w-lg">{lesson.description_vi}</p>
                )}
                {(pdfUrl || slideUrl) && (
                  <div className="w-full bg-primary/5 border border-primary/20 p-3 rounded-xl flex items-center justify-between text-left">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-foreground">Tài liệu / Slide đính kèm</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{pdfUrl || slideUrl}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={handleNext} className="shrink-0 gap-1 text-xs font-bold">
                      <Play className="w-3 h-3 fill-current" /> Mở slide
                    </Button>
                  </div>
                )}
                <Button onClick={handleNext} className="gap-2 rounded-full px-6">
                  <Play className="w-4 h-4 fill-current" /> Bắt đầu bài giảng
                </Button>
              </div>
            )}

            {/* Slide 1: PDF / Slide / Content */}
            {currentSlide === 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>Nội dung bài giảng</span>
                  </div>
                  {pdfUrl && (
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setUseGoogleEmbed(p => !p)}>
                      {useGoogleEmbed ? 'Native PDF' : 'Google Viewer'}
                    </Button>
                  )}
                </div>

                {pdfUrl ? (
                  <div className="w-full rounded-xl overflow-hidden border shadow-sm bg-card">
                    <iframe
                      src={useGoogleEmbed
                        ? `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`
                        : pdfUrl}
                      className="w-full"
                      style={{ height: 'min(65vh, 600px)' }}
                      title="Trình chiếu PDF"
                    />
                  </div>
                ) : slideUrl ? (
                  <div className="w-full rounded-xl overflow-hidden border shadow-sm bg-card">
                    <iframe
                      src={slideUrl}
                      className="w-full"
                      style={{ height: 'min(65vh, 600px)' }}
                      title="Trình chiếu Slide"
                      allowFullScreen
                    />
                  </div>
                ) : lesson.content_html ? (
                  <div
                    className="prose prose-sm md:prose-base dark:prose-invert max-w-none p-4 bg-card rounded-xl border"
                    dangerouslySetInnerHTML={{ __html: lesson.content_html }}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    Bài học chưa có nội dung hoặc file đính kèm.
                  </div>
                )}
              </div>
            )}

            {/* Slide 2+: Exercises */}
            {currentSlide >= 2 && renderExerciseSlide(exercises[currentSlide - 2], currentSlide - 2)}
          </>
        )}
      </div>

      {/* Navigation footer */}
      <div className="px-4 py-2.5 border-t bg-muted/30 flex justify-between items-center">
        <div className="flex gap-2">
          {Array.from({ length: totalSlides }, (_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentSlide(i); setShowAnswer(false); }}
              className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-primary w-5' : 'bg-border hover:bg-muted-foreground'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="gap-1.5 h-8 text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Trước
          </Button>
          <Button
            size="sm"
            onClick={handleNext}
            disabled={currentSlide === totalSlides - 1}
            className="gap-1.5 h-8 text-xs font-bold"
          >
            Tiếp <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

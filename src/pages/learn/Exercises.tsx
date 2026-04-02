import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell, Check, Trophy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearning } from '@/contexts/LearningContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import FlashcardExercise from '@/components/exercises/FlashcardExercise';
import FillBlankExercise from '@/components/exercises/FillBlankExercise';
import MatchingExercise from '@/components/exercises/MatchingExercise';
import SentenceOrderExercise from '@/components/exercises/SentenceOrderExercise';
import QuizExercise from '@/components/exercises/QuizExercise';

interface Exercise {
  id: string;
  title: string;
  title_vi: string;
  exercise_type: string;
  content: any;
  correct_answers: any;
  instructions: string | null;
  instructions_vi: string | null;
  order_index: number;
}

const Exercises = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lessonId = searchParams.get('lesson');
  
  const { addXp, currentLanguage } = useLearning();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lessonTitle, setLessonTitle] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);

  useEffect(() => {
    const fetchExercises = async () => {
      if (!lessonId) {
        setLoading(false);
        return;
      }

      // Fetch lesson info
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('title, title_vi')
        .eq('id', lessonId)
        .single();

      if (lessonData) {
        setLessonTitle(lessonData.title_vi || lessonData.title);
      }

      // Fetch exercises
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });

      if (data) {
        setExercises(data);
      }
      setLoading(false);
    };

    fetchExercises();
  }, [lessonId]);

  const currentExercise = exercises[currentExerciseIndex];

  const handleExerciseComplete = (score: number) => {
    const exerciseMaxScore = getMaxScore(currentExercise);
    setTotalScore(prev => prev + score);
    setMaxScore(prev => prev + exerciseMaxScore);

    if (currentExerciseIndex < exercises.length - 1) {
      // Move to next exercise
      setTimeout(() => {
        setCurrentExerciseIndex(prev => prev + 1);
      }, 500);
    } else {
      // All exercises completed
      const finalTotalScore = totalScore + score;
      const finalMaxScore = maxScore + exerciseMaxScore;
      const xpEarned = Math.round((finalTotalScore / finalMaxScore) * 50);
      
      addXp(xpEarned);
      setIsCompleted(true);
      
      toast({
        title: `Hoàn thành bài tập! +${xpEarned} XP`,
        description: `Bạn đạt ${finalTotalScore}/${finalMaxScore} điểm`,
      });
    }
  };

  const getMaxScore = (exercise: Exercise) => {
    switch (exercise.exercise_type) {
      case 'flashcard':
        return exercise.content?.items?.length || 0;
      case 'fill_blank':
        return exercise.content?.items?.length || 0;
      case 'matching':
        return exercise.content?.pairs?.length || 0;
      case 'sentence_order':
        return exercise.content?.items?.length || 0;
      case 'multiple_choice':
        return exercise.content?.questions?.length || 0;
      default:
        return 1;
    }
  };

  const renderExercise = () => {
    if (!currentExercise) return null;

    const { exercise_type, content } = currentExercise;

    switch (exercise_type) {
      case 'flashcard':
        return (
          <FlashcardExercise
            items={content?.items || []}
            onComplete={handleExerciseComplete}
          />
        );
      case 'fill_blank':
        return (
          <FillBlankExercise
            items={content?.items || []}
            onComplete={handleExerciseComplete}
          />
        );
      case 'matching':
        return (
          <MatchingExercise
            pairs={content?.pairs || []}
            onComplete={handleExerciseComplete}
          />
        );
      case 'sentence_order':
        return (
          <SentenceOrderExercise
            items={content?.items || []}
            onComplete={handleExerciseComplete}
          />
        );
      case 'multiple_choice':
        return (
          <QuizExercise
            questions={content?.questions || []}
            onComplete={handleExerciseComplete}
          />
        );
      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Loại bài tập này chưa được hỗ trợ: {exercise_type}
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lessonId) {
    return (
      <div className="text-center py-16">
        <Dumbbell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Chọn bài học</h2>
        <p className="text-muted-foreground mb-6">
          Vui lòng chọn một bài học để làm bài tập
        </p>
        <Button onClick={() => navigate('/learn')}>
          Quay lại Dashboard
        </Button>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-16">
        <Dumbbell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Chưa có bài tập</h2>
        <p className="text-muted-foreground mb-6">
          Bài học này chưa có bài tập nào
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  if (isCompleted) {
    const percentage = Math.round((totalScore / maxScore) * 100);
    const stars = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 50 ? 1 : 0;

    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="bg-gradient-to-br from-primary/10 via-card to-accent/10 rounded-3xl border border-border p-8 animate-scale-in">
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6 animate-float" />
          
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Hoàn thành xuất sắc!
          </h1>
          <p className="text-muted-foreground mb-6">{lessonTitle}</p>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((star) => (
              <Star
                key={star}
                className={`w-12 h-12 transition-all duration-500 ${
                  star <= stars
                    ? 'text-yellow-500 fill-yellow-500 animate-scale-in'
                    : 'text-muted-foreground/30'
                }`}
                style={{ animationDelay: `${star * 200}ms` }}
              />
            ))}
          </div>

          {/* Score */}
          <div className="bg-muted/50 rounded-2xl p-6 mb-6">
            <div className="text-5xl font-bold text-primary mb-2">
              {percentage}%
            </div>
            <p className="text-muted-foreground">
              {totalScore}/{maxScore} câu đúng
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              Quay lại
            </Button>
            <Button
              variant="hero"
              size="lg"
              onClick={() => {
                setCurrentExerciseIndex(0);
                setTotalScore(0);
                setMaxScore(0);
                setIsCompleted(false);
              }}
              className="rounded-full"
            >
              Làm lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{lessonTitle}</h1>
            <p className="text-sm text-muted-foreground">
              Bài tập {currentExerciseIndex + 1}/{exercises.length}
            </p>
          </div>
        </div>

        {/* Exercise progress */}
        <div className="flex gap-1">
          {exercises.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${
                index < currentExerciseIndex
                  ? 'bg-green-500'
                  : index === currentExerciseIndex
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Exercise title & instructions */}
      {currentExercise && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-2">
            {currentExercise.title_vi || currentExercise.title}
          </h2>
          {currentExercise.instructions_vi && (
            <p className="text-muted-foreground">
              {currentExercise.instructions_vi}
            </p>
          )}
        </div>
      )}

      {/* Exercise content */}
      <div className="bg-card rounded-3xl border border-border p-6 md:p-8">
        {renderExercise()}
      </div>
    </div>
  );
};

export default Exercises;

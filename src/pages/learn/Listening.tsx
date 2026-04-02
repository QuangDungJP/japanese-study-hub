import { useState, useEffect } from 'react';
import { Headphones, Play, Pause, RotateCcw, Check, Clock, Zap, Volume2, ChevronRight } from 'lucide-react';
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
    audio_url?: string;
    transcript?: string;
    questions?: Array<{
      question: string;
      options: string[];
      correct: number;
    }>;
  } | null;
}

const Listening = () => {
  const { addXp, currentLanguage, completedLessons } = useLearning();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const fetchLessons = async () => {
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('skill', 'listening')
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

  const handleAnswer = (questionIndex: number, optionIndex: number) => {
    if (!showResults) {
      setSelectedAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
    }
  };

  const handleSubmit = () => {
    if (!activeLesson?.content?.questions) return;
    
    setShowResults(true);
    const correct = activeLesson.content.questions.filter(
      (q, i) => selectedAnswers[i] === q.correct
    ).length;
    const xpEarned = correct * 15;
    addXp(xpEarned);
    toast({
      title: `Chúc mừng! +${xpEarned} XP`,
      description: `Bạn trả lời đúng ${correct}/${activeLesson.content.questions.length} câu hỏi`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-orange-500" />
          </div>
          Kỹ năng Nghe
        </h1>
        <p className="text-muted-foreground mt-1">Luyện nghe với audio chất lượng cao</p>
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
            <Headphones className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
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
            setCurrentTime(0);
            setIsPlaying(false);
          }}>
            ← Quay lại danh sách
          </Button>

          {/* Exercise Card */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Exercise Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{activeLesson.title}</h2>
                  <p className="text-muted-foreground">{activeLesson.title_vi}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 font-medium">
                    {activeLesson.level}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {activeLesson.duration_minutes || 15} phút
                  </span>
                </div>
              </div>
            </div>

            {/* Audio Player */}
            <div className="p-6 bg-muted/30">
              <div className="flex flex-col items-center gap-4">
                {/* Waveform Visualization (Simulated) */}
                <div className="w-full h-20 bg-card rounded-xl p-4 flex items-center justify-center gap-1">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-200 ${isPlaying ? 'bg-orange-500' : 'bg-muted-foreground/30'}`}
                      style={{
                        height: `${Math.random() * 60 + 20}%`,
                        animationDelay: `${i * 50}ms`
                      }}
                    />
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="w-full space-y-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden cursor-pointer">
                    <div 
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${(currentTime / ((activeLesson.duration_minutes || 1) * 60)) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime((activeLesson.duration_minutes || 1) * 60)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentTime(0)}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-16 h-16 rounded-full"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                  </Button>

                  {/* Speed Control */}
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="bg-muted rounded-lg px-2 py-1 text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1}>1x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                    </select>
                  </div>
                </div>

                {/* Transcript Toggle */}
                {activeLesson.content?.transcript && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTranscript(!showTranscript)}
                  >
                    {showTranscript ? 'Ẩn transcript' : 'Xem transcript'}
                  </Button>
                )}
              </div>

              {/* Transcript */}
              {showTranscript && activeLesson.content?.transcript && (
                <div className="mt-4 p-4 bg-card rounded-xl border border-border">
                  <h4 className="font-semibold text-foreground mb-2">Transcript:</h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {activeLesson.content.transcript}
                  </div>
                </div>
              )}
            </div>

            {/* Questions */}
            {activeLesson.content?.questions && activeLesson.content.questions.length > 0 && (
              <div className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Câu hỏi</h3>
                <div className="space-y-6">
                  {activeLesson.content.questions.map((q, qIndex) => (
                    <div key={qIndex} className="space-y-3">
                      <p className="font-medium text-foreground">
                        {qIndex + 1}. {q.question}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {q.options.map((option, oIndex) => {
                          const isSelected = selectedAnswers[qIndex] === oIndex;
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
                              onClick={() => handleAnswer(qIndex, oIndex)}
                              className={buttonClass}
                              disabled={showResults}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full border flex items-center justify-center text-sm font-medium">
                                  {String.fromCharCode(65 + oIndex)}
                                </span>
                                {option}
                                {showResults && isCorrect && <Check className="w-5 h-5 ml-auto text-green-500" />}
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
                    <Zap className="w-5 h-5" />
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
                      setCurrentTime(0);
                    }}
                  >
                    Hoàn thành bài học
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Listening;

import { useState, useEffect } from 'react';
import { Mic, MicOff, Play, Volume2, RotateCcw, Check, Star, MessageCircle, Clock, Zap, ChevronRight } from 'lucide-react';
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
    phrases?: Array<{
      english: string;
      vietnamese: string;
      phonetic: string;
    }>;
    dialogues?: Array<{
      role: string;
      text: string;
      textVi: string;
      isUser?: boolean;
    }>;
  } | null;
}

const Speaking = () => {
  const { addXp, currentLanguage, completedLessons } = useLearning();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [completedPhrases, setCompletedPhrases] = useState<number[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [mode, setMode] = useState<'phrases' | 'dialogue'>('phrases');
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);

  useEffect(() => {
    const fetchLessons = async () => {
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('skill', 'speaking')
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

  const currentPhrase = activeLesson?.content?.phrases?.[currentPhraseIndex];
  const dialogues = activeLesson?.content?.dialogues || [];

  const handleRecord = () => {
    setIsRecording(!isRecording);
    
    if (isRecording && currentPhrase) {
      // Simulate scoring after recording
      setTimeout(() => {
        const score = Math.floor(Math.random() * 30) + 70; // 70-100
        setScores(prev => ({ ...prev, [currentPhraseIndex]: score }));
        
        if (score >= 80 && !completedPhrases.includes(currentPhraseIndex)) {
          setCompletedPhrases(prev => [...prev, currentPhraseIndex]);
          addXp(10);
          toast({
            title: `Xuất sắc! +10 XP`,
            description: `Điểm phát âm: ${score}/100`,
          });
        } else {
          toast({
            title: `Điểm: ${score}/100`,
            description: score >= 80 ? 'Rất tốt!' : 'Hãy thử lại nhé!',
          });
        }
      }, 1500);
    }
  };

  const handleNext = () => {
    const phrases = activeLesson?.content?.phrases || [];
    if (currentPhraseIndex < phrases.length - 1) {
      setCurrentPhraseIndex(prev => prev + 1);
    } else {
      setCurrentPhraseIndex(0);
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
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Mic className="w-5 h-5 text-green-500" />
            </div>
            Kỹ năng Nói
          </h1>
          <p className="text-muted-foreground mt-1">Luyện phát âm với AI và giáo viên</p>
        </div>

        {activeLesson && (
          <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/50">
            <button
              onClick={() => setMode('phrases')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'phrases' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Volume2 className="w-4 h-4 inline-block mr-2" />
              Luyện câu
            </button>
            <button
              onClick={() => setMode('dialogue')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'dialogue' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageCircle className="w-4 h-4 inline-block mr-2" />
              Hội thoại
            </button>
          </div>
        )}
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
                    setCurrentPhraseIndex(0);
                    setCompletedPhrases([]);
                    setScores({});
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
            <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
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

          {mode === 'phrases' && currentPhrase ? (
            <>
              {/* Progress */}
              <div className="flex items-center gap-2">
                {activeLesson.content?.phrases?.map((_, index) => (
                  <div
                    key={index}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      completedPhrases.includes(index) 
                        ? 'bg-green-500' 
                        : index === currentPhraseIndex 
                          ? 'bg-primary' 
                          : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              {/* Main Card */}
              <div className="bg-card rounded-2xl border border-border p-8">
                <div className="text-center mb-8">
                  <h2 className="text-sm text-muted-foreground mb-2">Hãy nói câu này:</h2>
                  <p className="text-3xl font-bold text-foreground mb-2">{currentPhrase.english}</p>
                  <p className="text-lg text-muted-foreground mb-1">{currentPhrase.vietnamese}</p>
                  <p className="text-sm text-primary">{currentPhrase.phonetic}</p>
                </div>

                {/* Listen Button */}
                <div className="flex justify-center mb-8">
                  <Button variant="outline" size="lg" className="gap-2">
                    <Play className="w-5 h-5" />
                    Nghe mẫu
                  </Button>
                </div>

                {/* Recording Area */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={handleRecord}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecording 
                        ? 'bg-red-500 scale-110 animate-pulse' 
                        : 'bg-gradient-primary hover:scale-105'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-10 h-10 text-white" />
                    ) : (
                      <Mic className="w-10 h-10 text-white" />
                    )}
                  </button>
                  <p className="text-sm text-muted-foreground mt-4">
                    {isRecording ? 'Đang ghi âm... Nhấn để dừng' : 'Nhấn để ghi âm'}
                  </p>
                </div>

                {/* Score Display */}
                {scores[currentPhraseIndex] && (
                  <div className="mt-8 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-8 h-8 ${
                            scores[currentPhraseIndex] >= star * 20
                              ? 'text-accent fill-accent'
                              : 'text-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-2xl font-bold text-foreground">{scores[currentPhraseIndex]}/100</p>
                    <p className="text-sm text-muted-foreground">
                      {scores[currentPhraseIndex] >= 90 ? 'Xuất sắc!' :
                       scores[currentPhraseIndex] >= 80 ? 'Rất tốt!' :
                       scores[currentPhraseIndex] >= 70 ? 'Khá tốt!' : 'Cần cải thiện'}
                    </p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setScores(prev => {
                        const newScores = { ...prev };
                        delete newScores[currentPhraseIndex];
                        return newScores;
                      });
                    }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Thử lại
                  </Button>
                  <Button variant="default" onClick={handleNext}>
                    Câu tiếp theo
                  </Button>
                </div>
              </div>
            </>
          ) : mode === 'dialogue' && dialogues.length > 0 ? (
            /* Dialogue Mode */
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">{activeLesson.title}</h2>
              
              <div className="space-y-4 mb-6">
                {dialogues.map((line, index) => (
                  <div
                    key={index}
                    className={`flex ${line.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${line.isUser ? 'order-1' : ''}`}>
                      <div
                        className={`p-4 rounded-2xl ${
                          line.isUser
                            ? currentDialogueIndex === index
                              ? 'bg-green-500 text-white'
                              : 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        } ${currentDialogueIndex === index && line.isUser ? 'ring-2 ring-green-300' : ''}`}
                      >
                        <p className="font-medium">{line.text}</p>
                        <p className={`text-sm mt-1 ${line.isUser ? 'opacity-80' : 'text-muted-foreground'}`}>
                          {line.textVi}
                        </p>
                      </div>
                      {line.isUser && currentDialogueIndex === index && (
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <Button variant="outline" size="sm">
                            <Play className="w-4 h-4 mr-1" />
                            Nghe
                          </Button>
                          <Button 
                            variant={isRecording ? 'destructive' : 'default'} 
                            size="sm"
                            onClick={handleRecord}
                          >
                            {isRecording ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                            {isRecording ? 'Dừng' : 'Nói'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentDialogueIndex(0)}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Bắt đầu lại
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    const nextUserIndex = dialogues.findIndex((d, i) => i > currentDialogueIndex && d.isUser);
                    if (nextUserIndex !== -1) {
                      setCurrentDialogueIndex(nextUserIndex);
                    } else {
                      toast({
                        title: 'Hoàn thành hội thoại!',
                        description: '+30 XP'
                      });
                      addXp(30);
                    }
                  }}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Tiếp tục
                </Button>
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

export default Speaking;

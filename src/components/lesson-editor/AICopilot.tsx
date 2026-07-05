import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, ListTree, BookOpen, HelpCircle, Wand2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LessonBlock, makeBlock } from '@/lib/lessonBlocks';

interface Props {
  lessonTitle: string;
  lessonLevel: string;
  onInsert: (blocks: LessonBlock[]) => void;
}

type Task = 'lesson_outline' | 'lesson_vocab' | 'lesson_quiz' | 'lesson_rewrite';

const TASKS: { key: Task; label: string; icon: any; hint: string }[] = [
  { key: 'lesson_outline', label: 'Sinh outline', icon: ListTree, hint: 'Sinh khung bài học (tiêu đề + đoạn giới thiệu).' },
  { key: 'lesson_vocab', label: 'Sinh từ vựng', icon: BookOpen, hint: 'Sinh 8-12 từ vựng theo chủ đề & trình độ.' },
  { key: 'lesson_quiz', label: 'Sinh câu hỏi', icon: HelpCircle, hint: 'Sinh 3-5 câu trắc nghiệm ôn tập.' },
  { key: 'lesson_rewrite', label: 'Viết lại đơn giản', icon: Wand2, hint: 'Viết lại đoạn văn cho dễ hiểu hơn.' },
];

const AICopilot = ({ lessonTitle, lessonLevel, onInsert }: Props) => {
  const { toast } = useToast();
  const [task, setTask] = useState<Task>('lesson_outline');
  const [topic, setTopic] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('classroom-ai', {
        body: {
          action: task,
          topic: topic || lessonTitle,
          level: lessonLevel,
          source,
        },
      });
      if (error) throw error;
      const blocks = toBlocks(task, data);
      if (!blocks.length) throw new Error('AI không trả về nội dung phù hợp');
      onInsert(blocks);
      toast({ title: `✨ Đã thêm ${blocks.length} block` });
    } catch (e: any) {
      toast({ title: 'AI lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const needsSource = task === 'lesson_rewrite';
  const current = TASKS.find((t) => t.key === task)!;

  return (
    <Card className="p-3 space-y-3 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="grid grid-cols-2 gap-1">
        {TASKS.map((t) => {
          const Icon = t.icon;
          const active = task === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTask(t.key)}
              className={`text-left p-2 rounded-lg text-xs border transition ${
                active ? 'bg-primary/15 border-primary/40 text-primary' : 'hover:bg-muted border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5 mb-1" />
              <div className="font-medium">{t.label}</div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground italic">{current.hint}</p>

      {!needsSource && (
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={`Chủ đề (mặc định: "${lessonTitle || 'tiêu đề bài học'}")`}
          className="text-sm"
        />
      )}
      {needsSource && (
        <Textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Dán đoạn văn cần viết lại…"
          rows={4}
          className="text-sm"
        />
      )}

      <Button onClick={run} disabled={loading} size="sm" className="w-full">
        {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
        {loading ? 'Đang tạo…' : 'Sinh & thêm vào bài'}
      </Button>
    </Card>
  );
};

const toBlocks = (task: Task, data: any): LessonBlock[] => {
  if (!data) return [];
  if (task === 'lesson_outline' && Array.isArray(data.sections)) {
    const out: LessonBlock[] = [];
    data.sections.forEach((s: any) => {
      if (s?.heading) out.push(makeBlock('heading', { text: String(s.heading), level: 2 }));
      if (s?.intro) out.push(makeBlock('paragraph', { text: String(s.intro) }));
    });
    return out;
  }
  if (task === 'lesson_vocab' && Array.isArray(data.items)) {
    return [makeBlock('vocabulary', { items: data.items.slice(0, 20) })];
  }
  if (task === 'lesson_quiz' && Array.isArray(data.questions)) {
    return data.questions.slice(0, 8).map((q: any) => makeBlock('quiz', {
      question: String(q.question || ''),
      choices: Array.isArray(q.choices) ? q.choices.slice(0, 6).map(String) : ['', '', '', ''],
      answer: Number.isFinite(q.answer) ? q.answer : 0,
      explanation: String(q.explanation || ''),
    }));
  }
  if (task === 'lesson_rewrite' && typeof data.text === 'string') {
    return [makeBlock('paragraph', { text: data.text })];
  }
  return [];
};

export default AICopilot;
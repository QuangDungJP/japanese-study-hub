import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Headphones, BookOpen, PenTool, FileText, HelpCircle, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ExerciseEditor from './ExerciseEditor';

interface Exercise {
  id: string;
  lesson_id: string;
  exercise_type: string;
  title: string;
  title_vi: string;
  instructions: string | null;
  instructions_vi: string | null;
  content: any;
  audio_url: string | null;
  correct_answers: any;
  explanation: any;
  requires_grading: boolean;
  order_index: number;
  created_at: string;
}

interface LessonExercisesProps {
  lessonId: string;
  lessonTitle: string;
}

const exerciseIcons: Record<string, React.ElementType> = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenTool,
  vocabulary: FileText,
  multiple_choice: HelpCircle,
  fill_blank: FileText,
  matching: FileText,
  sentence_order: FileText,
};

const exerciseColors: Record<string, string> = {
  reading: 'bg-blue-500/10 text-blue-500',
  listening: 'bg-orange-500/10 text-orange-500',
  writing: 'bg-purple-500/10 text-purple-500',
  vocabulary: 'bg-green-500/10 text-green-500',
  multiple_choice: 'bg-pink-500/10 text-pink-500',
  fill_blank: 'bg-cyan-500/10 text-cyan-500',
  matching: 'bg-yellow-500/10 text-yellow-500',
  sentence_order: 'bg-indigo-500/10 text-indigo-500',
};

const exerciseLabels: Record<string, string> = {
  reading: 'Bài đọc',
  listening: 'Nghe hiểu',
  writing: 'Bài viết',
  vocabulary: 'Từ vựng',
  multiple_choice: 'Trắc nghiệm',
  fill_blank: 'Điền chỗ trống',
  matching: 'Nối cặp',
  sentence_order: 'Sắp xếp câu',
};

const LessonExercises = ({ lessonId, lessonTitle }: LessonExercisesProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExercises();
  }, [lessonId]);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setExercises(data || []);
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài tập này?')) return;

    try {
      const { error } = await supabase.from('exercises').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Thành công', description: 'Đã xóa bài tập' });
      fetchExercises();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    }
  };

  const openEditor = (exercise?: Exercise) => {
    setEditingExercise(exercise || null);
    setIsEditorOpen(true);
  };

  const getExerciseInfo = (exercise: Exercise) => {
    switch (exercise.exercise_type) {
      case 'vocabulary':
        const vocabCount = exercise.content?.items?.length || 0;
        return `${vocabCount} từ vựng`;
      case 'multiple_choice':
        const qCount = exercise.content?.questions?.length || 0;
        return `${qCount} câu hỏi`;
      case 'writing':
        return exercise.requires_grading ? 'Cần chấm bài' : 'Tự luyện';
      case 'listening':
        return exercise.audio_url ? 'Có file audio' : 'Chưa có audio';
      case 'reading':
        const textLength = exercise.content?.text?.length || 0;
        return `${textLength} ký tự`;
      case 'fill_blank':
        const fillCount = exercise.content?.sentences?.length || 0;
        return `${fillCount} câu điền`;
      case 'matching':
        const matchCount = exercise.content?.pairs?.length || 0;
        return `${matchCount} cặp`;
      case 'sentence_order':
        const orderCount = exercise.content?.items?.length || 0;
        return `${orderCount} câu`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Bài tập trong: {lessonTitle}</h3>
          <p className="text-sm text-muted-foreground">{exercises.length} bài tập</p>
        </div>
        <Button onClick={() => openEditor()} variant="hero" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Thêm bài tập
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : exercises.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            Chưa có bài tập nào. Nhấn "Thêm bài tập" để bắt đầu.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {exercises.map((exercise, index) => {
            const Icon = exerciseIcons[exercise.exercise_type] || BookOpen;
            return (
              <Card key={exercise.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="cursor-grab text-muted-foreground">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className={`w-10 h-10 rounded-lg ${exerciseColors[exercise.exercise_type]} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{exercise.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                          {exerciseLabels[exercise.exercise_type]}
                        </span>
                        {exercise.requires_grading && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500">
                            Cần chấm
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {exercise.title_vi} • {getExerciseInfo(exercise)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditor(exercise)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(exercise.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Exercise Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExercise ? 'Chỉnh sửa bài tập' : 'Thêm bài tập mới'}
            </DialogTitle>
          </DialogHeader>
          <ExerciseEditor
            lessonId={lessonId}
            exercise={editingExercise}
            onSave={() => {
              setIsEditorOpen(false);
              fetchExercises();
            }}
            onCancel={() => setIsEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonExercises;

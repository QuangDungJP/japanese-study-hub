import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  BookOpen, Plus, Edit, Clock, Send, Dumbbell, 
  Image, Film, MoreHorizontal, Eye, Layers, FileText, GraduationCap
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import LessonEditor from '@/components/teacher/LessonEditor';
import LessonExercises from '@/components/admin/LessonExercises';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExamManager } from '@/components/calendar/ExamManager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Lesson {
  id: string;
  title: string;
  title_vi: string;
  description: string | null;
  description_vi: string | null;
  skill: string;
  level: string;
  duration_minutes: number;
  xp_reward: number;
  is_published: boolean;
  created_at: string;
  thumbnail_url?: string;
  video_url?: string;
  content_html?: string;
}

interface TeacherContext {
  teacherRole: string | null;
}

const TeacherLessons = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { teacherRole } = useOutletContext<TeacherContext>();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [exercisesLesson, setExercisesLesson] = useState<Lesson | null>(null);
  const { toast } = useToast();

  const isSeniorTeacher = teacherRole === 'senior_teacher';

  useEffect(() => {
    if (user) {
      fetchLessons();
    }
  }, [user]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      const lessonData = {
        ...formData,
        teacher_id: user?.id,
        language: 'japanese',
        is_published: false,
      };

      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id);

        if (error) throw error;
        toast({ title: 'Thành công', description: 'Đã cập nhật bài học' });
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert(lessonData);

        if (error) throw error;
        toast({ title: 'Thành công', description: 'Đã tạo bài học mới' });
      }

      setIsEditorOpen(false);
      setEditingLesson(null);
      fetchLessons();
    } catch (error: any) {
      console.error('Error saving lesson:', error);
      toast({ 
        title: 'Lỗi', 
        description: error.message || 'Không thể lưu bài học', 
        variant: 'destructive' 
      });
    }
  };

  const handlePublish = async (lessonId: string) => {
    try {
      if (!isSeniorTeacher) {
        toast({
          title: 'Đã gửi',
          description: 'Bài học đã được gửi để Admin xem xét'
        });
        return;
      }

      const { error } = await supabase
        .from('lessons')
        .update({ is_published: true })
        .eq('id', lessonId);

      if (error) throw error;
      toast({ title: 'Thành công', description: 'Đã xuất bản bài học' });
      fetchLessons();
    } catch (error) {
      console.error('Error publishing lesson:', error);
      toast({ 
        title: 'Lỗi', 
        description: 'Không thể xuất bản bài học', 
        variant: 'destructive' 
      });
    }
  };

  const openEditor = (lesson?: Lesson) => {
    setEditingLesson(lesson || null);
    setIsEditorOpen(true);
  };

  const getSkillInfo = (skill: string) => {
    const info: Record<string, { label: string; icon: string; color: string }> = {
      reading: { label: 'Đọc hiểu', icon: '📖', color: 'bg-blue-500/10 text-blue-600' },
      listening: { label: 'Nghe', icon: '🎧', color: 'bg-purple-500/10 text-purple-600' },
      speaking: { label: 'Nói', icon: '🗣️', color: 'bg-green-500/10 text-green-600' },
      writing: { label: 'Viết', icon: '✍️', color: 'bg-orange-500/10 text-orange-600' },
      vocabulary: { label: 'Từ vựng', icon: '📚', color: 'bg-pink-500/10 text-pink-600' },
      grammar: { label: 'Ngữ pháp', icon: '📝', color: 'bg-cyan-500/10 text-cyan-600' },
    };
    return info[skill] || { label: skill, icon: '📖', color: 'bg-muted text-muted-foreground' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Không gian giảng dạy</h1>
          <p className="text-muted-foreground mt-1">
            Tạo bài học, quản lý module bài tập và bài kiểm tra ở cùng một nơi
          </p>
        </div>
        <Button onClick={() => openEditor()} variant="hero">
          <Plus className="w-4 h-4 mr-2" />
          Tạo bài học
        </Button>
      </div>

      <Tabs defaultValue="lessons" className="space-y-4">
        <TabsList className="flex-wrap h-auto justify-start">
          <TabsTrigger value="lessons" className="gap-2">
            <BookOpen className="w-4 h-4" />Bài học
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-2">
            <Layers className="w-4 h-4" />Module bài tập
          </TabsTrigger>
          <TabsTrigger value="exams" className="gap-2">
            <GraduationCap className="w-4 h-4" />Bài kiểm tra
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-4 mt-4">
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Danh sách bài học ({lessons.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isSeniorTeacher
              ? 'Bạn có thể tự xuất bản bài học'
              : 'Bài học cần Admin phê duyệt trước khi xuất bản'}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium text-foreground mb-2">Chưa có bài học nào</h3>
              <p className="text-sm mb-4">Bắt đầu tạo bài học đầu tiên của bạn</p>
              <Button onClick={() => openEditor()} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Tạo bài học đầu tiên
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Media</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Kỹ năng</TableHead>
                  <TableHead>Trình độ</TableHead>
                  <TableHead>Thời lượng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map((lesson) => {
                  const skillInfo = getSkillInfo(lesson.skill);
                  return (
                    <TableRow key={lesson.id}>
                      <TableCell>
                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          {lesson.thumbnail_url ? (
                            <img 
                              src={lesson.thumbnail_url} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          ) : lesson.video_url ? (
                            <Film className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <Image className="w-5 h-5 text-muted-foreground/50" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lesson.title_vi || lesson.title}</p>
                          {lesson.title_vi && lesson.title !== lesson.title_vi && (
                            <p className="text-sm text-muted-foreground">{lesson.title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={skillInfo.color}>
                          {skillInfo.icon} {skillInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{lesson.level}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {lesson.duration_minutes} phút
                        </div>
                      </TableCell>
                      <TableCell>
                        {lesson.is_published ? (
                          <Badge className="bg-green-500/10 text-green-600">Đã xuất bản</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                            Nháp
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(lesson.created_at), 'dd/MM/yyyy', { locale: vi })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditor(lesson)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setExercisesLesson(lesson)}>
                              <Dumbbell className="w-4 h-4 mr-2" />
                              Quản lý bài tập
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!lesson.is_published && (
                              <DropdownMenuItem onClick={() => handlePublish(lesson.id)}>
                                <Send className="w-4 h-4 mr-2" />
                                {isSeniorTeacher ? 'Xuất bản' : 'Gửi duyệt'}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="modules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Module bài tập theo bài học
              </CardTitle>
              <p className="text-sm text-muted-foreground">Chọn một bài học để quản lý các module / bài tập bên trong.</p>
            </CardHeader>
            <CardContent>
              {lessons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Chưa có bài học nào. Hãy tạo bài học trước khi thêm module.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {lessons.map((l) => {
                    const skill = getSkillInfo(l.skill);
                    return (
                      <button
                        key={l.id}
                        onClick={() => setExercisesLesson(l)}
                        className="text-left rounded-xl border border-border/60 bg-card hover:border-primary/50 hover:shadow-md transition-all p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className={skill.color}>{skill.icon} {skill.label}</Badge>
                          <Badge variant="outline">{l.level}</Badge>
                        </div>
                        <h4 className="font-semibold line-clamp-2">{l.title_vi || l.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />{l.duration_minutes} phút
                          <span>•</span>
                          <span>{l.is_published ? 'Đã xuất bản' : 'Nháp'}</span>
                        </div>
                        <div className="pt-1 text-primary text-sm font-medium flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" />Mở module bài tập →
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Bài kiểm tra
              </CardTitle>
              <p className="text-sm text-muted-foreground">Tạo, lên lịch và theo dõi các bài kiểm tra cho lớp của bạn.</p>
            </CardHeader>
            <CardContent>
              <ExamManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lesson Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-6">
          <LessonEditor
            initialData={editingLesson ? {
              title: editingLesson.title,
              title_vi: editingLesson.title_vi,
              description: editingLesson.description || '',
              description_vi: editingLesson.description_vi || '',
              skill: editingLesson.skill,
              level: editingLesson.level,
              duration_minutes: editingLesson.duration_minutes,
              xp_reward: editingLesson.xp_reward,
              thumbnail_url: editingLesson.thumbnail_url || '',
              video_url: editingLesson.video_url || '',
              content_html: editingLesson.content_html || '',
            } : undefined}
            onSubmit={handleSubmit}
            onCancel={() => setIsEditorOpen(false)}
            isEditing={!!editingLesson}
          />
        </DialogContent>
      </Dialog>

      {/* Exercises Dialog */}
      <Dialog open={!!exercisesLesson} onOpenChange={() => setExercisesLesson(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {exercisesLesson && (
            <LessonExercises
              lessonId={exercisesLesson.id}
              lessonTitle={exercisesLesson.title_vi || exercisesLesson.title}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherLessons;

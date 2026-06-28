import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookOpen, Plus, Edit, Clock, Eye, EyeOff, Dumbbell, Trash2,
  Image as ImageIcon, Film, MoreHorizontal, Search, Layers, GraduationCap, FolderOpen, ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import LessonEditor from '@/components/teacher/LessonEditor';
import LessonExercises from '@/components/admin/LessonExercises';
import MaterialsManager from '@/components/teacher/MaterialsManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buildLessonPayload, parseLessonRow } from '@/lib/lessonSchema';
import { Link } from 'react-router-dom';

interface Lesson {
  id: string;
  title: string;
  title_vi: string;
  description: string | null;
  description_vi: string | null;
  skill: string;
  level: string;
  language?: string;
  duration_minutes: number;
  xp_reward: number;
  is_published: boolean;
  created_at: string;
  thumbnail_url?: string;
  video_url?: string;
  content_html?: string;
  class_id?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  order_index?: number;
}

const AdminLessons = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSkill, setFilterSkill] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [exercisesLesson, setExercisesLesson] = useState<Lesson | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchLessons(); }, []);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLessons(data || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách bài học', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      const payload = buildLessonPayload(formData, { language: 'japanese' });

      if (editingLesson) {
        const { error } = await (supabase.from('lessons') as any).update(payload).eq('id', editingLesson.id);
        if (error) throw error;
        toast({ title: 'Thành công', description: 'Đã cập nhật bài học' });
      } else {
        const { error } = await (supabase.from('lessons') as any).insert(payload);
        if (error) throw error;
        toast({ title: 'Thành công', description: 'Đã tạo bài học mới' });
      }
      setIsEditorOpen(false);
      setEditingLesson(null);
      fetchLessons();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Lỗi', description: e.message || 'Không thể lưu bài học', variant: 'destructive' });
    }
  };

  const togglePublish = async (lesson: Lesson) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ is_published: !lesson.is_published })
        .eq('id', lesson.id);
      if (error) throw error;
      toast({ title: 'Thành công', description: lesson.is_published ? 'Đã ẩn bài học' : 'Đã xuất bản bài học' });
      fetchLessons();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài học này?')) return;
    try {
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Thành công', description: 'Đã xóa bài học' });
      fetchLessons();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    }
  };

  const openEditor = (lesson?: Lesson) => {
    setEditingLesson(lesson || null);
    setIsEditorOpen(true);
  };

  const getSkillInfo = (skill: string) => ({
    label: skill || 'Khác',
    color: 'bg-primary/10 text-primary border-primary/20',
  });

  const filteredLessons = lessons.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (l.title || '').toLowerCase().includes(q) ||
      (l.title_vi || '').toLowerCase().includes(q);
    const matchesSkill = filterSkill === 'all' || l.skill === filterSkill;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'published' && l.is_published) ||
      (filterStatus === 'draft' && !l.is_published);
    return matchesSearch && matchesSkill && matchesStatus;
  });

  const skillsForFilter = Array.from(new Set(lessons.map(l => l.skill).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý bài học</h1>
          <p className="text-muted-foreground mt-1">
            Tạo, phê duyệt và quản lý toàn bộ bài học của hệ thống
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
          <TabsTrigger value="materials" className="gap-2">
            <FolderOpen className="w-4 h-4" />Tài liệu
          </TabsTrigger>
          <TabsTrigger value="exams" className="gap-2">
            <GraduationCap className="w-4 h-4" />Bài kiểm tra
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Danh sách bài học ({filteredLessons.length})
                </CardTitle>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm bài học..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterSkill} onValueChange={setFilterSkill}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Kỹ năng" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả kỹ năng</SelectItem>
                    {skillsForFilter.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="published">Đã xuất bản</SelectItem>
                    <SelectItem value="draft">Nháp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredLessons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Chưa có bài học</h3>
                  <p className="text-sm mb-4">Bắt đầu bằng cách tạo bài học đầu tiên</p>
                  <Button onClick={() => openEditor()} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />Tạo bài học
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
                    {filteredLessons.map((lesson) => {
                      const skillInfo = getSkillInfo(lesson.skill);
                      return (
                        <TableRow key={lesson.id}>
                          <TableCell>
                            <div className="w-16 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                              {lesson.thumbnail_url ? (
                                <img src={lesson.thumbnail_url} alt="" className="w-full h-full object-cover" />
                              ) : lesson.video_url ? (
                                <Film className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{lesson.title_vi || lesson.title}</p>
                              {lesson.title && lesson.title_vi && lesson.title !== lesson.title_vi && (
                                <p className="text-sm text-muted-foreground">{lesson.title}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={skillInfo.color}>{skillInfo.label}</Badge>
                          </TableCell>
                          <TableCell>
                            {lesson.level ? <Badge variant="outline">{lesson.level}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
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
                                  <Edit className="w-4 h-4 mr-2" />Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setExercisesLesson(lesson)}>
                                  <Dumbbell className="w-4 h-4 mr-2" />Quản lý bài tập
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => togglePublish(lesson)}>
                                  {lesson.is_published ? (
                                    <><EyeOff className="w-4 h-4 mr-2" />Ẩn bài học</>
                                  ) : (
                                    <><Eye className="w-4 h-4 mr-2" />Xuất bản</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(lesson.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />Xóa
                                </DropdownMenuItem>
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
                          <Badge variant="outline" className={skill.color}>{skill.label}</Badge>
                          {l.level && <Badge variant="outline">{l.level}</Badge>}
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

        <TabsContent value="materials" className="mt-4">
          <MaterialsManager lessons={lessons.map(l => ({ id: l.id, title: l.title, title_vi: l.title_vi }))} />
        </TabsContent>

        <TabsContent value="exams" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Bài kiểm tra
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Bài kiểm tra (Exam) đã được tách thành mục riêng để quản lý thuận tiện hơn.
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild variant="hero">
                <Link to="/admin/exams">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Mở trang Bài kiểm tra <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lesson Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={(open) => { setIsEditorOpen(open); if (!open) setEditingLesson(null); }}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-6">
          <LessonEditor
            lessonId={editingLesson?.id}
            initialData={editingLesson ? parseLessonRow(editingLesson) : undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setIsEditorOpen(false); setEditingLesson(null); }}
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

export default AdminLessons;

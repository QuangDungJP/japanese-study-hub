import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  BookOpen,
  Mic,
  PenTool,
  Headphones,
  Loader2,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import LessonExercises from '@/components/admin/LessonExercises';

interface Lesson {
  id: string;
  title: string;
  title_vi: string;
  description: string | null;
  description_vi: string | null;
  skill: string;
  language: string;
  level: string;
  xp_reward: number;
  duration_minutes: number;
  is_published: boolean;
  order_index: number;
  created_at: string;
}

const skillIcons: Record<string, React.ElementType> = {
  reading: BookOpen,
  speaking: Mic,
  writing: PenTool,
  listening: Headphones,
};

const skillColors: Record<string, string> = {
  reading: 'bg-blue-500',
  speaking: 'bg-green-500',
  writing: 'bg-purple-500',
  listening: 'bg-orange-500',
};

const AdminLessons = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSkill, setFilterSkill] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExercisesOpen, setIsExercisesOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    title_vi: '',
    description: '',
    description_vi: '',
    skill: 'reading',
    language: 'english',
    level: 'beginner',
    xp_reward: 25,
    duration_minutes: 15,
    is_published: false,
  });

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách bài học',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(formData)
          .eq('id', editingLesson.id);

        if (error) throw error;
        toast({ title: 'Thành công', description: 'Đã cập nhật bài học' });
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert([formData]);

        if (error) throw error;
        toast({ title: 'Thành công', description: 'Đã tạo bài học mới' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchLessons();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài học này?')) return;

    try {
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Thành công', description: 'Đã xóa bài học' });
      fetchLessons();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const togglePublish = async (lesson: Lesson) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ is_published: !lesson.is_published })
        .eq('id', lesson.id);

      if (error) throw error;
      toast({ 
        title: 'Thành công', 
        description: lesson.is_published ? 'Đã ẩn bài học' : 'Đã xuất bản bài học' 
      });
      fetchLessons();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      title_vi: '',
      description: '',
      description_vi: '',
      skill: 'reading',
      language: 'english',
      level: 'beginner',
      xp_reward: 25,
      duration_minutes: 15,
      is_published: false,
    });
    setEditingLesson(null);
  };

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      title_vi: lesson.title_vi,
      description: lesson.description || '',
      description_vi: lesson.description_vi || '',
      skill: lesson.skill,
      language: lesson.language,
      level: lesson.level,
      xp_reward: lesson.xp_reward,
      duration_minutes: lesson.duration_minutes,
      is_published: lesson.is_published,
    });
    setIsDialogOpen(true);
  };

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = 
      lesson.title.toLowerCase().includes(search.toLowerCase()) ||
      lesson.title_vi.toLowerCase().includes(search.toLowerCase());
    const matchesSkill = filterSkill === 'all' || lesson.skill === filterSkill;
    const matchesLanguage = filterLanguage === 'all' || lesson.language === filterLanguage;
    return matchesSearch && matchesSkill && matchesLanguage;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý bài học</h1>
          <p className="text-muted-foreground">Tạo và quản lý các bài học cho từng kỹ năng</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              Thêm bài học
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tiêu đề (EN)</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tiêu đề (VI)</label>
                  <Input
                    value={formData.title_vi}
                    onChange={(e) => setFormData({ ...formData, title_vi: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Mô tả (EN)</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mô tả (VI)</label>
                  <Textarea
                    value={formData.description_vi}
                    onChange={(e) => setFormData({ ...formData, description_vi: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Kỹ năng</label>
                  <Select
                    value={formData.skill}
                    onValueChange={(value) => setFormData({ ...formData, skill: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reading">Đọc hiểu</SelectItem>
                      <SelectItem value="speaking">Nói</SelectItem>
                      <SelectItem value="writing">Viết</SelectItem>
                      <SelectItem value="listening">Nghe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Ngôn ngữ</label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">Tiếng Anh</SelectItem>
                      <SelectItem value="german">Tiếng Đức</SelectItem>
                      <SelectItem value="chinese">Tiếng Trung</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Cấp độ</label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Cơ bản</SelectItem>
                      <SelectItem value="intermediate">Trung cấp</SelectItem>
                      <SelectItem value="advanced">Nâng cao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">XP thưởng</label>
                  <Input
                    type="number"
                    value={formData.xp_reward}
                    onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
                    min={0}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Thời lượng (phút)</label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    min={1}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="hero" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingLesson ? 'Cập nhật' : 'Tạo bài học'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bài học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterSkill} onValueChange={setFilterSkill}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Kỹ năng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="reading">Đọc hiểu</SelectItem>
            <SelectItem value="speaking">Nói</SelectItem>
            <SelectItem value="writing">Viết</SelectItem>
            <SelectItem value="listening">Nghe</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterLanguage} onValueChange={setFilterLanguage}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Ngôn ngữ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="english">Tiếng Anh</SelectItem>
            <SelectItem value="german">Tiếng Đức</SelectItem>
            <SelectItem value="chinese">Tiếng Trung</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lessons Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground">
            Chưa có bài học nào. Nhấn "Thêm bài học" để tạo mới.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Bài học</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Kỹ năng</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Ngôn ngữ</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Cấp độ</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Trạng thái</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.map((lesson) => {
                const SkillIcon = skillIcons[lesson.skill] || BookOpen;
                return (
                  <tr key={lesson.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{lesson.title}</p>
                        <p className="text-sm text-muted-foreground">{lesson.title_vi}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${skillColors[lesson.skill]}/10 flex items-center justify-center`}>
                          <SkillIcon className={`w-4 h-4 ${skillColors[lesson.skill].replace('bg-', 'text-')}`} />
                        </div>
                        <span className="text-sm capitalize">{lesson.skill}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm capitalize">
                        {lesson.language === 'english' ? '🇬🇧 Anh' : 
                         lesson.language === 'german' ? '🇩🇪 Đức' : '🇨🇳 Trung'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lesson.level === 'beginner' ? 'bg-green-500/10 text-green-600' :
                        lesson.level === 'intermediate' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {lesson.level === 'beginner' ? 'Cơ bản' : 
                         lesson.level === 'intermediate' ? 'Trung cấp' : 'Nâng cao'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lesson.is_published 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {lesson.is_published ? 'Đã xuất bản' : 'Nháp'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedLesson(lesson);
                            setIsExercisesOpen(true);
                          }}
                          title="Quản lý bài tập"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => togglePublish(lesson)}
                        >
                          {lesson.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => openEditDialog(lesson)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDelete(lesson.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Exercises Dialog */}
      <Dialog open={isExercisesOpen} onOpenChange={setIsExercisesOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quản lý bài tập</DialogTitle>
          </DialogHeader>
          {selectedLesson && (
            <LessonExercises 
              lessonId={selectedLesson.id} 
              lessonTitle={selectedLesson.title_vi} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLessons;

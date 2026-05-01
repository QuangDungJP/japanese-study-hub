import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, BookOpen, Loader2, Clock, DollarSign } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface Course {
  id: string;
  title: string;
  title_vi: string;
  description: string | null;
  description_vi: string | null;
  price: number;
  original_price: number | null;
  duration_weeks: number | null;
  level: string;
  language: string;
  is_published: boolean | null;
  features: Json | null;
  thumbnail_url: string | null;
  created_at: string;
}

const jlptLevels = [
  { value: 'N5', label: 'JLPT N5 - Cơ bản' },
  { value: 'N4', label: 'JLPT N4 - Sơ cấp' },
  { value: 'N3', label: 'JLPT N3 - Trung cấp' },
  { value: 'N2', label: 'JLPT N2 - Cao cấp' },
  { value: 'N1', label: 'JLPT N1 - Thành thạo' },
];

interface TeacherOption {
  id: string;
  display_name: string | null;
  image_url: string | null;
}

const AdminCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [allTeachers, setAllTeachers] = useState<TeacherOption[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    title_vi: '',
    description: '',
    description_vi: '',
    price: 0,
    original_price: 0,
    duration_weeks: 12,
    level: 'N5',
    language: 'japanese',
    is_published: false,
    features: '',
    thumbnail_url: '',
  });

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from('teacher_profiles')
      .select('id, display_name, image_url')
      .order('order_index', { ascending: true });
    setAllTeachers(data || []);
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách khóa học',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      title_vi: '',
      description: '',
      description_vi: '',
      price: 0,
      original_price: 0,
      duration_weeks: 12,
      level: 'N5',
      language: 'japanese',
      is_published: false,
      features: '',
      thumbnail_url: '',
    });
    setSelectedTeacherIds([]);
    setEditingCourse(null);
  };

  const openEditDialog = async (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      title_vi: course.title_vi,
      description: course.description || '',
      description_vi: course.description_vi || '',
      price: course.price,
      original_price: course.original_price || 0,
      duration_weeks: course.duration_weeks || 12,
      level: course.level,
      language: course.language,
      is_published: course.is_published || false,
      features: Array.isArray(course.features) ? (course.features as string[]).join('\n') : '',
      thumbnail_url: course.thumbnail_url || '',
    });
    const { data: ct } = await (supabase as any)
      .from('course_teachers')
      .select('teacher_id')
      .eq('course_id', course.id);
    setSelectedTeacherIds((ct || []).map((c: any) => c.teacher_id));
    setIsDialogOpen(true);
  };

  const toggleTeacher = (id: string) => {
    setSelectedTeacherIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const saveCourseTeachers = async (courseId: string) => {
    await (supabase as any).from('course_teachers').delete().eq('course_id', courseId);
    if (selectedTeacherIds.length > 0) {
      const rows = selectedTeacherIds.map((teacher_id, idx) => ({
        course_id: courseId,
        teacher_id,
        order_index: idx,
      }));
      await (supabase as any).from('course_teachers').insert(rows);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const featuresArray = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const courseData = {
        title: formData.title,
        title_vi: formData.title_vi,
        description: formData.description || null,
        description_vi: formData.description_vi || null,
        price: formData.price,
        original_price: formData.original_price || null,
        duration_weeks: formData.duration_weeks,
        level: formData.level,
        language: formData.language,
        is_published: formData.is_published,
        features: featuresArray,
        thumbnail_url: formData.thumbnail_url || null,
      };

      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editingCourse.id);

        if (error) throw error;
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật khóa học',
        });
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([courseData]);

        if (error) throw error;
        toast({
          title: 'Thành công',
          description: 'Đã tạo khóa học mới',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu khóa học',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Bạn có chắc muốn xóa khóa học này?')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      toast({
        title: 'Thành công',
        description: 'Đã xóa khóa học',
      });
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa khóa học',
        variant: 'destructive',
      });
    }
  };

  const togglePublish = async (course: Course) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !course.is_published })
        .eq('id', course.id);

      if (error) throw error;
      toast({
        title: 'Thành công',
        description: course.is_published ? 'Đã ẩn khóa học' : 'Đã xuất bản khóa học',
      });
      fetchCourses();
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái',
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      N5: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      N4: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      N3: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      N2: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      N1: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Khóa học</h1>
          <p className="text-muted-foreground mt-1">Thêm, sửa, xóa các khóa học Tiếng Nhật JLPT</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Thêm khóa học
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? 'Chỉnh sửa khóa học' : 'Thêm khóa học mới'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tên khóa học (English)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="JLPT N5 Complete Course"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title_vi">Tên khóa học (Tiếng Việt)</Label>
                  <Input
                    id="title_vi"
                    value={formData.title_vi}
                    onChange={(e) => setFormData({ ...formData, title_vi: e.target.value })}
                    placeholder="Khóa học JLPT N5 Toàn diện"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả (English)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Course description..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_vi">Mô tả (Tiếng Việt)</Label>
                <Textarea
                  id="description_vi"
                  value={formData.description_vi}
                  onChange={(e) => setFormData({ ...formData, description_vi: e.target.value })}
                  placeholder="Mô tả khóa học..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Giá (VNĐ)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    placeholder="1990000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="original_price">Giá gốc (VNĐ)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: parseInt(e.target.value) || 0 })}
                    placeholder="2990000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_weeks">Thời lượng (tuần)</Label>
                  <Input
                    id="duration_weeks"
                    type="number"
                    value={formData.duration_weeks}
                    onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) || 12 })}
                    placeholder="12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Cấp độ JLPT</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn cấp độ" />
                    </SelectTrigger>
                    <SelectContent>
                      {jlptLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thumbnail_url">URL Ảnh bìa</Label>
                  <Input
                    id="thumbnail_url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Tính năng (mỗi dòng một tính năng)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Video bài giảng&#10;Flashcards từ vựng&#10;Bài tập thực hành&#10;Hỗ trợ 1-1"
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published">Xuất bản ngay</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingCourse ? 'Cập nhật' : 'Tạo khóa học'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Chưa có khóa học</h3>
            <p className="text-muted-foreground mb-4">Bắt đầu bằng cách thêm khóa học đầu tiên</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {course.title_vi}
                      </h3>
                      <Badge className={getLevelColor(course.level)}>
                        {course.level}
                      </Badge>
                      {course.is_published ? (
                        <Badge variant="default" className="bg-green-600">Đã xuất bản</Badge>
                      ) : (
                        <Badge variant="secondary">Bản nháp</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {course.description_vi || course.description || 'Chưa có mô tả'}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-foreground">{formatPrice(course.price)}</span>
                        {course.original_price && course.original_price > course.price && (
                          <span className="line-through text-muted-foreground ml-1">
                            {formatPrice(course.original_price)}
                          </span>
                        )}
                      </span>
                      {course.duration_weeks && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {course.duration_weeks} tuần
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublish(course)}
                    >
                      {course.is_published ? 'Ẩn' : 'Xuất bản'}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(course)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDelete(course.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCourses;

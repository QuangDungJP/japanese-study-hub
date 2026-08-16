import { useState, useEffect, useMemo } from 'react';
import { formatWithJST, formatTimeWithJST } from '@/lib/dateUtils';
import { Plus, Loader2, Pencil, Trash2, Video, Users, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import ExamBuilder from './ExamBuilder';

interface Exam {
  id: string;
  title: string;
  title_vi: string;
  description: string | null;
  description_vi: string | null;
  exam_type: string;
  exam_date: string;
  start_time: string;
  duration_minutes: number;
  location: string | null;
  meet_link: string | null;
  max_score: number | null;
  passing_score: number | null;
  is_published: boolean;
  class_id: string | null;
  teacher_id: string;
}

interface Class {
  id: string;
  name_vi: string;
}

export const ExamManager = ({ classId }: { classId?: string }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const initialExamData = useMemo(() => {
    if (editingExam) return editingExam;
    if (classId) return { class_id: classId };
    return undefined;
  }, [editingExam, classId]);

  const mappedClasses = useMemo(() => {
    return classes.map((c) => ({ id: c.id, name: c.name_vi }));
  }, [classes]);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch = exam.title_vi.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (exam.title && exam.title.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'published' && exam.is_published) || 
                            (statusFilter === 'draft' && !exam.is_published);
      const matchesType = typeFilter === 'all' || exam.exam_type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [exams, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, classId]);

  const fetchData = async () => {
    try {
      // Fetch exams
      let query = supabase
        .from('exams')
        .select('*')
        .eq('teacher_id', user?.id);

      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data: examsData, error } = await query.order('exam_date', { ascending: true });

      if (error) throw error;
      setExams(examsData || []);

      // Fetch classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name_vi')
        .eq('teacher_id', user?.id);

      setClasses(classesData || []);

      if (location.state?.editExamId && examsData) {
        const target = examsData.find(e => e.id === location.state.editExamId);
        if (target && !isDialogOpen) {
          setEditingExam(target);
          setIsDialogOpen(true);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingExam(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (exam: Exam) => {
    setEditingExam(exam);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài kiểm tra này?')) return;

    try {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
      toast.success('Đã xóa bài kiểm tra');
      fetchData();
    } catch (error) {
      toast.error('Không thể xóa bài kiểm tra');
    }
  };

  const getExamTypeBadge = (type: string) => {
    switch (type) {
      case 'quiz':
        return <Badge variant="secondary">Quiz</Badge>;
      case 'midterm':
        return <Badge className="bg-primary text-primary-foreground">Giữa kỳ</Badge>;
      case 'final':
        return <Badge className="bg-accent text-accent-foreground">Cuối kỳ</Badge>;
      case 'placement':
        return <Badge variant="outline">Xếp lớp</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Quản lý bài kiểm tra</h2>
          <p className="text-muted-foreground">Tạo và quản lý các bài kiểm tra, câu hỏi trắc nghiệm</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo mới
        </Button>
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm kiếm bài kiểm tra..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background w-full"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-background">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="published">Đã công bố</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-background">
                <SelectValue placeholder="Loại bài" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại bài</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="midterm">Giữa kỳ</SelectItem>
                <SelectItem value="final">Cuối kỳ</SelectItem>
                <SelectItem value="placement">Xếp lớp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredExams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Không tìm thấy bài kiểm tra nào</h3>
            <p className="text-muted-foreground">Thay đổi bộ lọc hoặc tạo bài kiểm tra mới để bắt đầu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredExams.map((exam, index) => (
            <Card key={exam.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="font-bold rounded-md bg-secondary/50">#{index + 1}</Badge>
                      <h3 className="font-semibold text-base">{exam.title_vi}</h3>
                      {getExamTypeBadge(exam.exam_type)}
                      <Badge variant={exam.is_published ? 'default' : 'outline'}>
                        {exam.is_published ? 'Đã công bố' : 'Nháp'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatWithJST(exam.exam_date, false)} lúc {formatTimeWithJST(exam.start_time)} • {exam.duration_minutes} phút
                    </div>
                    {exam.meet_link && (
                      <div className="flex items-center gap-1 text-sm text-primary">
                        <Video className="w-4 h-4" />
                        Có link Meet
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(exam)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(exam.id)}
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

      <ExamBuilder
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        classes={mappedClasses}
        teacherId={user?.id || ''}
        initial={initialExamData}
        onSaved={fetchData}
      />
    </div>
  );
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, Plus, Edit, Eye, Calendar, UserPlus, Trash2, 
  BookOpen, Star, Trophy, TrendingUp, Search, X,
  GraduationCap, Target, Flame
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface CustomField {
  key: string;
  label: string;
  value: string;
}

interface ClassData {
  id: string;
  name: string;
  name_vi: string;
  description: string | null;
  description_vi: string | null;
  course_id: string | null;
  max_students: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  approval_status?: string;
  rejection_reason?: string | null;
  custom_fields?: CustomField[];
  student_count?: number;
  courses?: { title_vi: string };
}

interface Student {
  id: string;
  student_id: string;
  enrolled_at: string;
  status: string;
  profiles?: { full_name: string; avatar_url: string | null };
  progress?: {
    total_xp: number;
    streak: number;
    lessons_completed: number;
    vocabulary_mastered: number;
    daily_progress: number;
    daily_goal: number;
  };
}

interface Course {
  id: string;
  title_vi: string;
}

interface AvailableUser {
  user_id: string;
  full_name: string | null;
}

const TeacherClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false);
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [searchUserTerm, setSearchUserTerm] = useState('');
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    name_vi: '',
    description: '',
    description_vi: '',
    course_id: '',
    max_students: 30,
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    if (user) {
      fetchClasses();
      fetchCourses();
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          courses:course_id (title_vi)
        `)
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get student counts
      const classesWithCounts = await Promise.all(
        (data || []).map(async (classItem) => {
          const { count } = await supabase
            .from('class_students')
            .select('id', { count: 'exact' })
            .eq('class_id', classItem.id);

          return {
            ...classItem,
            student_count: count || 0
          };
        })
      );

      setClasses(classesWithCounts);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await supabase
        .from('courses')
        .select('id, title_vi')
        .eq('is_published', true)
        .eq('language', 'japanese');

      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchStudents = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('class_students')
        .select('*')
        .eq('class_id', classId);

      if (error) throw error;

      // Get profiles and progress for each student
      const studentsWithData = await Promise.all(
        (data || []).map(async (student) => {
          const [profileRes, progressRes] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', student.student_id)
              .single(),
            supabase
              .from('user_progress')
              .select('total_xp, streak, lessons_completed, vocabulary_mastered, daily_progress, daily_goal')
              .eq('user_id', student.student_id)
              .single()
          ]);

          return {
            ...student,
            profiles: profileRes.data || { full_name: 'N/A', avatar_url: null },
            progress: progressRes.data || {
              total_xp: 0,
              streak: 0,
              lessons_completed: 0,
              vocabulary_mastered: 0,
              daily_progress: 0,
              daily_goal: 50
            }
          };
        })
      );

      setStudents(studentsWithData);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchAvailableUsers = async (classId: string) => {
    try {
      // Get existing student IDs in this class
      const { data: existingStudents } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classId);

      const existingIds = existingStudents?.map(s => s.student_id) || [];

      // Get all users with 'user' role who are not in this class
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'user');

      const userIds = userRoles?.map(r => r.user_id).filter(id => !existingIds.includes(id)) || [];

      if (userIds.length === 0) {
        setAvailableUsers([]);
        return;
      }

      // Get profiles for these users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      setAvailableUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const handleAddStudent = async (userId: string) => {
    if (!selectedClass) return;

    try {
      const { error } = await supabase
        .from('class_students')
        .insert({
          class_id: selectedClass.id,
          student_id: userId,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã thêm học viên vào lớp'
      });

      fetchStudents(selectedClass.id);
      fetchAvailableUsers(selectedClass.id);
      fetchClasses();
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm học viên',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClass) return;
    if (!confirm('Bạn có chắc muốn xóa học viên này khỏi lớp?')) return;

    try {
      const { error } = await supabase
        .from('class_students')
        .delete()
        .eq('class_id', selectedClass.id)
        .eq('student_id', studentId);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã xóa học viên khỏi lớp'
      });

      fetchStudents(selectedClass.id);
      fetchClasses();
    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa học viên',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const classData = {
        ...formData,
        teacher_id: user?.id,
        course_id: formData.course_id || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_active: true
      };

      if (editingClass) {
        const { error } = await supabase
          .from('classes')
          .update(classData)
          .eq('id', editingClass.id);

        if (error) throw error;
        toast({ title: 'Thành công', description: 'Đã cập nhật lớp học' });
      } else {
        const { error } = await supabase
          .from('classes')
          .insert(classData);

        if (error) throw error;
        toast({ title: 'Thành công', description: 'Đã tạo lớp học mới' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchClasses();
    } catch (error) {
      console.error('Error saving class:', error);
      toast({ 
        title: 'Lỗi', 
        description: 'Không thể lưu lớp học', 
        variant: 'destructive' 
      });
    }
  };

  const openEditDialog = (classItem: ClassData) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      name_vi: classItem.name_vi,
      description: classItem.description || '',
      description_vi: classItem.description_vi || '',
      course_id: classItem.course_id || '',
      max_students: classItem.max_students,
      start_date: classItem.start_date || '',
      end_date: classItem.end_date || ''
    });
    setIsDialogOpen(true);
  };

  const openStudentsDialog = (classItem: ClassData) => {
    setSelectedClass(classItem);
    fetchStudents(classItem.id);
    setIsStudentsDialogOpen(true);
  };

  const openAddStudentDialog = () => {
    if (selectedClass) {
      fetchAvailableUsers(selectedClass.id);
      setSearchUserTerm('');
      setIsAddStudentDialogOpen(true);
    }
  };

  const openProgressDialog = (student: Student) => {
    setSelectedStudent(student);
    setIsProgressDialogOpen(true);
  };

  const resetForm = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      name_vi: '',
      description: '',
      description_vi: '',
      course_id: '',
      max_students: 30,
      start_date: '',
      end_date: ''
    });
  };

  const filteredUsers = availableUsers.filter(u => 
    !searchUserTerm || u.full_name?.toLowerCase().includes(searchUserTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý lớp học</h1>
          <p className="text-muted-foreground mt-1">Tạo và quản lý các lớp học của bạn</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo lớp mới
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Chưa có lớp học nào</h3>
            <p className="text-muted-foreground mb-4">Tạo lớp học đầu tiên để bắt đầu quản lý học viên</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo lớp học
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{classItem.name_vi}</CardTitle>
                    <p className="text-sm text-muted-foreground">{classItem.name}</p>
                  </div>
                  <Badge className={classItem.is_active ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}>
                    {classItem.is_active ? 'Đang hoạt động' : 'Đã kết thúc'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {classItem.courses && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Khóa học:</span>{' '}
                    <span className="font-medium">{classItem.courses.title_vi}</span>
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{classItem.student_count}/{classItem.max_students}</span>
                  </div>
                  {classItem.start_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{format(new Date(classItem.start_date), 'dd/MM/yyyy', { locale: vi })}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openStudentsDialog(classItem)}>
                    <Eye className="w-4 h-4 mr-1" />
                    Học viên
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(classItem)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Sửa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Class Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Chỉnh sửa lớp học' : 'Tạo lớp học mới'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên lớp (Tiếng Anh)</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Class name"
                />
              </div>
              <div className="space-y-2">
                <Label>Tên lớp (Tiếng Việt)</Label>
                <Input
                  value={formData.name_vi}
                  onChange={(e) => setFormData({ ...formData, name_vi: e.target.value })}
                  placeholder="Tên lớp học"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Khóa học liên kết</Label>
              <Select 
                value={formData.course_id || 'none'} 
                onValueChange={(value) => setFormData({ ...formData, course_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khóa học (không bắt buộc)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không liên kết</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title_vi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mô tả (Tiếng Anh)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Class description"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả (Tiếng Việt)</Label>
                <Textarea
                  value={formData.description_vi}
                  onChange={(e) => setFormData({ ...formData, description_vi: e.target.value })}
                  placeholder="Mô tả lớp học"
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sĩ số tối đa</Label>
                <Input
                  type="number"
                  value={formData.max_students}
                  onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) || 30 })}
                  min={1}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày kết thúc</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit}>{editingClass ? 'Cập nhật' : 'Tạo lớp'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Students Dialog */}
      <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Học viên - {selectedClass?.name_vi}</span>
              <Button size="sm" onClick={openAddStudentDialog}>
                <UserPlus className="w-4 h-4 mr-1" />
                Thêm học viên
              </Button>
            </DialogTitle>
          </DialogHeader>

          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có học viên nào trong lớp</p>
              <Button variant="outline" className="mt-4" onClick={openAddStudentDialog}>
                <UserPlus className="w-4 h-4 mr-2" />
                Thêm học viên đầu tiên
              </Button>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học viên</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Streak</TableHead>
                    <TableHead>Bài học</TableHead>
                    <TableHead>Tiến độ hôm nay</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{student.profiles?.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(student.enrolled_at), 'dd/MM/yyyy', { locale: vi })}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">{student.progress?.total_xp || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span>{student.progress?.streak || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4 text-blue-500" />
                          <span>{student.progress?.lessons_completed || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress 
                            value={Math.min(100, ((student.progress?.daily_progress || 0) / (student.progress?.daily_goal || 50)) * 100)} 
                            className="h-2 flex-1"
                          />
                          <span className="text-xs text-muted-foreground">
                            {student.progress?.daily_progress || 0}/{student.progress?.daily_goal || 50}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={student.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}>
                          {student.status === 'active' ? 'Đang học' : student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openProgressDialog(student)}
                            title="Xem chi tiết"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveStudent(student.student_id)}
                            title="Xóa khỏi lớp"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsStudentsDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Thêm học viên vào lớp
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên..."
                value={searchUserTerm}
                onChange={(e) => setSearchUserTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Không tìm thấy học viên</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium">{user.full_name || 'Không có tên'}</span>
                    </div>
                    <Button size="sm" onClick={() => handleAddStudent(user.user_id)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Thêm
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddStudentDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Progress Dialog */}
      <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Tiến độ học tập
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedStudent.profiles?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Tham gia: {format(new Date(selectedStudent.enrolled_at), 'dd/MM/yyyy', { locale: vi })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">Tổng XP</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedStudent.progress?.total_xp || 0}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="text-sm text-muted-foreground">Streak</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedStudent.progress?.streak || 0} ngày</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Bài học</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedStudent.progress?.lessons_completed || 0}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-5 h-5 text-purple-500" />
                      <span className="text-sm text-muted-foreground">Từ vựng</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedStudent.progress?.vocabulary_mastered || 0}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-muted-foreground">Tiến độ hôm nay</span>
                    </div>
                    <span className="text-sm font-medium">
                      {selectedStudent.progress?.daily_progress || 0} / {selectedStudent.progress?.daily_goal || 50} XP
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, ((selectedStudent.progress?.daily_progress || 0) / (selectedStudent.progress?.daily_goal || 50)) * 100)} 
                    className="h-3"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsProgressDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherClasses;

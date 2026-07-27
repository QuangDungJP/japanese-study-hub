import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Plus, Edit, Eye, Calendar, UserPlus, Trash2, 
  BookOpen, Star, Trophy, TrendingUp, Search, X,
  GraduationCap, Target, Flame, ArrowLeft, Video, Clock,
  FileText, CheckCircle2, MessageSquare, Play
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// New imports
import { formatWithJST, formatTimeWithJST } from '@/lib/dateUtils';
import { ExamManager } from '@/components/calendar/ExamManager';
import { ClassLessonPresentation } from '@/components/teacher/ClassLessonPresentation';
import LessonEditor from '@/components/teacher/LessonEditor';

interface ClassData {
  id: string;
  name: string;
  name_vi: string;
  description: string | null;
  description_vi: string | null;
  teacher_id?: string | null;
  course_id: string | null;
  max_students: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
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

interface Lesson {
  id: string;
  title: string;
  title_vi: string;
  description_vi?: string | null;
  skill: string;
  level: string;
  duration_minutes: number;
  xp_reward: number;
  is_published: boolean;
  class_id?: string | null;
  content_html?: string | null;
}

interface UnassignedLesson {
  id: string;
  title_vi: string;
}

interface ClassSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string | null;
  topic: string | null;
  meet_link: string | null;
  status: string;
}

interface Submission {
  id: string;
  user_id: string;
  exercise_id: string;
  content: string;
  score: number | null;
  feedback: string | null;
  status: string;
  submitted_at: string;
  exercise?: {
    title_vi: string;
    exercise_type: string;
    correct_answers: any;
  };
  lesson?: {
    title_vi: string;
  };
  profile?: {
    full_name: string;
  };
}

const TeacherClasses = () => {
  const { user, isAdmin } = useAuth();
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

  // --- GOOGLE CLASSROOM INTEGRATION STATE ---
  const [classDetailLessons, setClassDetailLessons] = useState<Lesson[]>([]);
  const [unassignedLessons, setUnassignedLessons] = useState<UnassignedLesson[]>([]);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);
  const [classSubmissions, setClassSubmissions] = useState<Submission[]>([]);
  
  // Link lesson dialog
  const [isLinkLessonOpen, setIsLinkLessonOpen] = useState(false);
  const [selectedLessonToLink, setSelectedLessonToLink] = useState('');

  // Create lesson dialog
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);

  // Present lesson state
  const [presentingLesson, setPresentingLesson] = useState<Lesson | null>(null);

  // Session dialog
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [sessionFormData, setSessionFormData] = useState({
    topic: '',
    session_date: '',
    start_time: '18:00',
    meet_link: ''
  });

  // Submission grading modal
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradingScore, setGradingScore] = useState('');
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [isGradingSubmitting, setIsGradingSubmitting] = useState(false);

  // Active tab for classroom detail view
  const [activeTab, setActiveTab] = useState('stream');

  useEffect(() => {
    if (user) {
      fetchClasses();
      fetchCourses();
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('classes')
        .select(`
          *,
          courses:course_id (title_vi)
        `);

      if (!isAdmin && user?.id) {
        query = query.eq('teacher_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

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
      const { data: existingStudents } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classId);

      const existingIds = existingStudents?.map(s => s.student_id) || [];

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'user');

      const userIds = userRoles?.map(r => r.user_id).filter(id => !existingIds.includes(id)) || [];

      if (userIds.length === 0) {
        setAvailableUsers([]);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      setAvailableUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  // Fetch Classroom detail tabs data
  const fetchClassroomDetails = async (clsId: string) => {
    try {
      // 1. Fetch lessons (linked to class or linked course)
      let lessonQuery = supabase.from('lessons').select('*');
      if (selectedClass?.course_id) {
        lessonQuery = lessonQuery.or(`class_id.eq.${clsId},course_id.eq.${selectedClass.course_id}`);
      } else {
        lessonQuery = lessonQuery.eq('class_id', clsId);
      }
      const { data: lessonsData } = await lessonQuery.order('created_at', { ascending: false });
      setClassDetailLessons(lessonsData || []);

      // 2. Fetch unassigned lessons
      let unassignedQuery = supabase
        .from('lessons')
        .select('id, title_vi')
        .is('class_id', null);

      if (!isAdmin && user?.id) {
        unassignedQuery = unassignedQuery.eq('teacher_id', user.id);
      }

      const { data: unassignedData } = await unassignedQuery;
      setUnassignedLessons(unassignedData || []);

      // 3. Fetch sessions
      const { data: sessionsData } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('class_id', clsId)
        .order('session_date', { ascending: true });
      setClassSessions(sessionsData || []);

      // 4. Fetch students
      fetchStudents(clsId);

      // 5. Fetch submissions
      fetchClassSubmissions(clsId);
    } catch (err) {
      console.error('Error fetching classroom details:', err);
    }
  };

  // Fetch submissions from students in this class for exercises of lessons in this class
  const fetchClassSubmissions = async (clsId: string) => {
    try {
      const { data: classStuds } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', clsId);
      
      if (!classStuds || classStuds.length === 0) {
        setClassSubmissions([]);
        return;
      }
      const studentIds = classStuds.map(s => s.student_id);

      const { data: classLes } = await supabase
        .from('lessons')
        .select('id')
        .eq('class_id', clsId);
        
      if (!classLes || classLes.length === 0) {
        setClassSubmissions([]);
        return;
      }
      const lessonIds = classLes.map(l => l.id);

      const { data: exercises } = await supabase
        .from('exercises')
        .select('id, title, title_vi, exercise_type, correct_answers, lesson_id')
        .in('lesson_id', lessonIds)
        .eq('requires_grading', true);

      if (!exercises || exercises.length === 0) {
        setClassSubmissions([]);
        return;
      }
      const exerciseIds = exercises.map(e => e.id);

      const { data: subsData, error } = await supabase
        .from('student_submissions')
        .select('*')
        .in('user_id', studentIds)
        .in('exercise_id', exerciseIds)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', studentIds);

      const { data: lessonsInfo } = await supabase
        .from('lessons')
        .select('id, title_vi')
        .in('id', lessonIds);

      const mapped: Submission[] = (subsData || []).map(sub => {
        const exercise = exercises.find(e => e.id === sub.exercise_id);
        const lesson = lessonsInfo?.find(l => l.id === exercise?.lesson_id);
        const profile = profiles?.find(p => p.user_id === sub.user_id);
        return {
          ...sub,
          exercise: exercise ? { title_vi: exercise.title_vi, exercise_type: exercise.exercise_type, correct_answers: exercise.correct_answers } : undefined,
          lesson: lesson ? { title_vi: lesson.title_vi } : undefined,
          profile: profile ? { full_name: profile.full_name || 'Học viên' } : undefined
        };
      }) as any;

      setClassSubmissions(mapped);
    } catch (err) {
      console.error('Error fetching class submissions:', err);
    }
  };

  const handleLinkLesson = async () => {
    if (!selectedLessonToLink || !selectedClass) return;
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ class_id: selectedClass.id })
        .eq('id', selectedLessonToLink);

      if (error) throw error;
      toast({ title: 'Thành công', description: 'Đã thêm bài học vào lớp' });
      setIsLinkLessonOpen(false);
      setSelectedLessonToLink('');
      fetchClassroomDetails(selectedClass.id);
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể thêm bài học', variant: 'destructive' });
    }
  };

  const handleUnlinkLesson = async (lessonId: string) => {
    if (!selectedClass || !confirm('Bạn có chắc muốn gỡ bài học này khỏi lớp?')) return;
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ class_id: null })
        .eq('id', lessonId);

      if (error) throw error;
      toast({ title: 'Thành công', description: 'Đã gỡ bài học khỏi lớp' });
      fetchClassroomDetails(selectedClass.id);
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể gỡ bài học', variant: 'destructive' });
    }
  };

  const handleCreateLessonSubmit = async (formData: any) => {
    try {
      const lessonData = {
        ...formData,
        teacher_id: user?.id,
        class_id: selectedClass?.id,
        language: 'japanese',
        is_published: true
      };

      const { error } = await supabase
        .from('lessons')
        .insert(lessonData);

      if (error) throw error;
      toast({ title: 'Thành công', description: 'Đã tạo bài học mới cho lớp' });
      setIsCreateLessonOpen(false);
      if (selectedClass) fetchClassroomDetails(selectedClass.id);
    } catch (error: any) {
      console.error('Error saving lesson:', error);
      toast({ 
        title: 'Lỗi', 
        description: error.message || 'Không thể lưu bài học', 
        variant: 'destructive' 
      });
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
        name: formData.name || formData.name_vi || 'Class',
        name_vi: formData.name_vi,
        teacher_id: editingClass?.teacher_id || user?.id,
        course_id: formData.course_id === 'none' || !formData.course_id ? null : formData.course_id,
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

  const handleCreateSession = async () => {
    if (!selectedClass) return;
    try {
      const { error } = await supabase
        .from('class_sessions')
        .insert({
          class_id: selectedClass.id,
          topic: sessionFormData.topic,
          session_date: sessionFormData.session_date,
          start_time: sessionFormData.start_time,
          meet_link: sessionFormData.meet_link || null,
          status: 'scheduled'
        });

      if (error) throw error;
      toast({ title: 'Thành công', description: 'Đã tạo lịch học Zoom mới' });
      setIsSessionDialogOpen(false);
      setSessionFormData({ topic: '', session_date: '', start_time: '18:00', meet_link: '' });
      fetchClassroomDetails(selectedClass.id);
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể tạo lịch học', variant: 'destructive' });
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !selectedClass) return;
    const scoreNum = parseInt(gradingScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast({ title: 'Lỗi', description: 'Điểm phải từ 0 đến 100', variant: 'destructive' });
      return;
    }
    try {
      setIsGradingSubmitting(true);
      const { error } = await supabase
        .from('student_submissions')
        .update({
          score: scoreNum,
          feedback: gradingFeedback.trim() || null,
          status: 'graded',
          graded_at: new Date().toISOString(),
          graded_by: user?.id
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      // Send notification
      await supabase.from('notifications').insert({
        user_id: selectedSubmission.user_id,
        title: 'Bài nộp đã được chấm',
        message: `Bài "${selectedSubmission.exercise?.title_vi || 'Bài tập'}" đã được chấm: ${scoreNum}/100`,
        type: scoreNum >= 80 ? 'success' : scoreNum >= 50 ? 'info' : 'warning',
        link: '/learn/achievements'
      });

      toast({ title: 'Thành công', description: 'Đã chấm bài thành công' });
      setSelectedSubmission(null);
      fetchClassroomDetails(selectedClass.id);
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể lưu điểm chấm', variant: 'destructive' });
    } finally {
      setIsGradingSubmitting(false);
    }
  };

  const openEditDialog = (classItem: ClassData) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name || '',
      name_vi: classItem.name_vi || '',
      description: classItem.description || '',
      description_vi: classItem.description_vi || '',
      course_id: classItem.course_id || 'none',
      max_students: classItem.max_students || 30,
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
      course_id: 'none',
      max_students: 30,
      start_date: '',
      end_date: ''
    });
  };

  const filteredUsers = availableUsers.filter(u => 
    !searchUserTerm || u.full_name?.toLowerCase().includes(searchUserTerm.toLowerCase())
  );

  const getSkillLabel = (skill: string) => {
    const labels: Record<string, string> = {
      reading: 'Đọc hiểu',
      listening: 'Nghe',
      speaking: 'Nói',
      writing: 'Viết',
      vocabulary: 'Từ vựng',
      grammar: 'Ngữ pháp',
    };
    return labels[skill] || skill;
  };

  // --- 1. CLASS LIST DASHBOARD ---
  if (!selectedClass) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản lý lớp học</h1>
            <p className="text-muted-foreground mt-1">Tạo và quản lý các lớp học giảng dạy của bạn</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <Card key={classItem.id} className="hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden border border-border">
                <div className="h-1.5 bg-primary w-full" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-lg font-bold line-clamp-1">{classItem.name_vi}</CardTitle>
                      <p className="text-sm text-muted-foreground">{classItem.name}</p>
                    </div>
                    <Badge className={classItem.is_active ? 'bg-green-500/10 text-green-600 border-green-200' : 'bg-muted text-muted-foreground'}>
                      {classItem.is_active ? 'Đang hoạt động' : 'Đã kết thúc'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4 flex-1 space-y-3">
                  {classItem.courses && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Khóa học:</span>{' '}
                      <span className="font-semibold text-foreground">{classItem.courses.title_vi}</span>
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{classItem.student_count}/{classItem.max_students} học viên</span>
                    </div>
                  </div>
                  {classItem.start_date && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Bắt đầu: {formatWithJST(classItem.start_date, false)}</span>
                    </div>
                  )}
                </CardContent>
                <div className="p-4 bg-muted/30 border-t flex justify-between gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(classItem)}>
                    <Edit className="w-3.5 h-3.5 mr-1" /> Sửa thông tin
                  </Button>
                  <Button size="sm" onClick={() => { setSelectedClass(classItem); fetchClassroomDetails(classItem.id); }}>
                    Vào lớp học →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- 2. CLASSROOM DETAIL VIEW (Google Classroom style) ---
  return (
    <div className="space-y-6">
      {/* Class Switcher Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedClass(null)}
            className="gap-1.5 font-bold border-primary/30 text-primary hover:bg-primary/10 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> Tất cả lớp học
          </Button>
          <div className="h-6 w-px bg-border hidden sm:block shrink-0" />
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <Label className="text-xs text-muted-foreground block mb-1 font-medium">Đang chọn Lớp học (Google Classroom)</Label>
            <Select 
              value={selectedClass.id} 
              onValueChange={(classId) => {
                const found = classes.find(c => c.id === classId);
                if (found) {
                  setSelectedClass(found);
                  fetchClassroomDetails(found.id);
                }
              }}
            >
              <SelectTrigger className="w-full max-w-md font-bold text-base h-10 border-primary/30">
                <SelectValue placeholder="Chọn lớp..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name_vi} ({cls.student_count || 0} học viên)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => openEditDialog(selectedClass)}>
            <Edit className="w-4 h-4 mr-1.5" /> Sửa lớp này
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Tạo lớp mới
          </Button>
        </div>
      </div>

      {/* Classroom Banner Card */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/90 to-accent/90 p-6 md:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full -mr-12 -mt-12 blur-lg pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{selectedClass.name_vi}</h1>
            <p className="text-white/80 font-medium text-sm md:text-base">{selectedClass.name}</p>
          </div>
          <p className="text-white/70 text-sm max-w-2xl line-clamp-2">
            {selectedClass.description_vi || 'Lớp học trực quan, tương tác cao với học viên.'}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm pt-2 text-white/90">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
              <Users className="w-4 h-4" />
              Sĩ số: {selectedClass.student_count}/{selectedClass.max_students}
            </span>
            {selectedClass.start_date && (
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                <Calendar className="w-4 h-4" />
                Bắt đầu: {formatWithJST(selectedClass.start_date, false)}
              </span>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl w-full md:w-auto grid grid-cols-5">
          <TabsTrigger value="stream" className="rounded-lg text-xs md:text-sm font-semibold">Bảng tin</TabsTrigger>
          <TabsTrigger value="lessons" className="rounded-lg text-xs md:text-sm font-semibold">Bài học</TabsTrigger>
          <TabsTrigger value="exams" className="rounded-lg text-xs md:text-sm font-semibold">Bài kiểm tra</TabsTrigger>
          <TabsTrigger value="submissions" className="rounded-lg text-xs md:text-sm font-semibold">Chấm bài</TabsTrigger>
          <TabsTrigger value="students" className="rounded-lg text-xs md:text-sm font-semibold">Học viên</TabsTrigger>
        </TabsList>

        {/* Tab 1: Stream (Bảng tin) */}
        <TabsContent value="stream" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lịch dạy Zoom */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" /> Lịch Zoom lớp học
                </h2>
                <Button size="sm" onClick={() => setIsSessionDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Lên lịch dạy
                </Button>
              </div>

              {classSessions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground text-sm">
                    Lớp học chưa được lên lịch dạy Zoom trực tuyến nào.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {classSessions.map((session) => (
                    <Card key={session.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm md:text-base text-foreground">
                            {session.topic || 'Buổi học Zoom trực tiếp'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatWithJST(session.session_date, false)}
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTimeWithJST(session.start_time)}
                            </span>
                          </div>
                        </div>
                        {session.meet_link ? (
                          <Button size="sm" variant="outline" className="gap-1.5 shrink-0 w-full md:w-auto" asChild>
                            <a href={session.meet_link} target="_blank" rel="noopener noreferrer">
                              <Video className="w-4 h-4 text-primary" /> Vào phòng học Zoom
                            </a>
                          </Button>
                        ) : (
                          <Badge variant="outline">Chưa gắn link</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Thông tin nhanh lớp */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mô tả lớp học</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Tên hiển thị tiếng Anh</span>
                    <span className="font-semibold">{selectedClass.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Mô tả chi tiết</span>
                    <span className="text-foreground">{selectedClass.description_vi || 'Không có mô tả.'}</span>
                  </div>
                  {selectedClass.end_date && (
                    <div>
                      <span className="text-muted-foreground block text-xs">Ngày kết thúc</span>
                      <span>{formatWithJST(selectedClass.end_date, false)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Lessons (Bài học) */}
        <TabsContent value="lessons" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground">Bài giảng & Tài liệu lớp học</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsLinkLessonOpen(true)}>
                Gán bài học có sẵn
              </Button>
              <Button size="sm" onClick={() => setIsCreateLessonOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Tạo bài mới cho lớp
              </Button>
            </div>
          </div>

          {classDetailLessons.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                Lớp học chưa có tài liệu hay bài giảng nào. Hãy nhấn Tạo bài mới hoặc Gán bài học có sẵn!
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classDetailLessons.map((lesson) => (
                <Card key={lesson.id} className="hover:shadow-md transition-all duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex gap-2 items-center">
                        <Badge className="bg-primary/10 text-primary uppercase text-xs">
                          {getSkillLabel(lesson.skill)}
                        </Badge>
                        <Badge variant="outline">{lesson.level}</Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive h-8 w-8 hover:bg-destructive/10" 
                        onClick={() => handleUnlinkLesson(lesson.id)}
                        title="Gỡ khỏi lớp"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-base font-bold pt-2">{lesson.title_vi}</CardTitle>
                    <CardDescription className="text-xs line-clamp-1">{lesson.title}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4 flex justify-between items-center text-xs text-muted-foreground border-t pt-3">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {lesson.duration_minutes} phút</span>
                    <Button size="sm" className="gap-1.5" variant="hero" onClick={() => setPresentingLesson(lesson)}>
                      <Play className="w-3.5 h-3.5 fill-current" /> Trình chiếu
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Exams (Bài kiểm tra) */}
        <TabsContent value="exams" className="space-y-4">
          <ExamManager classId={selectedClass.id} />
        </TabsContent>

        {/* Tab 4: Submissions (Chấm bài) */}
        <TabsContent value="submissions" className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Chấm điểm bài làm của học viên thuộc lớp</h2>
          
          {classSubmissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                Học viên trong lớp chưa nộp bài tập nào chờ chấm.
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-xl overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học viên</TableHead>
                    <TableHead>Bài tập</TableHead>
                    <TableHead>Bài học</TableHead>
                    <TableHead>Điểm số</TableHead>
                    <TableHead>Thời gian nộp</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classSubmissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-semibold text-foreground">{sub.profile?.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="mr-2">
                          {sub.exercise?.exercise_type === 'quiz' ? 'Trắc nghiệm' : 'Bài viết'}
                        </Badge>
                        {sub.exercise?.title_vi}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{sub.lesson?.title_vi}</TableCell>
                      <TableCell>
                        {sub.score !== null ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-200">
                            {sub.score}/100
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
                            Chờ chấm
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatWithJST(sub.submitted_at, true)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant={sub.status === 'pending' ? 'default' : 'ghost'}
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setGradingScore(sub.score?.toString() || '');
                            setGradingFeedback(sub.feedback || '');
                          }}
                        >
                          {sub.status === 'pending' ? 'Chấm bài' : 'Xem & sửa'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Tab 5: Students (Học viên) */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground">Học viên của lớp ({students.length})</h2>
            <Button size="sm" onClick={openAddStudentDialog}>
              <UserPlus className="w-4 h-4 mr-1.5" /> Thêm học viên
            </Button>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có học viên nào trong lớp. Hãy nhấn Thêm học viên để đưa học viên vào lớp.</p>
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học viên</TableHead>
                    <TableHead>XP tích lũy</TableHead>
                    <TableHead>Streak học tập</TableHead>
                    <TableHead>Số bài học</TableHead>
                    <TableHead>Tiến độ hôm nay</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{student.profiles?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Gia nhập: {formatWithJST(student.enrolled_at, false)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-yellow-600">
                        {student.progress?.total_xp || 0} XP
                      </TableCell>
                      <TableCell className="font-bold text-orange-500">
                        🔥 {student.progress?.streak || 0} ngày
                      </TableCell>
                      <TableCell>{student.progress?.lessons_completed || 0} bài</TableCell>
                      <TableCell className="min-w-[120px]">
                        <div className="flex items-center gap-2">
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
                        <Badge className="bg-green-500/10 text-green-600">Đang học</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openProgressDialog(student)}>
                            <TrendingUp className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemoveStudent(student.student_id)}>
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
        </TabsContent>
      </Tabs>

      {/* Presentation Mode overlay */}
      <ClassLessonPresentation 
        lesson={presentingLesson}
        isOpen={!!presentingLesson}
        onClose={() => setPresentingLesson(null)}
      />

      {/* Dialogue Link Lesson */}
      <Dialog open={isLinkLessonOpen} onOpenChange={setIsLinkLessonOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gán bài giảng có sẵn vào lớp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Chọn bài giảng</Label>
              <Select value={selectedLessonToLink} onValueChange={setSelectedLessonToLink}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn bài học..." />
                </SelectTrigger>
                <SelectContent>
                  {unassignedLessons.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.title_vi}
                    </SelectItem>
                  ))}
                  {unassignedLessons.length === 0 && (
                    <SelectItem value="none" disabled>Không có bài giảng rảnh nào</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsLinkLessonOpen(false)}>Hủy</Button>
            <Button onClick={handleLinkLesson} disabled={!selectedLessonToLink}>Xác nhận gán</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create new session/schedule dialouge */}
      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lên lịch giảng dạy Zoom</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <Label>Chủ đề / Bài giảng</Label>
              <Input 
                value={sessionFormData.topic} 
                onChange={(e) => setSessionFormData({ ...sessionFormData, topic: e.target.value })}
                placeholder="Ví dụ: Luyện từ vựng N5 bài 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Ngày học</Label>
                <Input 
                  type="date"
                  value={sessionFormData.session_date} 
                  onChange={(e) => setSessionFormData({ ...sessionFormData, session_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Giờ học (VN)</Label>
                <Input 
                  type="time"
                  value={sessionFormData.start_time} 
                  onChange={(e) => setSessionFormData({ ...sessionFormData, start_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Link phòng học Zoom</Label>
              <Input 
                value={sessionFormData.meet_link} 
                onChange={(e) => setSessionFormData({ ...sessionFormData, meet_link: e.target.value })}
                placeholder="https://zoom.us/j/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSessionDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateSession} disabled={!sessionFormData.topic || !sessionFormData.session_date}>Xác nhận lên lịch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create lesson dialog */}
      <Dialog open={isCreateLessonOpen} onOpenChange={setIsCreateLessonOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-6">
          <DialogHeader className="sr-only">
            <DialogTitle>Tạo bài học mới cho lớp</DialogTitle>
          </DialogHeader>
          <LessonEditor
            onSubmit={handleCreateLessonSubmit}
            onCancel={() => setIsCreateLessonOpen(false)}
            isEditing={false}
          />
        </DialogContent>
      </Dialog>

      {/* Grading Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chấm điểm bài tập học viên</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-lg border">
                <div>
                  <span className="text-muted-foreground block text-xs">Học viên</span>
                  <span className="font-semibold text-foreground">{selectedSubmission.profile?.full_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Bài học</span>
                  <span className="font-semibold text-foreground">{selectedSubmission.lesson?.title_vi}</span>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 whitespace-pre-wrap text-sm">
                <strong>Nội dung bài làm học viên:</strong>
                <p className="mt-1 bg-background p-2.5 rounded border leading-relaxed">{selectedSubmission.content}</p>
              </div>

              {selectedSubmission.exercise?.correct_answers && (
                <div className="bg-green-500/5 p-3 rounded-lg border border-green-500/20 text-sm">
                  <strong className="text-green-700">Đáp án tham khảo:</strong>
                  <p className="mt-1 italic text-muted-foreground">{selectedSubmission.exercise.correct_answers}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Điểm số (0-100)</Label>
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    value={gradingScore}
                    onChange={(e) => setGradingScore(e.target.value)}
                    placeholder="Nhập điểm..."
                  />
                </div>
                <div className="space-y-1">
                  <Label>Phản hồi / Nhận xét</Label>
                  <Textarea 
                    value={gradingFeedback}
                    onChange={(e) => setGradingFeedback(e.target.value)}
                    placeholder="Viết nhận xét..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedSubmission(null)}>Hủy</Button>
            <Button onClick={handleGradeSubmission} disabled={isGradingSubmitting || !gradingScore}>
              {isGradingSubmitting ? 'Đang lưu...' : 'Lưu điểm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Progress Dialog */}
      {/* Create/Edit Class Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Chỉnh sửa lớp học' : 'Tạo lớp học mới'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên lớp (Tiếng Anh - Không bắt buộc)</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tự động lấy tên tiếng Việt nếu trống"
                />
              </div>
              <div className="space-y-2">
                <Label>Tên lớp học (Tiếng Việt)</Label>
                <Input
                  value={formData.name_vi}
                  onChange={(e) => setFormData({ ...formData, name_vi: e.target.value })}
                  placeholder="Ví dụ: Lớp N5 Căn Bản T2-T4-T6"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Khóa học liên kết</Label>
              <Select 
                value={formData.course_id} 
                onValueChange={(value) => setFormData({ ...formData, course_id: value })}
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
                    Tham gia: {formatWithJST(selectedStudent.enrolled_at, false)}
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

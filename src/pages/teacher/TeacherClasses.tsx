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
  FileText, CheckCircle2, MessageSquare, Play, Upload, Sparkles
} from 'lucide-react';
import ClassroomChat from '@/components/classroom/ClassroomChat';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// New imports
import { formatWithJST, formatTimeWithJST } from '@/lib/dateUtils';
import { exportToGoogleSheetsCSV } from '@/lib/exportUtils';
import { ExamManager } from '@/components/calendar/ExamManager';
import { InlineLessonPresentation } from '@/components/teacher/InlineLessonPresentation';
import LessonEditor from '@/components/teacher/LessonEditor';
import ClassLessonOrganizer from '@/components/teacher/ClassLessonOrganizer';
import AttendanceManager from '@/components/teacher/AttendanceManager';
import TeacherTimesheet from '@/components/teacher/TeacherTimesheet';
import SessionVideoPlayer from '@/components/shared/SessionVideoPlayer';
import MediaUploader from '@/components/shared/MediaUploader';

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
  cover_image_url?: string | null;
  thumbnail_url?: string | null;
  is_active: boolean;
  created_at: string;
  student_count?: number;
  courses?: { title_vi: string };
  total_sessions?: number | null;
  custom_fields?: { total_sessions?: number } | null;
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
  notes: string | null;
  record_url?: string | null;
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
    total_sessions: 24,
    start_date: '',
    end_date: '',
    cover_image_url: ''
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

  // Present lesson state (inline in the lessons tab)
  const [inlinePresentingLessonId, setInlinePresentingLessonId] = useState<string | null>(null);
  const [presentingLesson, setPresentingLesson] = useState<Lesson | null>(null);

  // Edit lesson state
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isEditLessonOpen, setIsEditLessonOpen] = useState(false);

  // Session dialog & record player
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);
  const [sessionFormData, setSessionFormData] = useState({
    topic: '',
    session_date: '',
    start_time: '18:00',
    meet_link: '',
    notes: '',
    record_url: ''
  });
  const [uploadingRecord, setUploadingRecord] = useState(false);
  const [playingVideoRecord, setPlayingVideoRecord] = useState<{ url: string; title: string } | null>(null);

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

      setClasses(classesWithCounts as any);
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
              .maybeSingle(),
            supabase
              .from('user_progress')
              .select('total_xp, streak, lessons_completed, vocabulary_mastered, daily_progress, daily_goal')
              .eq('user_id', student.student_id)
              .maybeSingle()
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

      let exercises: any[] = [];
      try {
        const { data: exData, error: exErr } = await supabase
          .from('exercises')
          .select('id, title, title_vi, exercise_type, lesson_id')
          .in('lesson_id', lessonIds)
          .eq('requires_grading', true);

        if (exErr) {
          const { data: fallbackEx } = await supabase
            .from('exercises')
            .select('id, title, title_vi, exercise_type, lesson_id')
            .in('lesson_id', lessonIds);
          exercises = fallbackEx || [];
        } else {
          exercises = exData || [];
        }
      } catch (err) {
        console.warn('Fallback exercises query', err);
      }

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
      let contentHtml = formData.content_html || '';
      if (formData.slide_url && !contentHtml.includes(formData.slide_url)) {
        contentHtml += `\n<div class="slide-link my-3 bg-primary/5 p-3 rounded-lg border border-primary/20"><a href="${formData.slide_url}" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">🔗 Slide trình chiếu: ${formData.slide_url}</a></div>`;
      }
      if (formData.document_url && !contentHtml.includes(formData.document_url)) {
        const docName = formData.document_url.split('/').pop() || 'Tài liệu đính kèm';
        contentHtml += `\n<div class="doc-link my-3 bg-blue-500/5 p-3 rounded-lg border border-blue-500/20"><a href="${formData.document_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-bold hover:underline">📄 File PDF/Tài liệu đính kèm: ${docName}</a></div>`;
      }

      const lessonData: any = {
        ...formData,
        content_html: contentHtml,
        teacher_id: user?.id,
        class_id: selectedClass?.id,
        language: 'japanese',
        is_published: true,
        week_number: formData.week_number || null,
        session_number: formData.session_number || null,
        order_index: formData.order_index || 1,
      };

      // Try inserting with full payload
      let { error } = await supabase
        .from('lessons')
        .insert(lessonData);

      // Fallback retry if schema cache doesn't have newer columns yet
      if (error && (error.message?.includes('document_url') || error.message?.includes('slide_url') || error.message?.includes('week_number') || error.message?.includes('schema cache'))) {
        const safeData = { ...lessonData };
        delete safeData.document_url;
        delete safeData.slide_url;
        delete safeData.week_number;
        delete safeData.session_number;
        const retryResult = await supabase
          .from('lessons')
          .insert(safeData);
        error = retryResult.error;
      }

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

  const handleEditLessonSubmit = async (formData: any) => {
    if (!editingLesson || !selectedClass) return;
    try {
      const lessonData: any = {
        title: formData.title || formData.title_vi,
        title_vi: formData.title_vi,
        description: formData.description || formData.description_vi,
        description_vi: formData.description_vi,
        skill: formData.skill,
        level: formData.level,
        duration_minutes: formData.duration_minutes,
        xp_reward: formData.xp_reward,
        content_html: formData.content_html,
        thumbnail_url: formData.thumbnail_url || null,
        video_url: formData.video_url || null,
        slide_url: formData.slide_url || null,
        document_url: formData.document_url || null,
        week_number: formData.week_number || null,
        session_number: formData.session_number || null,
        order_index: formData.order_index || 1,
      };

      let { error } = await supabase
        .from('lessons')
        .update(lessonData)
        .eq('id', editingLesson.id);

      if (error && (error.message?.includes('document_url') || error.message?.includes('slide_url') || error.message?.includes('week_number'))) {
        const safeData = { ...lessonData };
        delete safeData.document_url;
        delete safeData.slide_url;
        delete safeData.week_number;
        delete safeData.session_number;
        const retry = await supabase.from('lessons').update(safeData).eq('id', editingLesson.id);
        error = retry.error;
      }

      if (error) throw error;
      toast({ title: 'Thành công', description: 'Đã cập nhật bài học' });
      setIsEditLessonOpen(false);
      setEditingLesson(null);
      fetchClassroomDetails(selectedClass.id);
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message || 'Không thể cập nhật bài học', variant: 'destructive' });
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
        cover_image_url: formData.cover_image_url || null,
        thumbnail_url: formData.cover_image_url || null,
        is_active: true
      };

      if (editingClass) {
        const { error } = await supabase
          .from('classes')
          .update(classData as any)
          .eq('id', editingClass.id);

        if (error) throw error;
        toast({ title: 'Thành công', description: 'Đã cập nhật lớp học' });
      } else {
        const { data: createdClasses, error } = await supabase
          .from('classes')
          .insert(classData as any)
          .select('*');

        if (error) throw error;
        toast({ title: '🎉 Thành công', description: 'Đã tạo lớp học mới!' });

        const newClass = createdClasses?.[0];
        if (newClass) {
          const fullNewClass = { ...newClass, student_count: 0 } as any;
          // Show it instantly in the list without waiting for the refetch
          setClasses(prev => [fullNewClass, ...prev]);
          if (selectedClass) {
            setSelectedClass(fullNewClass);
            fetchClassroomDetails(newClass.id);
          }
        }
      }

      setIsDialogOpen(false);
      setFormData({
        name: '',
        name_vi: '',
        description: '',
        description_vi: '',
        course_id: '',
        max_students: 30,
        total_sessions: 24,
        start_date: '',
        end_date: '',
        cover_image_url: ''
      });
      setEditingClass(null);
      await fetchClasses();
    } catch (error: any) {
      console.error('Error saving class:', error);
      toast({ 
        title: 'Lỗi', 
        description: error.message || 'Không thể lưu lớp học', 
        variant: 'destructive' 
      });
    }
  };

  const openCreateSessionDialog = () => {
    setEditingSession(null);
    setSessionFormData({ topic: '', session_date: '', start_time: '18:00', meet_link: '', notes: '', record_url: '' });
    setIsSessionDialogOpen(true);
  };

  const openEditSessionDialog = (session: ClassSession) => {
    setEditingSession(session);
    let recUrl = session.record_url || '';
    if (!recUrl && session.notes) {
      const match = session.notes.match(/\[RECORD_URL:\s*([^\s\]]+)\]/i);
      if (match) recUrl = match[1];
    }
    setSessionFormData({
      topic: session.topic || '',
      session_date: session.session_date,
      start_time: session.start_time,
      meet_link: session.meet_link || '',
      notes: session.notes ? session.notes.replace(/\[RECORD_URL:\s*[^\s\]]+\]/gi, '').trim() : '',
      record_url: recUrl
    });
    setIsSessionDialogOpen(true);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!selectedClass) return;
    if (!confirm('Bạn có chắc muốn XÓA buổi học này? Thao tác này không thể hoàn tác.')) return;
    try {
      const { error } = await supabase
        .from('class_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast({ title: 'Thành công', description: 'Đã xóa buổi học' });
      setIsSessionDialogOpen(false);
      setEditingSession(null);
      fetchClassroomDetails(selectedClass.id);
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message || 'Không thể xóa buổi học', variant: 'destructive' });
    }
  };

  const handleUploadSessionRecord = async (file: File) => {
    try {
      setUploadingRecord(true);
      const cleanName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `recordings/${Date.now()}_${cleanName}`;

      const { error } = await supabase.storage
        .from('lesson-assets')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('lesson-assets')
        .getPublicUrl(filePath);

      setSessionFormData(prev => ({ ...prev, record_url: publicUrl }));
      toast({ title: 'Thành công', description: 'Đã tải video record lên thành công!' });
    } catch (err: any) {
      toast({ title: 'Lỗi upload', description: err.message || 'Không thể upload video', variant: 'destructive' });
    } finally {
      setUploadingRecord(false);
    }
  };

  const handleCreateSession = async () => {
    if (!selectedClass) return;
    try {
      const payload: any = {
        class_id: selectedClass.id,
        topic: sessionFormData.topic,
        session_date: sessionFormData.session_date,
        start_time: sessionFormData.start_time,
        meet_link: sessionFormData.meet_link || null,
        notes: sessionFormData.notes || null,
        record_url: sessionFormData.record_url || null,
        status: 'scheduled'
      };

      let { error } = editingSession
        ? await supabase.from('class_sessions').update(payload).eq('id', editingSession.id)
        : await supabase.from('class_sessions').insert(payload);

      if (error && (error.message?.includes('record_url') || error.message?.includes('schema cache'))) {
        const safePayload = { ...payload };
        delete safePayload.record_url;
        if (sessionFormData.record_url) {
          safePayload.notes = (safePayload.notes ? safePayload.notes + '\n' : '') + `[RECORD_URL: ${sessionFormData.record_url}]`;
        }
        const retry = editingSession
          ? await supabase.from('class_sessions').update(safePayload).eq('id', editingSession.id)
          : await supabase.from('class_sessions').insert(safePayload);
        error = retry.error;
      }

      if (error) throw error;
      toast({ title: 'Thành công', description: editingSession ? 'Đã cập nhật buổi học' : 'Đã tạo buổi học mới' });
      setIsSessionDialogOpen(false);
      setEditingSession(null);
      setSessionFormData({ topic: '', session_date: '', start_time: '18:00', meet_link: '', notes: '', record_url: '' });
      fetchClassroomDetails(selectedClass.id);
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message || 'Không thể lưu buổi học', variant: 'destructive' });
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
      total_sessions: classItem.total_sessions || classItem.custom_fields?.total_sessions || 24,
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
      total_sessions: 24,
      start_date: '',
      end_date: '',
      cover_image_url: ''
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

  const classFormDialog = (
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
  
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  🖼️ Ảnh bìa lớp học (Cover Banner)
                </Label>
                <MediaUploader
                  value={formData.cover_image_url}
                  onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                  accept="image"
                  bucket="course-media"
                  placeholder="Tải ảnh bìa lớp học mới hoặc chọn từ Thư viện ảnh đã có"
                  aspectRatio="banner"
                />
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
  
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <Label>Tổng số buổi học</Label>
                  <Input
                    type="number"
                    value={formData.total_sessions}
                    onChange={(e) => setFormData({ ...formData, total_sessions: parseInt(e.target.value) || 24 })}
                    min={1}
                    max={200}
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
  );

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
              <Card key={classItem.id} className="hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden border border-border group">
                {classItem.cover_image_url || classItem.thumbnail_url ? (
                  <div className="h-36 w-full overflow-hidden bg-muted relative shrink-0">
                    <img
                      src={classItem.cover_image_url || classItem.thumbnail_url || ''}
                      alt={classItem.name_vi}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                    <Badge className={`absolute top-3 right-3 ${classItem.is_active ? 'bg-emerald-600 text-white font-bold' : 'bg-muted text-muted-foreground'}`}>
                      {classItem.is_active ? '🟢 Đang hoạt động' : '⚪ Đã kết thúc'}
                    </Badge>
                  </div>
                ) : (
                  <div className="h-2 bg-gradient-to-r from-primary via-indigo-500 to-purple-500 w-full" />
                )}
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-lg font-bold line-clamp-1">{classItem.name_vi}</CardTitle>
                      <p className="text-sm text-muted-foreground">{classItem.name}</p>
                    </div>
                    {!(classItem.cover_image_url || classItem.thumbnail_url) && (
                      <Badge className={classItem.is_active ? 'bg-green-500/10 text-green-600 border-green-200' : 'bg-muted text-muted-foreground'}>
                        {classItem.is_active ? 'Đang hoạt động' : 'Đã kết thúc'}
                      </Badge>
                    )}
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
                <div className="p-4 bg-muted/30 border-t flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(classItem)}>
                      <Edit className="w-3.5 h-3.5 mr-1" /> Sửa
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => {
                        setSelectedClass(classItem);
                        fetchClassroomDetails(classItem.id);
                        openAddStudentDialog();
                      }}
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1" /> Thêm HV
                    </Button>
                  </div>
                  <Button size="sm" onClick={() => { setSelectedClass(classItem); fetchClassroomDetails(classItem.id); }}>
                    Vào lớp →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {classFormDialog}
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
          <Button variant="hero" size="sm" onClick={openAddStudentDialog}>
            <UserPlus className="w-4 h-4 mr-1.5" /> Thêm học viên
          </Button>
          <Button variant="outline" size="sm" onClick={() => openEditDialog(selectedClass)}>
            <Edit className="w-4 h-4 mr-1.5" /> Sửa lớp này
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
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
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm font-semibold">
              <Clock className="w-4 h-4" />
              Tổng: {selectedClass.total_sessions || selectedClass.custom_fields?.total_sessions || 24} buổi học
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
        <TabsList className="bg-muted p-1 rounded-xl w-full md:w-auto flex flex-wrap gap-1">
          <TabsTrigger value="stream" className="rounded-lg text-xs md:text-sm font-semibold">Bảng tin</TabsTrigger>
          <TabsTrigger value="chat" className="rounded-lg text-xs md:text-sm font-bold text-amber-600 dark:text-amber-400 gap-1.5">
            💬 Thảo Luận Realtime
          </TabsTrigger>
          <TabsTrigger value="lessons" className="rounded-lg text-xs md:text-sm font-semibold">Bài học (Buổi/Tuần)</TabsTrigger>
          <TabsTrigger value="recordings" className="rounded-lg text-xs md:text-sm font-bold text-purple-600 dark:text-purple-400 gap-1.5">
            🎬 Record Buổi Học
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg text-xs md:text-sm font-semibold">Điểm danh học viên</TabsTrigger>
          <TabsTrigger value="timesheet" className="rounded-lg text-xs md:text-sm font-semibold">Chấm công & Thù lao</TabsTrigger>
          <TabsTrigger value="exams" className="rounded-lg text-xs md:text-sm font-semibold">Bài kiểm tra</TabsTrigger>
          <TabsTrigger value="submissions" className="rounded-lg text-xs md:text-sm font-semibold">Chấm bài</TabsTrigger>
          <TabsTrigger value="students" className="rounded-lg text-xs md:text-sm font-semibold">Học viên</TabsTrigger>
        </TabsList>

        {/* Tab Realtime Chat */}
        <TabsContent value="chat" className="space-y-6">
          <ClassroomChat classId={selectedClass.id} />
        </TabsContent>

        {/* Tab 1: Stream (Bảng tin) */}
        <TabsContent value="stream" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lịch dạy Meeting */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" /> Lịch Meeting lớp học
                </h2>
                <Button size="sm" onClick={openCreateSessionDialog}>
                  <Plus className="w-4 h-4 mr-1" /> Lên lịch dạy
                </Button>
              </div>

              {classSessions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground text-sm">
                    Lớp học chưa được lên lịch dạy Meeting trực tuyến nào.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {classSessions.map((session) => {
                    const recUrl = session.record_url || session.notes?.match(/\[RECORD_URL:\s*([^\s\]]+)\]/i)?.[1] || null;
                    const cleanNotes = session.notes ? session.notes.replace(/\[RECORD_URL:\s*[^\s\]]+\]/gi, '').trim() : '';

                    return (
                      <Card key={session.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1">
                            <p className="font-semibold text-sm md:text-base text-foreground">
                              {session.topic || 'Buổi học Meeting trực tiếp'}
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
                              {recUrl && (
                                <Badge className="bg-purple-500/10 text-purple-600 border-purple-200 text-xs font-bold gap-1">
                                  🎬 Đã có Record Video
                                </Badge>
                              )}
                            </div>
                            {cleanNotes && (
                              <p className="text-xs text-muted-foreground italic line-clamp-2">📝 {cleanNotes}</p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                            {recUrl && (
                              <Button
                                size="sm"
                                variant="default"
                                className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                                onClick={() => setPlayingVideoRecord({ url: recUrl, title: session.topic || 'Record Buổi Học' })}
                              >
                                <Play className="w-3.5 h-3.5 fill-current" /> Xem Record Video
                              </Button>
                            )}
                            {session.meet_link ? (
                              <Button size="sm" variant="outline" className="gap-1.5 border-primary/30 text-primary" asChild>
                                <a href={session.meet_link} target="_blank" rel="noopener noreferrer">
                                  <Video className="w-4 h-4 text-primary" /> Vào phòng Meeting
                                </a>
                              </Button>
                            ) : (
                              <Badge variant="outline">Chưa gắn link</Badge>
                            )}
                            <Button size="icon" variant="ghost" title="Sửa buổi học" onClick={() => openEditSessionDialog(session)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Xóa buổi học" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSession(session.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
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

        {/* Tab 2: Lessons (Bài học Buổi/Tuần) */}
        <TabsContent value="lessons" className="space-y-4">
          <div className="flex justify-end items-center gap-2 mb-2">
            <Button variant="outline" size="sm" onClick={() => setIsLinkLessonOpen(true)}>
              Gán bài học có sẵn
            </Button>
            <Button size="sm" onClick={() => setIsCreateLessonOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Tạo bài mới cho lớp
            </Button>
          </div>

          {selectedClass && (
            <ClassLessonOrganizer
              classId={selectedClass.id}
              className={selectedClass.name_vi}
              isTeacher={true}
              onRefreshNeeded={() => fetchClassroomDetails(selectedClass.id)}
            />
          )}
        </TabsContent>

        {/* Tab Recordings: Kho Video Record Buổi Học */}
        <TabsContent value="recordings" className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-600" /> Kho Video Record Ghi Hình Buổi Học ({classSessions.filter(s => s.record_url || s.notes?.match(/\[RECORD_URL:\s*([^\s\]]+)\]/i)).length})
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Quản lý và cập nhật video ghi hình bài giảng cho học viên xem lại sau mỗi buổi học
              </p>
            </div>
            <Button size="sm" onClick={openCreateSessionDialog} className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1">
              <Plus className="w-4 h-4" /> Thêm / Cập nhật Record Buổi Học
            </Button>
          </div>

          {(() => {
            const recordedSessions = classSessions.filter(
              s => s.record_url || s.notes?.match(/\[RECORD_URL:\s*([^\s\]]+)\]/i)
            );

            if (recordedSessions.length === 0) {
              return (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Video className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-50 animate-pulse" />
                    <h3 className="text-base font-bold text-foreground">Chưa có video record buổi học nào được đăng</h3>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                      Nhấn vào từng buổi học để upload hoặc dán đường dẫn link Google Drive / YouTube video record.
                    </p>
                    <Button size="sm" onClick={openCreateSessionDialog}>
                      <Plus className="w-4 h-4 mr-1" /> Lên lịch & Thêm Record Buổi Học
                    </Button>
                  </CardContent>
                </Card>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recordedSessions.map((session) => {
                  const recUrl = session.record_url || session.notes?.match(/\[RECORD_URL:\s*([^\s\]]+)\]/i)?.[1] || '';
                  const cleanNotes = session.notes ? session.notes.replace(/\[RECORD_URL:\s*[^\s\]]+\]/gi, '').trim() : '';

                  return (
                    <Card key={session.id} className="overflow-hidden border border-purple-500/20 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group bg-card">
                      <div>
                        {/* Header info */}
                        <div className="p-5 bg-gradient-to-r from-purple-500/10 via-card to-primary/5 border-b space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Badge className="bg-purple-600 text-white text-xs font-bold px-2.5 py-0.5">
                              🎬 Record Buổi Học
                            </Badge>
                            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatWithJST(session.session_date, false)}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-base text-foreground group-hover:text-purple-600 transition-colors line-clamp-2">
                            {session.topic || 'Video ghi hình buổi học trực tuyến'}
                          </h3>
                        </div>

                        {/* Body content & notes */}
                        <div className="p-5 space-y-3">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              Giờ học: {formatTimeWithJST(session.start_time)}
                            </span>
                          </div>
                          {cleanNotes && (
                            <p className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-xl border line-clamp-3">
                              📝 {cleanNotes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action play & edit buttons */}
                      <div className="p-4 bg-muted/30 border-t flex flex-wrap items-center justify-between gap-2">
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-bold gap-1"
                            onClick={() => openEditSessionDialog(session)}
                          >
                            <Edit className="w-3.5 h-3.5" /> Sửa Record
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-bold gap-1 text-destructive hover:bg-destructive/10 border-destructive/30"
                            onClick={() => handleDeleteSession(session.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          className="h-9 font-extrabold text-xs gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md"
                          onClick={() => setPlayingVideoRecord({ url: recUrl, title: session.topic || 'Record Buổi Học' })}
                        >
                          <Play className="w-4 h-4 fill-current" /> Phát Video →
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </TabsContent>

        {/* Tab 3: Attendance (Điểm danh học viên) */}
        <TabsContent value="attendance" className="space-y-4">
          <AttendanceManager />
        </TabsContent>

        {/* Tab 4: Timesheet (Chấm công & Thù lao) */}
        <TabsContent value="timesheet" className="space-y-4">
          <TeacherTimesheet teacherId={selectedClass.teacher_id} classId={selectedClass.id} />
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
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">Học viên của lớp ({students.length})</h2>
            <div className="flex gap-2">
              {students.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => {
                    if (!selectedClass) return;
                    const headers = ['Họ và tên học viên', 'Ngày tham gia', 'Tổng XP', 'Streak', 'Bài học đã xong', 'Từ vựng đã thuộc'];
                    const rows = students.map(s => [
                      s.profiles?.full_name || 'N/A',
                      formatWithJST(s.enrolled_at, false),
                      s.progress?.total_xp || 0,
                      s.progress?.streak || 0,
                      s.progress?.lessons_completed || 0,
                      s.progress?.vocabulary_mastered || 0,
                    ]);
                    exportToGoogleSheetsCSV(`Danh_Sach_Hoc_Vien_${selectedClass.name_vi}`, headers, rows);
                  }}
                >
                  📊 Xuất Google Sheets / Excel
                </Button>
              )}
              <Button size="sm" onClick={openAddStudentDialog}>
                <UserPlus className="w-4 h-4 mr-1.5" /> Thêm học viên
              </Button>
            </div>
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

      {/* Create/edit session/schedule dialogue */}
      <Dialog open={isSessionDialogOpen} onOpenChange={(open) => { setIsSessionDialogOpen(open); if (!open) setEditingSession(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {editingSession ? 'Chỉnh sửa buổi học' : 'Thêm / Lên lịch buổi học mới'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <Label className="font-semibold">Chủ đề / Tên buổi học</Label>
              <Input
                value={sessionFormData.topic}
                onChange={(e) => setSessionFormData({ ...sessionFormData, topic: e.target.value })}
                placeholder="Ví dụ: Luyện từ vựng Minna N4 Bài 31 + Kanji N3 Bài 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="font-semibold">Ngày học</Label>
                <Input
                  type="date"
                  value={sessionFormData.session_date}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, session_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Giờ học (VN)</Label>
                <Input
                  type="time"
                  value={sessionFormData.start_time}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, start_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="font-semibold">Link phòng học Meeting</Label>
              <Input
                value={sessionFormData.meet_link}
                onChange={(e) => setSessionFormData({ ...sessionFormData, meet_link: e.target.value })}
                placeholder="https://meet.google.com/qdd-rjdr-ggf"
              />
            </div>

            {/* Record Video URL & File Upload Section */}
            <div className="space-y-2 p-3 bg-purple-500/5 rounded-xl border border-purple-500/20">
              <Label className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-purple-600" /> Video Record Ghi Hình Sau Buổi Học
              </Label>
              <div className="space-y-2">
                <Input
                  value={sessionFormData.record_url}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, record_url: e.target.value })}
                  placeholder="Dán link Google Drive video, YouTube, Vimeo hoặc file MP4..."
                  className="bg-background"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="video/*"
                    disabled={uploadingRecord}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadSessionRecord(file);
                    }}
                    className="text-xs bg-background flex-1 cursor-pointer"
                  />
                  {uploadingRecord && (
                    <span className="text-xs text-purple-600 font-bold animate-pulse shrink-0">
                      Đang tải video...
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  💡 Học viên & Giáo viên có thể xem trực tiếp video record buổi học với đầy đủ tính năng tua video, chuyển tốc độ ngay trên website.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold">Ghi chú / tài liệu buổi học (tùy chọn)</Label>
              <Textarea
                value={sessionFormData.notes}
                onChange={(e) => setSessionFormData({ ...sessionFormData, notes: e.target.value })}
                placeholder="Ví dụ: link tài liệu, nội dung đã học, việc cần chuẩn bị cho buổi sau..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2">
            {editingSession ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleDeleteSession(editingSession.id)}
                className="mr-auto text-xs font-bold gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Xóa buổi học
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setIsSessionDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleCreateSession} disabled={!sessionFormData.topic || !sessionFormData.session_date}>
                {editingSession ? 'Lưu thay đổi' : 'Xác nhận thêm buổi học'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create lesson dialog */}
      <Dialog open={isCreateLessonOpen} onOpenChange={setIsCreateLessonOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
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

      {/* Edit Lesson Dialog */}
      <Dialog open={isEditLessonOpen} onOpenChange={(open) => { setIsEditLessonOpen(open); if (!open) setEditingLesson(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="sr-only">
            <DialogTitle>Chỉnh sửa bài học</DialogTitle>
          </DialogHeader>
          {editingLesson && (
            <LessonEditor
              initialData={{
                title: editingLesson.title || '',
                title_vi: editingLesson.title_vi || '',
                description: '',
                description_vi: editingLesson.description_vi || '',
                skill: editingLesson.skill || 'reading',
                level: editingLesson.level || 'N5',
                duration_minutes: editingLesson.duration_minutes || 15,
                xp_reward: editingLesson.xp_reward || 25,
                content_html: editingLesson.content_html || '',
                slide_url: (editingLesson as any).slide_url || '',
                document_url: (editingLesson as any).document_url || '',
              }}
              onSubmit={handleEditLessonSubmit}
              onCancel={() => { setIsEditLessonOpen(false); setEditingLesson(null); }}
              isEditing={true}
            />
          )}
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

      {/* Add Student Dialog */}
      <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Thêm học viên vào lớp {selectedClass?.name_vi}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm học viên theo tên..."
                value={searchUserTerm}
                onChange={(e) => setSearchUserTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="border rounded-xl p-2 max-h-64 overflow-y-auto space-y-1">
              {availableUsers
                .filter(u => !searchUserTerm || u.full_name?.toLowerCase().includes(searchUserTerm.toLowerCase()))
                .map(u => (
                  <div key={u.user_id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-semibold text-sm">{u.full_name || 'Học viên'}</p>
                      <p className="text-xs text-muted-foreground">{u.user_id.slice(0, 8)}...</p>
                    </div>
                    <Button size="sm" onClick={() => handleAddStudent(u.user_id)}>
                      Thêm vào lớp
                    </Button>
                  </div>
                ))}
              {availableUsers.length === 0 && (
                <p className="text-center py-6 text-xs text-muted-foreground">Tất cả học viên khả dụng đã ở trong lớp này.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddStudentDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Session Record Video Player Dialog */}
      {playingVideoRecord && (
        <SessionVideoPlayer
          videoUrl={playingVideoRecord.url}
          title={playingVideoRecord.title}
          isOpen={!!playingVideoRecord}
          onClose={() => setPlayingVideoRecord(null)}
        />
      )}

      {classFormDialog}
    </div>
  );
};

export default TeacherClasses;

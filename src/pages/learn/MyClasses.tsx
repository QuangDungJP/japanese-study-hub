import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Building, GraduationCap, Calendar, Video, Clock,
  BookOpen, FileText, CheckCircle2, MessageSquare, Star, ArrowLeft, UserX, AlertCircle,
  Play, ExternalLink, Download, Maximize2, Sparkles, Dumbbell, Trash2
} from 'lucide-react';
import { formatWithJST, formatTimeWithJST } from '@/lib/dateUtils';
import { sendAbsenceNotification } from '@/lib/emailService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { InlineLessonExercises } from '@/components/learning/InlineLessonExercises';
import { InlineLessonPresentation } from '@/components/teacher/InlineLessonPresentation';
import ClassLessonOrganizer from '@/components/teacher/ClassLessonOrganizer';
import SessionVideoPlayer from '@/components/shared/SessionVideoPlayer';
import JoinMeetingButton from '@/components/shared/JoinMeetingButton';
import FormattedText from '@/components/shared/FormattedText';
import ClassroomChat from '@/components/classroom/ClassroomChat';
import StudentSubmissionAnalysisModal, { StudentSubmissionAnalysisData } from '@/components/classroom/StudentSubmissionAnalysisModal';

interface ClassData {
  id: string;
  name: string;
  name_vi: string;
  description: string | null;
  description_vi: string | null;
  course_id?: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  teacher_id: string;
  total_sessions?: number | null;
  custom_fields?: any;
  teacher?: {
    full_name: string | null;
    avatar_url: string | null;
  };
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
}

interface Lesson {
  id: string;
  title: string;
  title_vi: string;
  description_vi: string | null;
  skill: string;
  level: string;
  duration_minutes: number;
  xp_reward: number;
  content_html?: string;
  slide_url?: string;
  document_url?: string;
}

interface Exam {
  id: string;
  title_vi: string;
  exam_type: string;
  exam_date: string;
  start_time: string;
  duration_minutes: number | null;
  timer_mode: string | null;
  meet_link: string | null;
  max_score: number;
  passing_score: number | null;
  starts_at: string | null;
  ends_at: string | null;
  lock_after_end: boolean;
  is_published: boolean;
  show_answers_after: boolean;
  questions: Array<{
    text: string;
    type?: string;
    options: string[];
    correct_index: number;
    accepted_answers?: string[];
    explanation?: string;
    points?: number;
  }>;
}

interface Submission {
  id: string;
  content: string;
  score: number | null;
  feedback: string | null;
  status: string;
  submitted_at: string;
  exercise?: {
    title_vi: string;
  };
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  started_at: string;
  submitted_at: string | null;
  status: string;
  score: number | null;
  total: number | null;
  time_spent_seconds: number;
  student_comment: string | null;
  answers: (number | string | null)[];
}

const MyClasses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [currentEnrollment, setCurrentEnrollment] = useState<any>(null);

  // Dashboard details state
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [examAttempts, setExamAttempts] = useState<Record<string, ExamAttempt[]>>({});
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [expandedReviewAttemptId, setExpandedReviewAttemptId] = useState<string | null>(null);

  // Active lesson details inside classroom
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showInlinePresentation, setShowInlinePresentation] = useState(false);
  const [useGooglePdfEmbed, setUseGooglePdfEmbed] = useState(false);

  // Detailed Analysis Modal state for student view
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisModalData, setAnalysisModalData] = useState<StudentSubmissionAnalysisData | null>(null);

  const openStudentAttemptAnalysis = (exam: Exam, att: ExamAttempt, attemptIndex: number, totalAttempts: number) => {
    const answersObj = Array.isArray(att.answers) ? att.answers : (att as any).answers || {};
    const questions = exam.questions || [];

    let correct = 0;
    let incorrect = 0;

    const questionBreakdown = questions.map((q: any, i: number) => {
      const uAnsRaw = Array.isArray(answersObj) ? answersObj[i] : (answersObj[i] ?? answersObj[String(i)] ?? answersObj[q.id]);
      const type = q.type || 'multiple_choice';

      let user_answer = '(Chưa trả lời)';
      let correct_answer = 'N/A';
      let isRight = false;

      if (type === 'multiple_choice' || type === 'true_false') {
        const options = q.options || [];
        if (typeof uAnsRaw === 'number' || (typeof uAnsRaw === 'string' && uAnsRaw !== '' && !isNaN(Number(uAnsRaw)))) {
          const idx = Number(uAnsRaw);
          user_answer = options[idx] ? `${String.fromCharCode(65 + idx)}. ${options[idx]}` : `Lựa chọn ${String.fromCharCode(65 + idx)}`;
          isRight = idx === q.correct_index;
        } else if (typeof uAnsRaw === 'string' && uAnsRaw.trim()) {
          user_answer = uAnsRaw;
          const cIdx = typeof q.correct_index === 'number' ? q.correct_index : -1;
          isRight = cIdx >= 0 ? (String(cIdx) === uAnsRaw || String(options[cIdx]) === uAnsRaw) : false;
        }

        const cIdx = typeof q.correct_index === 'number' ? q.correct_index : 0;
        correct_answer = options[cIdx] ? `${String.fromCharCode(65 + cIdx)}. ${options[cIdx]}` : `Đáp án ${String.fromCharCode(65 + cIdx)}`;
      } else if (type === 'short_answer') {
        user_answer = uAnsRaw ? String(uAnsRaw) : '(Bỏ trống)';
        const accepted = (q.accepted_answers || [q.correct_answer || q.answer]).filter(Boolean);
        correct_answer = accepted.join(' / ');
        isRight = accepted.some((a: string) => a.trim().toLowerCase() === String(uAnsRaw || '').trim().toLowerCase());
      } else {
        user_answer = uAnsRaw ? String(uAnsRaw) : '(Bỏ trống bài làm)';
        correct_answer = 'Bài viết tự luận (Giáo viên chấm điểm)';
        isRight = (att.score || 0) > 0;
      }

      if (isRight) correct++;
      else incorrect++;

      return {
        id: q.id || String(i + 1),
        question_text: q.text || q.question || q.question_text || `Câu hỏi ${i + 1}`,
        user_answer,
        correct_answer,
        is_correct: isRight,
        explanation: q.explanation || undefined,
        skill: q.skill || exam.exam_type || 'Bài kiểm tra',
      };
    });

    let durationStr = '';
    if (att.time_spent_seconds > 0) {
      const m = Math.floor(att.time_spent_seconds / 60);
      const s = att.time_spent_seconds % 60;
      durationStr = m > 0 ? `${m} phút ${s}s` : `${s}s`;
    }

    const maxScore = att.total || exam.max_score || (questions.length > 0 ? questions.length : 100);

    setAnalysisModalData({
      id: att.id,
      is_exam_attempt: true,
      student_name: user?.user_metadata?.full_name || user?.email || 'Học viên',
      avatar_url: user?.user_metadata?.avatar_url || undefined,
      title: exam.title_vi || 'Bài kiểm tra',
      submitted_at: att.submitted_at || att.started_at,
      attempt_number: attemptIndex,
      total_attempts: totalAttempts,
      duration_str: durationStr,
      score: att.score || 0,
      max_score: maxScore,
      passing_score: exam.passing_score || Math.round(maxScore * 0.6),
      correct_count: correct,
      incorrect_count: incorrect,
      feedback: att.student_comment || undefined,
      questions: questionBreakdown,
    });
    setAnalysisModalOpen(true);
  };

  const handleDeleteStudentAttempt = async (attemptId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lượt làm bài này khỏi lịch sử không?')) return;
    try {
      const { error } = await supabase.from('exam_attempts').delete().eq('id', attemptId);
      if (error) throw error;
      toast({ title: 'Đã xóa lượt làm bài' });
      fetchMyClasses();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message || 'Không thể xóa lượt thi', variant: 'destructive' });
    }
  };

  // Absence & Makeup state
  const [isAbsenceDialogOpen, setIsAbsenceDialogOpen] = useState(false);
  const [selectedSessionToAbsence, setSelectedSessionToAbsence] = useState<ClassSession | null>(null);
  const [absenceReason, setAbsenceReason] = useState('');
  const [submittingAbsence, setSubmittingAbsence] = useState(false);
  const [studentAttendance, setStudentAttendance] = useState<any[]>([]);
  const [playingVideoRecord, setPlayingVideoRecord] = useState<{ url: string; title: string } | null>(null);

  const fetchAttendanceRecords = async (classId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('class_id', classId)
      .eq('student_id', user.id);
    setStudentAttendance(data || []);
  };

  const handleRequestAbsence = async () => {
    if (!selectedSessionToAbsence || !selectedClass || !user) return;
    try {
      setSubmittingAbsence(true);

      await sendAbsenceNotification({
        studentName: user.user_metadata?.full_name || user.email || 'Học viên',
        studentEmail: user.email,
        className: selectedClass.name_vi,
        sessionDate: selectedSessionToAbsence.session_date,
        reason: absenceReason.trim() || 'Có việc bận cá nhân',
        teacherId: selectedClass.teacher_id
      });

      await supabase.from('attendance').insert({
        class_id: selectedClass.id,
        student_id: user.id,
        session_date: selectedSessionToAbsence.session_date,
        status: 'excused_absence',
        notes: `Báo vắng: ${absenceReason.trim() || 'Có việc bận cá nhân'}`
      });

      toast({
        title: 'Đã gửi thông báo vắng',
        description: 'Thông báo vắng học đã được gửi tới giáo viên phụ trách.'
      });

      setIsAbsenceDialogOpen(false);
      setAbsenceReason('');
      setSelectedSessionToAbsence(null);
      fetchAttendanceRecords(selectedClass.id);
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể gửi đơn xin nghỉ', variant: 'destructive' });
    } finally {
      setSubmittingAbsence(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyClasses();
    }
  }, [user]);

  const fetchMyClasses = async () => {
    try {
      setLoading(true);
      // Fetch classes this student is enrolled in
      const { data: studentClasses, error } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', user?.id)
        .eq('status', 'active');

      if (error) throw error;

      if (!studentClasses || studentClasses.length === 0) {
        setClasses([]);
        setLoading(false);
        return;
      }

      const classIds = studentClasses.map(c => c.class_id);

      // Fetch class details
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds)
        .eq('is_active', true);

      if (classesError) throw classesError;

      // Fetch teacher profiles
      const classesWithTeachers = await Promise.all(
        (classesData || []).map(async (cls) => {
          const { data: teacherProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', cls.teacher_id)
            .single();

          return {
            ...cls,
            teacher: teacherProfile || { full_name: 'Giảng viên', avatar_url: null }
          };
        })
      );

      setClasses(classesWithTeachers);
    } catch (err) {
      console.error('Error fetching student classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = async (cls: ClassData) => {
    setSelectedClass(cls);
    setActiveLesson(null);
    fetchAttendanceRecords(cls.id);
    try {
      // Fetch student enrollment evaluation
      const { data: csRecord } = await supabase
        .from('class_students')
        .select('*')
        .eq('class_id', cls.id)
        .eq('student_id', user?.id)
        .maybeSingle();

      setCurrentEnrollment(csRecord || null);

      // 1. Fetch class sessions (stream schedule)
      const { data: sessionsData } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('class_id', cls.id)
        .order('session_date', { ascending: true });
      setSessions(sessionsData || []);

      // 2. Fetch class lessons (lessons linked to this class or linked course)
      let lessonQuery = supabase.from('lessons').select('*');
      if (cls.course_id) {
        lessonQuery = lessonQuery.or(`class_id.eq.${cls.id},course_id.eq.${cls.course_id}`);
      } else {
        lessonQuery = lessonQuery.eq('class_id', cls.id);
      }
      const { data: lessonsData } = await lessonQuery.order('created_at', { ascending: true });
      setLessons(lessonsData || []);

      // 3. Fetch exams for this class
      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('class_id', cls.id)
        .order('exam_date', { ascending: true });
      setExams((examsData || []) as any);

      // 4. Fetch exam attempts for this student (grouped by exam)
      if (examsData && examsData.length > 0 && user) {
        const examIds = (examsData as any[]).map((e) => e.id);
        const { data: attemptsData } = await supabase
          .from('exam_attempts')
          .select('id, exam_id, started_at, submitted_at, status, score, total, time_spent_seconds, student_comment, answers')
          .in('exam_id', examIds)
          .eq('student_id', user.id)
          .order('started_at', { ascending: false });
        const grouped: Record<string, ExamAttempt[]> = {};
        for (const att of (attemptsData || [])) {
          if (!grouped[att.exam_id]) grouped[att.exam_id] = [];
          grouped[att.exam_id].push(att as ExamAttempt);
        }
        setExamAttempts(grouped);
      } else {
        setExamAttempts({});
      }

      // 4. Fetch student submissions for lessons/exercises in this class
      if (lessonsData && lessonsData.length > 0) {
        const lessonIds = lessonsData.map(l => l.id);
        const { data: exercises } = await supabase
          .from('exercises')
          .select('id, title_vi')
          .in('lesson_id', lessonIds);

        if (exercises && exercises.length > 0) {
          const exerciseIds = exercises.map(ex => ex.id);
          const { data: subs } = await supabase
            .from('student_submissions')
            .select('*')
            .eq('user_id', user?.id)
            .in('exercise_id', exerciseIds)
            .order('submitted_at', { ascending: false });

          const mappedSubs = (subs || []).map(sub => {
            const exercise = exercises.find(ex => ex.id === sub.exercise_id);
            return {
              ...sub,
              exercise: exercise ? { title_vi: exercise.title_vi } : undefined
            };
          });
          setSubmissions(mappedSubs);
        } else {
          setSubmissions([]);
        }
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error('Error fetching classroom details:', err);
    }
  };

  const getSkillBadgeColor = (skill: string) => {
    const colors: Record<string, string> = {
      reading: 'bg-blue-500/10 text-blue-600 border-blue-200',
      listening: 'bg-purple-500/10 text-purple-600 border-purple-200',
      speaking: 'bg-green-500/10 text-green-600 border-green-200',
      writing: 'bg-orange-500/10 text-orange-600 border-orange-200',
      vocabulary: 'bg-pink-500/10 text-pink-600 border-pink-200',
      grammar: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
    };
    return colors[skill] || 'bg-muted text-muted-foreground';
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // --- 1. CLASS LIST VIEW ---
  if (!selectedClass) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lớp học của tôi</h1>
          <p className="text-muted-foreground mt-1">Các lớp học trực tuyến bạn đang tham gia</p>
        </div>

        {classes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Building className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Bạn chưa tham gia lớp học nào</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Liên hệ với trung tâm hoặc đăng ký khóa học để được xếp lớp học phù hợp.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <Card key={cls.id} className="hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden border border-border group">
                <div className="h-2 bg-primary w-full group-hover:bg-accent transition-colors" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-lg font-bold line-clamp-1">{cls.name_vi}</CardTitle>
                      <CardDescription className="text-sm font-medium">{cls.name}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 shrink-0">
                      Đang hoạt động
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4 flex-1 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {cls.description_vi || 'Lớp học Nhật ngữ trực tuyến tương tác cao.'}
                  </p>

                  <div className="flex items-center gap-2 pt-2 border-t text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                      {cls.teacher?.full_name?.charAt(0) || 'G'}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Giảng viên</p>
                      <p className="font-semibold text-xs">{cls.teacher?.full_name}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                    {cls.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Bắt đầu: {formatWithJST(cls.start_date, false)}
                      </span>
                    )}
                  </div>
                </CardContent>
                <div className="p-4 bg-muted/40 border-t flex justify-end">
                  <Button onClick={() => handleSelectClass(cls)} size="sm">
                    Vào lớp học
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- 2. CLASS DETAIL VIEW (Google Classroom style) ---
  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => setSelectedClass(null)}
        className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách lớp
      </Button>

      {/* Classroom Banner Card */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary via-primary/95 to-accent/90 p-6 md:p-8 text-white shadow-soft">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{selectedClass.name_vi}</h1>
            <p className="text-white/80 font-medium text-sm md:text-base">{selectedClass.name}</p>
          </div>
          <p className="text-white/70 text-sm max-w-2xl line-clamp-2">
            {selectedClass.description_vi || 'Học tập tương tác trực quan, làm bài tập và làm bài kiểm tra hàng tuần.'}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm pt-2 text-white/90">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
              <GraduationCap className="w-4 h-4" />
              GV: {selectedClass.teacher?.full_name}
            </span>
            {selectedClass.start_date && (
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                <Calendar className="w-4 h-4" />
                Khai giảng: {formatWithJST(selectedClass.start_date, false)}
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-amber-400 text-black font-extrabold px-3 py-1 rounded-full backdrop-blur-sm shadow-md">
              <Clock className="w-4 h-4 text-black" />
              Tiến độ buổi học: 20/45 buổi
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-400 text-black font-extrabold px-3 py-1 rounded-full backdrop-blur-sm shadow-md">
              <CheckCircle2 className="w-4 h-4 text-black" />
              Đã học bù: 2/2 buổi
            </span>
          </div>
        </div>
      </div>

      {/* Graduation / Course Evaluation Card */}
      {currentEnrollment?.evaluation_result && (
        <Card className={`p-5 border-2 shadow-sm rounded-2xl ${
          currentEnrollment.evaluation_result === 'pass' 
            ? 'border-emerald-500/50 bg-emerald-500/10' 
            : 'border-rose-500/50 bg-rose-500/10'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <GraduationCap className={`w-6 h-6 ${currentEnrollment.evaluation_result === 'pass' ? 'text-emerald-600' : 'text-rose-600'}`} />
                <h3 className="font-extrabold text-base md:text-lg">
                  Kết Quả Hoàn Thành Khóa Học: {currentEnrollment.evaluation_result === 'pass' ? '🟢 ĐẠT KHÓA HỌC (PASS)' : '🔴 CHƯA ĐẠT (FAIL)'}
                </h3>
                {currentEnrollment.evaluation_grade && (
                  <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                    Xếp loại: {currentEnrollment.evaluation_grade}
                  </Badge>
                )}
              </div>
              {currentEnrollment.evaluation_comment && (
                <p className="text-sm text-foreground/90 italic pl-8">
                  💬 Nhận xét từ giảng viên: "{currentEnrollment.evaluation_comment}"
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="stream" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl w-full md:w-auto flex flex-wrap gap-1">
          <TabsTrigger value="stream" className="rounded-lg text-xs md:text-sm font-semibold">Bảng tin</TabsTrigger>
          <TabsTrigger value="chat" className="rounded-lg text-xs md:text-sm font-semibold">Thảo luận</TabsTrigger>
          <TabsTrigger value="lessons" className="rounded-lg text-xs md:text-sm font-semibold">Bài học</TabsTrigger>
          <TabsTrigger value="recordings" className="rounded-lg text-xs md:text-sm font-bold text-purple-600 dark:text-purple-400 gap-1.5">
            🎬 Record Buổi Học
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg text-xs md:text-sm font-bold text-emerald-600 dark:text-emerald-400 gap-1">
            📊 Chuyên cần ({studentAttendance.filter(a => a.status === 'present' || a.status === 'late').length}/{sessions.length || 0})
          </TabsTrigger>
          <TabsTrigger value="exams" className="rounded-lg text-xs md:text-sm font-semibold">Kiểm tra</TabsTrigger>
          <TabsTrigger value="submissions" className="rounded-lg text-xs md:text-sm font-semibold">Bài nộp</TabsTrigger>
        </TabsList>

        {/* Tab Chat: Thảo luận */}
        <TabsContent value="chat" className="space-y-4">
          <ClassroomChat classId={selectedClass.id} />
        </TabsContent>

        {/* Tab 1: Stream (Bảng tin) */}
        <TabsContent value="stream" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Class schedule */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Lịch học trực tuyến
              </h2>
              {sessions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    Lớp học chưa lên lịch buổi học nào.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => {
                    const recUrl = (session as any).record_url || session.notes?.match(/\[RECORD_URL:\s*([^\s\]]+)\]/i)?.[1] || null;
                    const cleanNotes = session.notes ? session.notes.replace(/\[RECORD_URL:\s*[^\s\]]+\]/gi, '').trim() : '';

                    return (
                      <Card key={session.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1">
                            <p className="font-semibold text-sm md:text-base text-foreground">
                              {session.topic || 'Buổi học trực tuyến'}
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
                                className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
                                onClick={() => setPlayingVideoRecord({ url: recUrl, title: session.topic || 'Record Buổi Học' })}
                              >
                                <Play className="w-3.5 h-3.5 fill-current" /> Xem Record Video
                              </Button>
                            )}
                            {studentAttendance.some(a => a.session_date === session.session_date && a.status === 'excused_absence') ? (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 text-xs font-semibold">
                                Đã báo vắng
                              </Badge>
                            ) : (() => {
                              const sessionTimeStr = `${session.session_date}T${session.start_time.length === 5 ? session.start_time + ':00' : session.start_time}`;
                              const isPast = !isNaN(new Date(sessionTimeStr).getTime()) && new Date(sessionTimeStr).getTime() < Date.now();

                              if (isPast) {
                                return (
                                  <Badge variant="outline" className="bg-muted/80 text-muted-foreground text-xs font-medium border-border">
                                    ⏰ Đã qua buổi học
                                  </Badge>
                                );
                              }

                              return (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setSelectedSessionToAbsence(session);
                                    setIsAbsenceDialogOpen(true);
                                  }}
                                >
                                  <UserX className="w-3.5 h-3.5" /> Báo vắng
                                </Button>
                              );
                            })()}

                            {session.meet_link ? (
                              <JoinMeetingButton
                                url={session.meet_link}
                                title={session.topic || 'Buổi học trực tuyến'}
                                label="Vào học Meeting"
                                className="shrink-0"
                              />
                            ) : (
                              <Badge variant="outline" className="text-xs">Chưa có link</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar quick info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thông tin lớp học</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Giảng viên phụ trách</span>
                    <span className="font-semibold text-foreground">{selectedClass.teacher?.full_name}</span>
                  </div>
                  {selectedClass.end_date && (
                    <div>
                      <span className="text-muted-foreground block text-xs">Ngày kết thúc dự kiến</span>
                      <span className="font-semibold text-foreground">{formatWithJST(selectedClass.end_date, false)}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground block text-xs">Tài liệu</span>
                    <span className="text-foreground">Đã đăng {lessons.length} bài học, {exams.length} bài kiểm tra</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Lessons (Bài học) */}
        <TabsContent value="lessons" className="space-y-4">
          {activeLesson ? (
            /* Single Lesson Viewer inside classroom */
            <div className="space-y-6">
              <Button variant="ghost" onClick={() => setActiveLesson(null)} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" /> Quay lại danh sách bài học
              </Button>

              <Card className="border shadow-soft">
                <CardHeader className="border-b bg-muted/20">
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getSkillBadgeColor(activeLesson.skill)}>
                          {getSkillLabel(activeLesson.skill)}
                        </Badge>
                        <Badge variant="outline">{activeLesson.level}</Badge>
                      </div>
                      <CardTitle className="text-xl md:text-2xl font-extrabold text-foreground">{activeLesson.title_vi}</CardTitle>
                      <CardDescription className="text-sm font-medium">{activeLesson.title}</CardDescription>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 mt-2 md:mt-0">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-4 h-4" /> {activeLesson.duration_minutes} phút</span>
                      <span className="flex items-center gap-1 text-xs text-yellow-600 font-bold bg-yellow-500/10 px-2.5 py-1 rounded-full"><Star className="w-4 h-4 fill-yellow-500" /> +{activeLesson.xp_reward} XP</span>
                      <Button
                        size="sm"
                        variant="hero"
                        className="gap-1.5 font-bold shadow-md"
                        onClick={() => setShowInlinePresentation(true)}
                      >
                        <Play className="w-4 h-4 fill-current" /> Trình chiếu Slide
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Fullscreen / Slide Presentation Drawer */}
                  {showInlinePresentation && (
                    <div className="rounded-2xl border-2 border-primary/40 overflow-hidden shadow-2xl animate-fade-in">
                      <InlineLessonPresentation
                        lesson={activeLesson}
                        onClose={() => setShowInlinePresentation(false)}
                      />
                    </div>
                  )}

                  {/* Embedded Live PDF / Slide Interactive Viewer */}
                  {(() => {
                    const pdfUrl = activeLesson.document_url || activeLesson.content_html?.match(/(https?:[^\s<"']+\.pdf[^\s<"']*)/i)?.[1] || null;
                    const slideUrl = activeLesson.slide_url || activeLesson.content_html?.match(/(https?:\/\/(?:docs\.google\.com|canva\.com)[^\s<"']+)/i)?.[1] || null;
                    const activeMediaUrl = pdfUrl || slideUrl;

                    if (!activeMediaUrl) return null;

                    return (
                      <div className="rounded-2xl border border-primary/20 bg-card overflow-hidden shadow-sm space-y-0">
                        <div className="px-4 py-3 bg-primary/5 border-b flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                            <BookOpen className="w-4.5 h-4.5 text-primary" />
                            <span>Trình chiếu Học liệu & Slide trực tiếp</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {pdfUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs font-semibold text-muted-foreground hover:text-foreground"
                                onClick={() => setUseGooglePdfEmbed(p => !p)}
                              >
                                {useGooglePdfEmbed ? 'Native PDF' : 'Google Viewer'}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="h-7 text-xs font-bold gap-1 border-primary/30 text-primary hover:bg-primary/10"
                            >
                              <a href={activeMediaUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3.5 h-3.5" /> Mở link gốc
                              </a>
                            </Button>
                          </div>
                        </div>

                        <div className="w-full bg-muted/20 relative" style={{ height: 'min(65vh, 580px)' }}>
                          {pdfUrl ? (
                            <iframe
                              src={useGooglePdfEmbed
                                ? `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`
                                : pdfUrl}
                              className="w-full h-full border-0"
                              title="Trình chiếu tài liệu PDF"
                            />
                          ) : (
                            <iframe
                              src={slideUrl!}
                              className="w-full h-full border-0"
                              title="Trình chiếu Slide"
                              allowFullScreen
                            />
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Theory HTML content */}
                  {activeLesson.content_html && (
                    <div className="border rounded-2xl p-6 bg-card prose prose-indigo dark:prose-invert max-w-none leading-relaxed shadow-sm">
                      <div dangerouslySetInnerHTML={{ __html: activeLesson.content_html }} />
                    </div>
                  )}

                  {!activeLesson.content_html && !activeLesson.slide_url && !activeLesson.document_url && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Bài học này chưa cập nhật nội dung văn bản.
                    </div>
                  )}

                  {/* Direct Interactive Exercises */}
                  <div className="pt-6 border-t border-border space-y-4">
                    <InlineLessonExercises
                      lessonId={activeLesson.id}
                      lessonTitle={activeLesson.title_vi || activeLesson.title}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Lesson list with Session & Week Grouping */
            <div className="space-y-4">
              {selectedClass && (
                <ClassLessonOrganizer
                  classId={selectedClass.id}
                  className={selectedClass.name_vi}
                  isTeacher={false}
                />
              )}
            </div>
          )}
        </TabsContent>

        {/* Tab Recordings: Kho Video Record Buổi Học */}
        <TabsContent value="recordings" className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-600" /> Kho Video Record Ghi Hình Buổi Học
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Xem lại toàn bộ video bài giảng các buổi học trực tuyến bất cứ lúc nào với đầy đủ tính năng tua video
              </p>
            </div>
          </div>

          {(() => {
            const recordedSessions = sessions.filter(
              s => (s as any).record_url || s.notes?.match(/\[RECORD_URL:\s*([^\s\]]+)\]/i)
            );

            if (recordedSessions.length === 0) {
              return (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Video className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-50 animate-pulse" />
                    <h3 className="text-base font-bold text-foreground">Chưa có video record buổi học nào</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Giáo viên sẽ cập nhật video ghi hình lại sau mỗi buổi học trực tuyến.
                    </p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recordedSessions.map((session) => {
                  const recUrl = (session as any).record_url || session.notes?.match(/\[RECORD_URL:\s*([^\s\]]+)\]/i)?.[1] || '';
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

                      {/* Action play button */}
                      <div className="p-4 bg-muted/30 border-t flex items-center justify-between gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-bold gap-1 border-primary/30"
                          asChild
                        >
                          <a href={recUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5" /> Link gốc
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          className="h-9 font-extrabold text-xs gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md"
                          onClick={() => setPlayingVideoRecord({ url: recUrl, title: session.topic || 'Record Buổi Học' })}
                        >
                          <Play className="w-4 h-4 fill-current" /> Xem Video Record →
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </TabsContent>

        {/* Tab 3: Exams (Kiểm tra) */}
        <TabsContent value="exams" className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Danh sách bài kiểm tra</h2>
          {exams.filter(e => e.is_published).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                Không có bài kiểm tra nào.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {exams.filter(e => e.is_published).map((exam) => {
                const now = new Date();
                const openTime = exam.starts_at
                  ? new Date(exam.starts_at)
                  : new Date(`${exam.exam_date}T${exam.start_time}`);
                const isLocked = now < openTime;
                const isClosed = !!(exam.ends_at && exam.lock_after_end && now > new Date(exam.ends_at));
                const allAttempts = examAttempts[exam.id] || [];
                const attempts = allAttempts.filter(a => a.status !== 'in_progress');
                const inProgress = allAttempts.find(a => a.status === 'in_progress');
                const isExpanded = expandedExamId === exam.id;

                const fmtTime = (sec: number) => {
                  const m = Math.floor(sec / 60);
                  const s = sec % 60;
                  return m > 0 ? `${m}ph ${s}s` : `${s}s`;
                };
                const statusLabel = (s: string) => {
                  if (s === 'submitted') return { text: 'Đã nộp', color: 'text-green-600' };
                  if (s === 'auto_submitted') return { text: 'Hết giờ – Tự nộp', color: 'text-amber-600' };
                  if (s === 'graded') return { text: 'Đã chấm', color: 'text-blue-600' };
                  return { text: s, color: 'text-muted-foreground' };
                };

                return (
                  <Card key={exam.id} className={`transition-all ${isLocked ? 'opacity-90 bg-muted/20' : ''}`}>
                    <CardContent className="p-4">
                      {/* Main row */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="capitalize shrink-0">{exam.exam_type}</Badge>
                            <p className="font-semibold text-sm sm:text-base text-foreground">{exam.title_vi}</p>
                            {isClosed ? (
                              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 text-xs">🔴 Đã đóng</Badge>
                            ) : isLocked ? (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 text-xs">🕒 Chưa đến giờ</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-xs">🟢 Đang mở</Badge>
                            )}
                            {inProgress && (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 text-xs animate-pulse">
                                ⏳ Đang làm dở
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>Lịch thi: {formatWithJST(`${exam.exam_date}T${exam.start_time}`, true)}</span>
                            <span>Thời gian: {exam.duration_minutes ? `${exam.duration_minutes} phút` : (exam.timer_mode === 'stopwatch' ? 'Bấm giờ' : 'Không giới hạn')}</span>
                            {attempts.length > 0 && (
                              <span className="text-primary font-medium">{attempts.length} lần đã làm</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
                          {/* Lịch sử button */}
                          {attempts.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 w-full sm:w-auto"
                              onClick={() => setExpandedExamId(isExpanded ? null : exam.id)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Lịch sử ({attempts.length})
                              <span className={`transition-transform inline-block ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                            </Button>
                          )}
                          {/* Vào làm / tiếp tục */}
                          {!isLocked && !isClosed && (
                            <Button
                              size="sm"
                              variant="hero"
                              className="gap-2 font-semibold w-full sm:w-auto"
                              onClick={() => navigate(`/learn/exams/${exam.id}`)}
                            >
                              <GraduationCap className="w-4 h-4" />
                              {inProgress ? 'Tiếp tục bài' : 'Vào làm bài'}
                            </Button>
                          )}
                          {isLocked && (
                            <Button size="sm" variant="outline" disabled className="gap-2 w-full sm:w-auto">
                              🕒 Chưa đến giờ
                            </Button>
                          )}
                          {exam.meet_link && !isLocked && (
                            <JoinMeetingButton
                              url={exam.meet_link}
                              title={exam.title_vi || 'Phòng thi trực tuyến'}
                              label="Phòng thi"
                              variant="outline"
                            />
                          )}
                        </div>
                      </div>

                      {/* History dropdown */}
                      {isExpanded && attempts.length > 0 && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Lịch sử làm bài
                          </p>
                          {attempts.map((att, idx) => {
                            const sl = statusLabel(att.status);
                            const hasScore = att.score !== null && att.total !== null && att.total! > 0;
                            const pct = hasScore ? Math.round((att.score! / att.total!) * 100) : null;
                            const isReviewOpen = expandedReviewAttemptId === att.id;
                            const canShowReview = exam.show_answers_after && att.status !== 'in_progress' && Array.isArray(att.answers) && exam.questions?.length > 0;
                            const passingScore = exam.passing_score ?? 0;
                            const passed = hasScore && att.score! >= passingScore && passingScore > 0;

                            return (
                              <div key={att.id} className="rounded-xl border bg-muted/30 overflow-hidden">
                                {/* Attempt summary row */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-sm font-bold shrink-0 ${hasScore && passingScore > 0 ? (passed ? 'bg-green-500 text-white' : 'bg-red-400 text-white') : 'bg-primary/10 text-primary'}`}>
                                      {attempts.length - idx}
                                    </span>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs font-semibold ${sl.color}`}>{sl.text}</span>
                                        {hasScore && passingScore > 0 && (
                                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${passed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                            {passed ? '✓ Đạt' : '✗ Chưa đạt'}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        Nộp: {att.submitted_at ? new Date(att.submitted_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                        {att.time_spent_seconds > 0 && ` · ${fmtTime(att.time_spent_seconds)}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {hasScore ? (
                                      <div className="text-right mr-1">
                                        <p className="font-bold text-base md:text-lg text-primary leading-none">{att.score}/{att.total}</p>
                                        <p className="text-xs text-muted-foreground">{pct}%</p>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground italic mr-1">Chờ chấm</span>
                                    )}

                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="gap-1 text-xs h-8 font-bold"
                                      onClick={() => openStudentAttemptAnalysis(exam, att, attempts.length - idx, attempts.length)}
                                    >
                                      📋 Chi tiết
                                    </Button>

                                    {canShowReview && (
                                      <Button
                                        size="sm"
                                        variant={isReviewOpen ? 'secondary' : 'outline'}
                                        className="gap-1 text-xs h-8"
                                        onClick={() => setExpandedReviewAttemptId(isReviewOpen ? null : att.id)}
                                      >
                                        {isReviewOpen ? '▲' : 'Đáp án'}
                                      </Button>
                                    )}

                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      title="Xóa lượt làm bài này"
                                      onClick={() => handleDeleteStudentAttempt(att.id)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Per-question review */}
                                {isReviewOpen && canShowReview && (
                                  <div className="border-t bg-background/60 p-3 space-y-3">
                                    <p className="text-xs font-semibold text-muted-foreground">Chi tiết từng câu:</p>
                                    {exam.questions.map((q, qi) => {
                                      const studentAns = att.answers[qi];
                                      const qtype = q.type || 'multiple_choice';
                                      const isAutoGraded = qtype !== 'essay';

                                      let isCorrect = false;
                                      if (qtype === 'multiple_choice' || qtype === 'true_false') {
                                        isCorrect = typeof studentAns === 'number' && studentAns === q.correct_index;
                                      } else if (qtype === 'short_answer') {
                                        const accepted = (q.accepted_answers || []).map(a => a.trim().toLowerCase()).filter(Boolean);
                                        isCorrect = typeof studentAns === 'string' && !!studentAns.trim() && accepted.includes(studentAns.trim().toLowerCase());
                                      }

                                      const notAnswered = studentAns === null || studentAns === undefined || studentAns === '';

                                      return (
                                        <div
                                          key={qi}
                                          className={`rounded-lg border p-3 space-y-2 text-sm ${!isAutoGraded ? 'border-muted bg-muted/20' : isCorrect ? 'border-green-400/50 bg-green-50/50 dark:bg-green-950/20' : notAnswered ? 'border-muted bg-muted/20' : 'border-red-400/50 bg-red-50/50 dark:bg-red-950/20'}`}
                                        >
                                          {/* Question header */}
                                          <div className="flex items-start gap-2">
                                            <span className={`inline-flex w-6 h-6 rounded-full text-xs items-center justify-center font-bold shrink-0 mt-0.5 ${!isAutoGraded ? 'bg-muted text-muted-foreground' : isCorrect ? 'bg-green-500 text-white' : notAnswered ? 'bg-muted text-muted-foreground' : 'bg-red-500 text-white'}`}>
                                              {isAutoGraded ? (isCorrect ? '✓' : (notAnswered ? '—' : '✗')) : qi + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-foreground leading-snug"><FormattedText text={q.text} /></p>
                                              {q.image_url && (
                                                <div className="mt-2 rounded-xl overflow-hidden border bg-black/5 inline-block max-w-[200px]">
                                                  <img src={q.image_url} alt="Ảnh minh họa" className="w-full h-auto object-contain" />
                                                </div>
                                              )}
                                              {q.audio_url && (
                                                <div className="mt-2 max-w-[300px]">
                                                  <audio src={q.audio_url} controls className="w-full h-8" />
                                                </div>
                                              )}
                                              {q.points && <span className="text-xs text-muted-foreground block mt-1">{q.points} điểm</span>}
                                            </div>
                                          </div>

                                          {/* Options for MC / TF */}
                                          {(qtype === 'multiple_choice' || qtype === 'true_false') && (
                                            <div className="space-y-1.5 pl-8">
                                              {q.options.map((opt, oi) => {
                                                const isSelected = studentAns === oi;
                                                const isRight = oi === q.correct_index;
                                                return (
                                                  <div key={oi} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs ${isRight ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-medium' : isSelected && !isRight ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 line-through' : 'text-muted-foreground'}`}>
                                                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${isRight ? 'border-green-500 bg-green-500 text-white' : isSelected ? 'border-red-400 bg-red-400 text-white' : 'border-muted-foreground/30'}`}>
                                                      {String.fromCharCode(65 + oi)}
                                                    </span>
                                                    <FormattedText className="flex-1" text={opt} />
                                                    {isRight && <span className="shrink-0 text-green-600 font-semibold">✓ Đúng</span>}
                                                    {isSelected && !isRight && <span className="shrink-0 text-red-500">✗ Bạn chọn</span>}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}

                                          {/* Short answer */}
                                          {qtype === 'short_answer' && (
                                            <div className="pl-8 space-y-1">
                                              <div className={`px-2 py-1.5 rounded-md text-xs ${isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                <span className="text-muted-foreground">Bạn trả lời: </span>
                                                <span className="font-medium whitespace-pre-wrap">{notAnswered ? '(không trả lời)' : String(studentAns)}</span>
                                              </div>
                                              {!isCorrect && q.accepted_answers && q.accepted_answers.filter(Boolean).length > 0 && (
                                                <div className="px-2 py-1.5 rounded-md text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                                  <span className="text-muted-foreground">Đáp án đúng: </span>
                                                  <span className="font-medium">{q.accepted_answers.filter(Boolean).join(' / ')}</span>
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Essay / Speaking / Roleplay */}
                                          {(qtype === 'essay' || qtype === 'speaking' || qtype === 'roleplay') && (
                                            <div className="pl-8">
                                              <div className="px-2 py-1.5 rounded-md text-xs bg-muted text-muted-foreground">
                                                <span className="font-medium">Bài làm: </span>
                                                {notAnswered ? <em>(không trả lời)</em> : <span className="whitespace-pre-wrap">{String(studentAns)}</span>}
                                              </div>
                                              <p className="text-xs text-amber-600 mt-1 pl-1">✏️ Giáo viên sẽ chấm tay câu này.</p>
                                            </div>
                                          )}

                                          {/* Teacher explanation */}
                                          {q.explanation && (
                                            <div className="pl-8">
                                              <div className="flex gap-1.5 px-2 py-1.5 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
                                                <span className="shrink-0">💡</span>
                                                <div>
                                                  <p className="font-semibold mb-0.5">Giải thích:</p>
                                                  <p className="leading-relaxed">{q.explanation}</p>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}

                                    {att.student_comment && (
                                      <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                                        <p className="font-semibold text-muted-foreground mb-1">Nhận xét của bạn:</p>
                                        <p className="text-foreground italic">"{att.student_comment}"</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 4: Bài nộp (Exercise Submissions) */}
        <TabsContent value="submissions" className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Lịch sử nộp bài tập</h2>
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Chưa có bài tập nào được nộp.</p>
                <p className="text-xs mt-1">Hoàn thành bài tập trong tab Bài học để thấy lịch sử ở đây.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <Card key={sub.id} className="border hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    {/* Header row */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm md:text-base text-foreground truncate">
                          {sub.exercise?.title_vi || 'Bài tập'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Nộp lúc: {formatWithJST(sub.submitted_at, true)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {sub.status === 'graded' ? (
                          <div className="space-y-1">
                            <Badge className="bg-green-500/10 text-green-600 border-green-200 border">✅ Đã chấm</Badge>
                            <p className="text-xl font-extrabold text-primary">
                              {sub.score ?? '—'}<span className="text-xs text-muted-foreground font-normal">/100</span>
                            </p>
                          </div>
                        ) : sub.status === 'reviewed' ? (
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 border">🔵 Đã xem xét</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">⏳ Chờ chấm</Badge>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    {sub.content && (
                      <div className="bg-muted/40 p-3 rounded-lg text-sm text-foreground border">
                        <p className="text-xs font-semibold text-muted-foreground mb-1.5">Nội dung bài làm:</p>
                        <p className="whitespace-pre-wrap leading-relaxed">{sub.content}</p>
                      </div>
                    )}

                    {/* Teacher feedback */}
                    {sub.feedback && (
                      <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg text-sm space-y-1">
                        <span className="font-bold flex items-center gap-1.5 text-primary text-xs">
                          <MessageSquare className="w-3.5 h-3.5" /> Nhận xét từ Giáo viên
                        </span>
                        <p className="text-muted-foreground italic leading-relaxed pl-1">"{sub.feedback}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 5: Attendance (Báo cáo & Lịch sử Điểm danh Chuyên cần) */}
        <TabsContent value="attendance" className="space-y-6">
          {(() => {
            const presentCount = studentAttendance.filter(a => a.status === 'present').length;
            const lateCount = studentAttendance.filter(a => a.status === 'late').length;
            const excusedCount = studentAttendance.filter(a => a.status === 'excused_absence' || a.status === 'excused').length;
            const absentCount = studentAttendance.filter(a => a.status === 'absent').length;
            const totalTarget = selectedClass?.total_sessions || sessions.length || 24;
            const totalAttended = presentCount + lateCount;
            const ratePercent = totalTarget > 0 ? Math.round((totalAttended / totalTarget) * 100) : 0;

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-emerald-500/10 border-emerald-500/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground font-medium">Tỉ lệ chuyên cần</p>
                      <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{ratePercent}%</p>
                      <Progress value={ratePercent} className="h-1.5 mt-2 bg-emerald-200 dark:bg-emerald-950" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Có mặt / Đi muộn</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{presentCount} <span className="text-xs text-muted-foreground">có mặt</span> + {lateCount} <span className="text-xs text-muted-foreground">muộn</span></p>
                      <p className="text-[11px] text-muted-foreground mt-1">trên tổng số {totalTarget} buổi</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Báo vắng có phép</p>
                      <p className="text-2xl font-bold text-amber-600 mt-1">{excusedCount}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Đã gửi thông báo cho GV</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground font-medium">Vắng không phép</p>
                      <p className="text-2xl font-bold text-destructive mt-1">{absentCount}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Cần liên hệ xếp học bù</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Session Attendance Table */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Bảng chi tiết điểm danh từng buổi
                      </CardTitle>
                      <CardDescription className="text-xs">Theo dõi lịch sử tham gia học tập của bạn</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {sessions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">Chưa có lịch buổi học nào</div>
                    ) : (
                      <div className="space-y-2">
                        {sessions.map((sess, idx) => {
                          const att = studentAttendance.find(a => a.session_date === sess.session_date || a.session_id === sess.id);
                          const status = att?.status || 'unmarked';

                          const getBadge = () => {
                            switch (status) {
                              case 'present':
                                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300">🟢 Có mặt</Badge>;
                              case 'late':
                                return <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-300">🟡 Đi muộn</Badge>;
                              case 'excused_absence':
                              case 'excused':
                                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300">🟠 Vắng có phép</Badge>;
                              case 'absent':
                                return <Badge variant="destructive">🔴 Vắng mặt</Badge>;
                              default:
                                return <Badge variant="outline" className="text-muted-foreground">⚪ Chưa điểm danh</Badge>;
                            }
                          };

                          return (
                            <div key={sess.id} className="flex flex-wrap items-center justify-between p-3 border rounded-xl bg-card hover:bg-muted/30 text-sm gap-2">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground min-w-[55px] text-center">
                                  Buổi {idx + 1}
                                </span>
                                <div>
                                  <p className="font-semibold text-foreground">{sess.topic || 'Buổi học'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    📅 {formatWithJST(sess.session_date, false)} - ⏰ {formatTimeWithJST(sess.start_time)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getBadge()}
                                {status === 'unmarked' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                                    onClick={() => {
                                      setSelectedSessionToAbsence(sess);
                                      setIsAbsenceDialogOpen(true);
                                    }}
                                  >
                                    Xin nghỉ
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* Absence Request Dialog */}
      <Dialog open={isAbsenceDialogOpen} onOpenChange={setIsAbsenceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <UserX className="w-5 h-5" /> Báo vắng học / Xin nghỉ
            </DialogTitle>
          </DialogHeader>
          {selectedSessionToAbsence && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/40 p-3 rounded-lg border space-y-1 text-sm">
                <p className="font-bold text-foreground">{selectedSessionToAbsence.topic || 'Buổi học trực tuyến'}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>📅 {formatWithJST(selectedSessionToAbsence.session_date, false)}</span>
                  <span>⏰ {formatTimeWithJST(selectedSessionToAbsence.start_time)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Lý do xin vắng học</Label>
                <Textarea
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  placeholder="Ví dụ: Có lịch bận đột xuất, bị ốm,..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-xs text-amber-800 dark:text-amber-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <span>Thông báo vắng sẽ được tự động gửi tới giáo viên phụ trách để xếp lịch học bù cho bạn khi có lớp bù phù hợp.</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAbsenceDialogOpen(false)}>Hủy</Button>
            <Button
              variant="destructive"
              onClick={handleRequestAbsence}
              disabled={submittingAbsence}
            >
              {submittingAbsence ? 'Đang gửi...' : 'Gửi thông báo vắng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Record Player Modal for Students */}
      {playingVideoRecord && (
        <SessionVideoPlayer
          videoUrl={playingVideoRecord.url}
          title={playingVideoRecord.title}
          isOpen={!!playingVideoRecord}
          onClose={() => setPlayingVideoRecord(null)}
        />
      )}

      {/* Student Detailed Submission Analysis Modal */}
      <StudentSubmissionAnalysisModal
        open={analysisModalOpen}
        onOpenChange={setAnalysisModalOpen}
        data={analysisModalData}
      />
    </div>
  );
};

export default MyClasses;

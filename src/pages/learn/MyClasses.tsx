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
  Play, ExternalLink, Download, Maximize2, Sparkles, Dumbbell
} from 'lucide-react';
import { formatWithJST, formatTimeWithJST } from '@/lib/dateUtils';
import { sendAbsenceNotification } from '@/lib/emailService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { InlineLessonExercises } from '@/components/learning/InlineLessonExercises';
import { InlineLessonPresentation } from '@/components/teacher/InlineLessonPresentation';
import ClassLessonOrganizer from '@/components/teacher/ClassLessonOrganizer';
import SessionVideoPlayer from '@/components/shared/SessionVideoPlayer';

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
  duration_minutes: number;
  meet_link: string | null;
  max_score: number;
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

const MyClasses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  
  // Dashboard details state
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  // Active lesson details inside classroom
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showInlinePresentation, setShowInlinePresentation] = useState(false);
  const [useGooglePdfEmbed, setUseGooglePdfEmbed] = useState(false);

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
      setExams(examsData || []);

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
          </div>
        </div>
      </div>

      <Tabs defaultValue="stream" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl w-full md:w-auto flex flex-wrap gap-1">
          <TabsTrigger value="stream" className="rounded-lg text-xs md:text-sm font-semibold">Bảng tin</TabsTrigger>
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
                              <Button size="sm" variant="hero" className="gap-2 shrink-0" asChild>
                                <a href={session.meet_link} target="_blank" rel="noopener noreferrer">
                                  <Video className="w-4 h-4" /> Vào học Meeting
                                </a>
                              </Button>
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
          {exams.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                Không có bài kiểm tra nào sắp diễn ra.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => {
                const examDateTime = new Date(`${exam.exam_date}T${exam.start_time}`);
                const isLocked = new Date() < examDateTime;
                return (
                  <Card key={exam.id} className={isLocked ? 'opacity-90 bg-muted/20' : ''}>
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="capitalize">{exam.exam_type}</Badge>
                          <p className="font-semibold text-sm sm:text-base text-foreground">{exam.title_vi}</p>
                          {isLocked ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 text-xs">
                              🔒 Đúng giờ thi mới mở phòng
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-xs">
                              🟢 Đã mở xem & vào thi
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span>Lịch thi: {formatWithJST(`${exam.exam_date}T${exam.start_time}`, true)}</span>
                          <span>Thời gian: {exam.duration_minutes} phút</span>
                        </div>
                      </div>
                      {exam.meet_link && (
                        <Button 
                          size="sm" 
                          variant={isLocked ? "outline" : "hero"} 
                          className="gap-2 shrink-0 w-full sm:w-auto font-semibold"
                          disabled={isLocked}
                          asChild={!isLocked}
                        >
                          {isLocked ? (
                            <span>🔒 Chưa đến giờ thi</span>
                          ) : (
                            <a href={exam.meet_link} target="_blank" rel="noopener noreferrer">
                              <Video className="w-4 h-4 text-primary" /> Phòng thi Online
                            </a>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 4: Submissions (Bài nộp) */}
        <TabsContent value="submissions" className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Lịch sử nộp bài & Điểm số</h2>
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                Bạn chưa nộp bài tập nào cho lớp học này.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <Card key={sub.id} className="border border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-semibold text-sm md:text-base text-foreground">
                          {sub.exercise?.title_vi || 'Bài làm tập làm văn/phát âm'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Nộp lúc: {formatWithJST(sub.submitted_at, true)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {sub.status === 'graded' ? (
                          <div className="space-y-1">
                            <Badge className="bg-green-500/10 text-green-600 border-green-200">
                              Đã chấm điểm
                            </Badge>
                            <p className="text-base font-extrabold text-primary pt-0.5">
                              {sub.score}/100
                            </p>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
                            Chờ chấm điểm
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="bg-muted/40 p-3 rounded-lg text-xs md:text-sm text-muted-foreground whitespace-pre-wrap border">
                      <strong>Nội dung bài làm:</strong>
                      <p className="mt-1 bg-background p-2 rounded border">{sub.content}</p>
                    </div>

                    {sub.feedback && (
                      <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg text-xs md:text-sm text-foreground space-y-1">
                        <span className="font-bold flex items-center gap-1 text-primary">
                          <MessageSquare className="w-3.5 h-3.5" /> Nhận xét từ Giáo viên:
                        </span>
                        <p className="italic text-muted-foreground pl-4">"{sub.feedback}"</p>
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
    </div>
  );
};

export default MyClasses;

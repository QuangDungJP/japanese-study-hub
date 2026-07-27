import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Building, GraduationCap, Calendar, Video, Clock, 
  BookOpen, FileText, CheckCircle2, MessageSquare, Star, ArrowLeft
} from 'lucide-react';
import { formatWithJST, formatTimeWithJST } from '@/lib/dateUtils';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
        <TabsList className="bg-muted p-1 rounded-xl w-full md:w-auto grid grid-cols-4">
          <TabsTrigger value="stream" className="rounded-lg text-xs md:text-sm font-semibold">Bảng tin</TabsTrigger>
          <TabsTrigger value="lessons" className="rounded-lg text-xs md:text-sm font-semibold">Bài học</TabsTrigger>
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
                  {sessions.map((session) => (
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
                          </div>
                        </div>
                        {session.meet_link ? (
                          <Button size="sm" variant="hero" className="gap-2 w-full md:w-auto shrink-0" asChild>
                            <a href={session.meet_link} target="_blank" rel="noopener noreferrer">
                              <Video className="w-4 h-4" /> Vào học Zoom
                            </a>
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-xs">Chưa có link</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
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

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getSkillBadgeColor(activeLesson.skill)}>
                          {getSkillLabel(activeLesson.skill)}
                        </Badge>
                        <Badge variant="outline">{activeLesson.level}</Badge>
                      </div>
                      <CardTitle className="text-xl md:text-2xl font-bold">{activeLesson.title_vi}</CardTitle>
                      <CardDescription>{activeLesson.title}</CardDescription>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0 mt-2 md:mt-0">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {activeLesson.duration_minutes} phút</span>
                      <span className="flex items-center gap-1 text-yellow-500 font-bold"><Star className="w-4 h-4 fill-yellow-500" /> +{activeLesson.xp_reward} XP</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* External Slide / Google Drive Link if any */}
                  {activeLesson.slide_url && (
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-primary" />
                        <div>
                          <p className="font-bold text-sm text-foreground">Slide bài giảng / Link trình chiếu</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{activeLesson.slide_url}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="hero" asChild className="shrink-0 font-semibold gap-1.5">
                        <a href={activeLesson.slide_url} target="_blank" rel="noopener noreferrer">
                          Xem Slide
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Attached Document PDF/DOCX file if any */}
                  {activeLesson.document_url && (
                    <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <div>
                          <p className="font-bold text-sm text-foreground">Tệp tài liệu đính kèm (PDF/Word/PPTX)</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{activeLesson.document_url.split('/').pop()}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild className="shrink-0 font-semibold gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50">
                        <a href={activeLesson.document_url} target="_blank" rel="noopener noreferrer">
                          Tải tài liệu
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Video Lesson if any */}
                  {/* Lesson text content rendered */}
                  {activeLesson.content_html ? (
                    <div className="border rounded-xl p-6 bg-card prose prose-indigo dark:prose-invert max-w-none leading-relaxed">
                      <div dangerouslySetInnerHTML={{ __html: activeLesson.content_html }} />
                    </div>
                  ) : !activeLesson.slide_url && !activeLesson.document_url && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Bài học này chưa cập nhật nội dung chi tiết.
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Luyện tập bài tập của bài học này để ghi điểm XP.
                    </p>
                    <Button onClick={() => navigate('/learn/exercises')} className="w-full sm:w-auto font-semibold">
                      Làm bài tập ngay
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Lesson list */
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">Bài giảng & tài liệu học tập</h2>
              {lessons.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    Chưa có bài học nào được đăng cho lớp này.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lessons.map((lesson) => (
                    <Card key={lesson.id} className="hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => setActiveLesson(lesson)}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <Badge className={getSkillBadgeColor(lesson.skill)}>
                            {getSkillLabel(lesson.skill)}
                          </Badge>
                          <Badge variant="outline">{lesson.level}</Badge>
                        </div>
                        <CardTitle className="text-base font-bold pt-2">{lesson.title_vi}</CardTitle>
                        <CardDescription className="text-xs line-clamp-1">{lesson.title}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3 text-xs text-muted-foreground flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {lesson.duration_minutes} phút
                        </span>
                        <span className="font-semibold text-yellow-600">
                          +{lesson.xp_reward} XP
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
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
              {exams.map((exam) => (
                <Card key={exam.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="capitalize">{exam.exam_type}</Badge>
                        <p className="font-semibold text-sm sm:text-base text-foreground">{exam.title_vi}</p>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>Lịch thi: {formatWithJST(`${exam.exam_date}T${exam.start_time}`, true)}</span>
                        <span>Thời gian: {exam.duration_minutes} phút</span>
                      </div>
                    </div>
                    {exam.meet_link && (
                      <Button size="sm" variant="outline" className="gap-2 shrink-0 w-full sm:w-auto" asChild>
                        <a href={exam.meet_link} target="_blank" rel="noopener noreferrer">
                          <Video className="w-4 h-4 text-primary" /> Phòng thi Online
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
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
      </Tabs>
    </div>
  );
};

export default MyClasses;

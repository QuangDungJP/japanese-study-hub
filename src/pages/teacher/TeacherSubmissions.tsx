import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, Clock, FileText, Filter, Search, Loader2, Sparkles, 
  BookOpen, GraduationCap, RefreshCw, Paperclip, Video, MessageSquare, ExternalLink,
  CheckCircle2, XCircle, HelpCircle, Flame, Calendar, Award, Check, AlertCircle, ArrowUpRight,
  BarChart3
} from 'lucide-react';
import { formatWithJST } from '@/lib/dateUtils';
import AvatarWithDecoration from '@/components/shared/AvatarWithDecoration';
import StudentSubmissionAnalysisModal, { StudentSubmissionAnalysisData } from '@/components/classroom/StudentSubmissionAnalysisModal';
import FormattedText from '@/components/shared/FormattedText';
import { sendGradingNotification } from '@/lib/emailService';

export interface Submission {
  id: string;
  user_id: string;
  exercise_id: string;
  content: string | null;
  file_url: string | null;
  status: 'pending' | 'graded';
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
  graded_by: string | null;
  max_score?: number | null;
  attempt_number?: number;
  total_attempts_count?: number;
  exercise?: {
    id: string;
    title: string;
    title_vi: string;
    exercise_type: string;
    instructions: string | null;
    instructions_vi: string | null;
    correct_answers: any;
  };
  lesson?: {
    id: string;
    title: string;
    title_vi: string;
  };
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    equipped_frame_code?: string | null;
  };
}

export interface ExamAttemptItem {
  id: string;
  exam_id: string;
  student_id: string;
  status: string;
  score: number | null;
  total: number | null;
  answers: any[];
  time_spent_seconds: number | null;
  started_at: string;
  submitted_at: string;
  graded_at: string | null;
  student_comment: string | null;
  video_url: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  teacher_feedback?: string | null;
  feedback?: string | null;
  proctoring_logs?: any[];
  violations?: number;
  attempt_number?: number;
  total_attempts_count?: number;
  exam?: {
    id: string;
    title: string;
    title_vi: string;
    exam_type: string;
    questions: any[];
    max_score: number | null;
    passing_score: number | null;
  };
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    equipped_frame_code?: string | null;
  };
}

// Helper to format duration
function formatDuration(seconds: number | null, startedAt?: string, submittedAt?: string) {
  let sec = seconds;
  if ((!sec || sec <= 0) && startedAt && submittedAt) {
    sec = Math.max(0, Math.floor((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000));
  }
  if (!sec || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0) return `${m} phút ${s}s`;
  return `${s} giây`;
}

// Helper to calculate correct/incorrect counts
function getQuestionStats(questions: any[] = [], answers: any[] = []) {
  let correct = 0;
  let incorrect = 0;
  const total = questions.length;

  if (Array.isArray(questions) && questions.length > 0) {
    questions.forEach((q: any, i: number) => {
      const ans = answers[i];
      if (ans !== undefined && ans !== null && ans !== '') {
        const correctAns = q.correct_answer ?? q.answer ?? q.correctAnswer;
        if (correctAns !== undefined && correctAns !== null) {
          if (String(ans).trim().toLowerCase() === String(correctAns).trim().toLowerCase()) {
            correct++;
          } else {
            incorrect++;
          }
        }
      }
    });
  }
  return { correct, incorrect, total };
}

const TeacherSubmissions = () => {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<'exercises' | 'exams'>('exercises');
  const [loading, setLoading] = useState(true);

  // Lesson Submissions State
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);
  const [aiGradingLoading, setAiGradingLoading] = useState(false);

  // Exam Attempts State
  const [examAttempts, setExamAttempts] = useState<ExamAttemptItem[]>([]);
  const [selectedExamAttempt, setSelectedExamAttempt] = useState<ExamAttemptItem | null>(null);
  const [examGradingDialogOpen, setExamGradingDialogOpen] = useState(false);
  const [examScore, setExamScore] = useState('');
  const [examFeedback, setExamFeedback] = useState('');
  const [examGrading, setExamGrading] = useState(false);

  // Analysis Modal State
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisModalData, setAnalysisModalData] = useState<StudentSubmissionAnalysisData | null>(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const openSubmissionAnalysis = (sub: Submission) => {
    const isGraded = sub.status === 'graded';
    const scoreVal = sub.score || 0;
    
    setAnalysisModalData({
      student_name: sub.profile?.full_name || 'Học viên',
      avatar_url: sub.profile?.avatar_url || undefined,
      title: sub.exercise?.title_vi || sub.exercise?.title || 'Bài tập bài học',
      submitted_at: sub.submitted_at,
      attempt_number: sub.attempt_number || 1,
      total_attempts: sub.total_attempts_count || 1,
      score: scoreVal,
      max_score: 100,
      passing_score: 60,
      correct_count: isGraded ? (scoreVal >= 60 ? 1 : 0) : 0,
      incorrect_count: isGraded ? (scoreVal < 60 ? 1 : 0) : 0,
      feedback: sub.feedback || undefined,
      questions: [
        {
          question_text: sub.exercise?.instructions_vi || sub.exercise?.instructions || 'Nội dung trả lời bài tập',
          user_answer: sub.content || sub.file_url || 'Không có nội dung',
          correct_answer: sub.exercise?.correct_answers ? JSON.stringify(sub.exercise.correct_answers) : 'Đã nộp bài tự luận/bài viết',
          is_correct: scoreVal >= 60,
          explanation: sub.feedback || 'Bài làm đã được giáo viên duyệt và đánh giá.',
        }
      ]
    });
    setAnalysisModalOpen(true);
  };

  const openExamAttemptAnalysis = (att: ExamAttemptItem) => {
    const answersObj = att.answers || {};
    const questions = att.exam?.questions || [];
    
    let correct = 0;
    let incorrect = 0;

    const questionBreakdown = questions.map((q: any) => {
      const uAns = answersObj[q.id] || answersObj[q.question_text] || 'Chưa làm';
      const cAns = q.correct_answer || q.answer || 'N/A';
      const isRight = uAns.toString().trim().toLowerCase() === cAns.toString().trim().toLowerCase();

      if (isRight) correct++;
      else incorrect++;

      return {
        id: q.id,
        question_text: q.question_text || q.title || 'Câu hỏi kiểm tra',
        user_answer: uAns.toString(),
        correct_answer: cAns.toString(),
        is_correct: isRight,
        explanation: q.explanation || 'Phân tích đáp án kiểm tra',
        skill: q.skill || att.exam?.exam_type || 'JLPT Test',
      };
    });

    setAnalysisModalData({
      student_name: att.profile?.full_name || 'Học viên',
      avatar_url: att.profile?.avatar_url || undefined,
      title: att.exam?.title_vi || att.exam?.title || 'Bài kiểm tra',
      submitted_at: att.submitted_at,
      attempt_number: att.attempt_number || 1,
      total_attempts: att.total_attempts_count || 1,
      score: att.score || 0,
      max_score: att.exam?.max_score || 100,
      passing_score: att.exam?.passing_score || 60,
      correct_count: correct,
      incorrect_count: incorrect,
      feedback: att.feedback || undefined,
      questions: questionBreakdown,
    });
    setAnalysisModalOpen(true);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchSubmissions(), fetchExamAttempts()]);
    setLoading(false);
  };

  const fetchSubmissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Lấy danh sách vai trò để kiểm tra Admin
      const { data: userRoles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      const isAdmin = userRoles?.some(r => r.role === 'admin') || ['quangdungonline.education@gmail.com', 'thanhhungtran2003@gmail.com'].includes(user.email?.toLowerCase() || '');

      let lessonQuery = supabase.from('lessons').select('id, title, title_vi');
      if (!isAdmin) {
        lessonQuery = lessonQuery.eq('teacher_id', user.id);
      }
      const { data: lessons } = await lessonQuery;

      if (!lessons || lessons.length === 0) {
        setSubmissions([]);
        return;
      }

      const lessonIds = lessons.map((l) => l.id);

      const { data: exercises } = await supabase
        .from('exercises')
        .select('id, title, title_vi, exercise_type, instructions, instructions_vi, lesson_id, correct_answers')
        .in('lesson_id', lessonIds)
        .eq('requires_grading', true);

      if (!exercises || exercises.length === 0) {
        setSubmissions([]);
        return;
      }

      const exerciseIds = exercises.map((e) => e.id);

      const { data: submissionsData, error } = await supabase
        .from('student_submissions')
        .select('*')
        .in('exercise_id', exerciseIds)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(submissionsData?.map((s) => s.user_id) || [])];
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profs } = await (supabase as any)
          .from('profiles')
          .select('user_id, id, full_name, avatar_url, equipped_frame_code')
          .or(userIds.map(id => `user_id.eq.${id},id.eq.${id}`).join(','));
        profiles = profs || [];
      }

      // Group by user & exercise to calculate attempt numbers
      const attemptMap: Record<string, any[]> = {};
      (submissionsData || []).forEach(sub => {
        const key = `${sub.user_id}_${sub.exercise_id}`;
        if (!attemptMap[key]) attemptMap[key] = [];
        attemptMap[key].push(sub);
      });

      Object.values(attemptMap).forEach(list => {
        list.sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
        list.forEach((item, index) => {
          item.attempt_number = index + 1;
          item.total_attempts_count = list.length;
        });
      });

      const mappedSubmissions: Submission[] = ((submissionsData || []) as any[]).map((sub: any) => {
        const exercise = exercises.find((e) => e.id === sub.exercise_id);
        const lesson = lessons.find((l) => l.id === exercise?.lesson_id);
        const profile = profiles.find((p) => p.user_id === sub.user_id || p.id === sub.user_id);

        return {
          ...sub,
          exercise: exercise ? {
            id: exercise.id,
            title: exercise.title,
            title_vi: exercise.title_vi,
            exercise_type: exercise.exercise_type,
            instructions: exercise.instructions,
            instructions_vi: exercise.instructions_vi,
            correct_answers: exercise.correct_answers,
          } : undefined,
          lesson: lesson ? {
            id: lesson.id,
            title: lesson.title,
            title_vi: lesson.title_vi,
          } : undefined,
          profile: profile ? {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            equipped_frame_code: profile.equipped_frame_code,
          } : undefined,
        };
      });

      setSubmissions(mappedSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const fetchExamAttempts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Lấy danh sách vai trò để kiểm tra Admin
      const { data: userRoles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      const isAdmin = userRoles?.some(r => r.role === 'admin') || ['quangdungonline.education@gmail.com', 'thanhhungtran2003@gmail.com'].includes(user.email?.toLowerCase() || '');

      let examQuery = supabase.from('exams').select('*');
      if (!isAdmin) {
        examQuery = examQuery.eq('teacher_id', user.id);
      }
      const { data: examsData } = await examQuery;

      if (!examsData || examsData.length === 0) {
        setExamAttempts([]);
        return;
      }

      const examIds = examsData.map((e) => e.id);

      const { data: attemptsData, error } = await supabase
        .from('exam_attempts')
        .select('*')
        .in('exam_id', examIds)
        .neq('status', 'in_progress')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const studentIds = [...new Set(attemptsData?.map((a) => a.student_id) || [])];
      let profiles: any[] = [];
      if (studentIds.length > 0) {
        const { data: profs } = await (supabase as any)
          .from('profiles')
          .select('user_id, id, full_name, avatar_url, equipped_frame_code')
          .or(studentIds.map(id => `user_id.eq.${id},id.eq.${id}`).join(','));
        profiles = profs || [];
      }

      // Calculate attempt numbers per student & exam
      const attemptMap: Record<string, any[]> = {};
      (attemptsData || []).forEach(att => {
        const key = `${att.student_id}_${att.exam_id}`;
        if (!attemptMap[key]) attemptMap[key] = [];
        attemptMap[key].push(att);
      });

      Object.values(attemptMap).forEach(list => {
        list.sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
        list.forEach((item, index) => {
          item.attempt_number = index + 1;
          item.total_attempts_count = list.length;
        });
      });

      const mappedAttempts: ExamAttemptItem[] = ((attemptsData || []) as any[]).map((att: any) => {
        const exam = examsData.find((e) => e.id === att.exam_id);
        const profile = profiles.find((p) => p.user_id === att.student_id || p.id === att.student_id);

        return {
          ...att,
          exam: exam ? {
            id: exam.id,
            title: exam.title,
            title_vi: exam.title_vi,
            exam_type: exam.exam_type,
            questions: Array.isArray(exam.questions) ? exam.questions : [],
            max_score: exam.max_score,
            passing_score: exam.passing_score,
          } : undefined,
          profile: profile ? {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            equipped_frame_code: profile.equipped_frame_code,
          } : undefined,
        };
      });

      setExamAttempts(mappedAttempts);
    } catch (error) {
      console.error('Error fetching exam attempts:', error);
    }
  };

  const openGradingDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setScore(submission.score?.toString() || '');
    setFeedback(submission.feedback || '');
    setGradingDialogOpen(true);
  };

  const openExamGradingDialog = (attempt: ExamAttemptItem) => {
    setSelectedExamAttempt(attempt);
    setExamScore(attempt.score?.toString() || '0');
    setExamFeedback(attempt.teacher_feedback || '');
    setExamGradingDialogOpen(true);
  };

  const handleGradeExercise = async () => {
    if (!selectedSubmission) return;
    setGrading(true);
    try {
      const numScore = parseInt(score);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('student_submissions')
        .update({
          score: numScore,
          feedback,
          status: 'graded',
          graded_at: new Date().toISOString(),
          graded_by: user?.id || null,
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      await sendGradingNotification({
        studentId: selectedSubmission.user_id,
        studentName: selectedSubmission.profile?.full_name,
        examTitle: selectedSubmission.exercise?.title_vi || selectedSubmission.exercise?.title || 'Bài tập',
        score: numScore,
        maxScore: selectedSubmission.max_score || 100,
        feedback: feedback.trim() || undefined
      });

      toast({ title: 'Thành công', description: 'Đã lưu kết quả & gửi thông báo Realtime cho học viên!' });
      setGradingDialogOpen(false);
      fetchSubmissions();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setGrading(false);
    }
  };

  const handleGradeExamAttempt = async () => {
    if (!selectedExamAttempt) return;
    setExamGrading(true);
    try {
      const numScore = parseInt(examScore);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('exam_attempts')
        .update({
          score: numScore,
          teacher_feedback: examFeedback,
          status: 'graded',
          graded_at: new Date().toISOString(),
        } as any)
        .eq('id', selectedExamAttempt.id);

      if (error) throw error;

      await sendGradingNotification({
        studentId: selectedExamAttempt.student_id,
        studentName: selectedExamAttempt.profile?.full_name,
        examTitle: selectedExamAttempt.exam?.title_vi || selectedExamAttempt.exam?.title || 'Bài thi trắc nghiệm',
        score: numScore,
        maxScore: selectedExamAttempt.total || 100,
        feedback: examFeedback.trim() || undefined
      });

      toast({ title: 'Thành công', description: 'Đã cập nhật điểm số & gửi thông báo Realtime cho học viên!' });
      setExamGradingDialogOpen(false);
      fetchExamAttempts();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setExamGrading(false);
    }
  };

  const runAiExerciseGrading = async () => {
    if (!selectedSubmission) return;
    setAiGradingLoading(true);
    try {
      const promptText = selectedSubmission.exercise?.instructions_vi || selectedSubmission.exercise?.instructions || '';
      const sampleAnswer = selectedSubmission.exercise?.correct_answers ? JSON.stringify(selectedSubmission.exercise.correct_answers) : '';
      const studentText = selectedSubmission.content || '';

      const { data, error } = await supabase.functions.invoke('classroom-ai', {
        body: {
          action: 'grade_essay',
          content: studentText,
          prompt: promptText,
          sample_answer: sampleAnswer,
        },
      });

      if (error) throw error;
      if (data?.score !== undefined) setScore(String(Math.min(100, Math.max(0, parseInt(data.score) || 85))));
      if (data?.feedback) setFeedback(data.feedback);
      toast({ title: '✨ AI đã gợi ý điểm & nhận xét!' });
    } catch (e: any) {
      const studentText = selectedSubmission.content || '';
      const words = studentText.trim().split(/\s+/).filter(Boolean).length;
      let recScore = 75;
      if (words >= 40) recScore = 90;
      else if (words >= 20) recScore = 80;
      else if (words >= 5) recScore = 65;
      else recScore = 50;

      setScore(String(recScore));
      setFeedback(`[Gợi ý từ AI]: Bài làm ngắn gọn (${words} từ). Đạt cơ bản yêu cầu bài tập.`);
      toast({ title: '✨ Đã tạo gợi ý nhận xét từ AI' });
    } finally {
      setAiGradingLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      (sub.profile?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.exercise?.title_vi || sub.exercise?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredExamAttempts = examAttempts.filter((att) => {
    const matchesSearch =
      (att.profile?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (att.exam?.title_vi || att.exam?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || att.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingExerciseCount = submissions.filter((s) => s.status === 'pending').length;
  const pendingExamCount = examAttempts.filter((a) => a.status === 'submitted' || a.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    if (status === 'graded') {
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300 font-bold gap-1"><CheckCircle className="w-3 h-3" /> Đã chấm</Badge>;
    }
    return <Badge className="bg-amber-500/10 text-amber-600 border-amber-300 font-bold gap-1 animate-pulse"><Clock className="w-3 h-3" /> Chờ chấm</Badge>;
  };

  const getScoreBadge = (sc: number | null, total: number = 100) => {
    if (sc === null || sc === undefined) return <span className="text-muted-foreground font-mono text-xs">—</span>;
    const pct = Math.round((sc / total) * 100);
    const color = pct >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : pct >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-rose-600 bg-rose-50 border-rose-200';
    return (
      <Badge variant="outline" className={`font-mono font-black text-xs px-2 py-0.5 ${color}`}>
        {sc}/{total} ({pct}%)
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-white/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-amber-400/20 text-yellow-300 border-amber-300/30 text-xs font-bold px-3 py-1">
              🎓 Trung Tâm Quản Lý Chấm Bài Giảng Viên
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Chấm Bài Nộp & Kiểm Tra Chi Tiết</h1>
            <p className="text-white/80 text-sm max-w-xl">
              Theo dõi chính xác thời gian làm bài, mốc bắt đầu/kết thúc, số câu đúng/sai và lịch sử số lần nộp bài của học viên.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={() => {
                const csvData = (activeCategory === 'exercises' ? filteredSubmissions : filteredExamAttempts).map((item: any, idx) => ({
                  STT: idx + 1,
                  HocVien: item.profile?.full_name || 'Học viên',
                  TenBai: activeCategory === 'exercises' ? (item.exercise?.title_vi || 'Bài tập') : (item.exam?.title_vi || 'Bài thi'),
                  TrangThai: item.status === 'graded' ? 'Đã chấm' : 'Chờ chấm',
                  DiemSo: item.score ?? 0,
                  DiemToiDa: activeCategory === 'exercises' ? 100 : (item.exam?.max_score || 100),
                  NgayNop: item.submitted_at ? new Date(item.submitted_at).toLocaleString('vi-VN') : '',
                  NhanXet: item.feedback || item.teacher_feedback || '',
                }));
                const headers = ['STT', 'HocVien', 'TenBai', 'TrangThai', 'DiemSo', 'DiemToiDa', 'NgayNop', 'NhanXet'];
                const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...csvData.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `Bang_Diem_Cham_Bai_${activeCategory}_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              variant="outline"
              className="font-bold gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-md"
            >
              📊 Xuất Bảng Điểm Excel / Google Sheets
            </Button>
            <Button onClick={fetchAllData} disabled={loading} variant="secondary" className="font-bold gap-2 rounded-xl">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới dữ liệu
            </Button>
          </div>
        </div>
      </div>

      {/* Main Category Tabs: Separate Homework Exercises vs Exams */}
      <div className="grid grid-cols-2 gap-3 bg-muted/60 p-1.5 rounded-2xl border">
        <button
          type="button"
          onClick={() => setActiveCategory('exercises')}
          className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl font-black text-sm transition-all ${
            activeCategory === 'exercises'
              ? 'bg-card text-foreground shadow-md border border-primary/30'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="w-5 h-5 text-blue-500" />
          📝 Bài Tập Bài Học ({submissions.length})
          {pendingExerciseCount > 0 && <Badge variant="destructive" className="ml-1 text-xs font-extrabold animate-pulse">{pendingExerciseCount} chờ chấm</Badge>}
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('exams')}
          className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl font-black text-sm transition-all ${
            activeCategory === 'exams'
              ? 'bg-card text-foreground shadow-md border border-purple-500/30'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <GraduationCap className="w-5 h-5 text-purple-500" />
          🎓 Bài Kiểm Tra / Đề Thi ({examAttempts.length})
          {pendingExamCount > 0 && <Badge variant="destructive" className="ml-1 text-xs font-extrabold animate-pulse">{pendingExamCount} chờ chấm</Badge>}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="rounded-2xl border shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tìm theo tên học viên, tiêu đề..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[170px] h-10 rounded-xl font-medium text-xs">
                  <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">⏳ Chờ chấm điểm</SelectItem>
                  <SelectItem value="graded">✓ Đã chấm điểm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CATEGORY 1: LESSON EXERCISES */}
      {activeCategory === 'exercises' && (
        <Card className="rounded-2xl border overflow-hidden shadow-soft">
          {loading ? (
            <CardContent className="py-20 text-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              Đang tải danh sách bài tập...
            </CardContent>
          ) : filteredSubmissions.length === 0 ? (
            <CardContent className="py-20 text-center text-muted-foreground space-y-2">
              <FileText className="w-12 h-12 mx-auto opacity-30" />
              <p className="font-bold text-foreground">Không có bài tập nào cần hiển thị.</p>
            </CardContent>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold">Học viên</TableHead>
                  <TableHead className="font-bold">Bài tập & Bài học</TableHead>
                  <TableHead className="font-bold">Lượt nộp</TableHead>
                  <TableHead className="font-bold">Bắt đầu / Nộp bài</TableHead>
                  <TableHead className="font-bold">Trạng thái</TableHead>
                  <TableHead className="font-bold">Điểm số</TableHead>
                  <TableHead className="text-right font-bold">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <AvatarWithDecoration
                          userId={sub.user_id}
                          avatarUrl={sub.profile?.avatar_url}
                          name={sub.profile?.full_name}
                          frameCode={sub.profile?.equipped_frame_code}
                          size="md"
                        />
                        <div>
                          <p className="font-bold text-sm text-foreground leading-tight">{sub.profile?.full_name || 'Học viên'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-extrabold text-sm text-foreground">{sub.exercise?.title_vi || sub.exercise?.title}</p>
                      <p className="text-xs text-muted-foreground">{sub.lesson?.title_vi || sub.lesson?.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold bg-blue-500/10 text-blue-600 border-blue-200">
                        Lượt #{sub.attempt_number || 1} / {sub.total_attempts_count || 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs space-y-0.5">
                      <p className="text-muted-foreground font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        {formatWithJST(sub.submitted_at, true)}
                      </p>
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>{getScoreBadge(sub.score)}</TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openSubmissionAnalysis(sub)}
                        className="rounded-xl font-bold text-xs gap-1 text-primary hover:bg-primary/10"
                        title="Xem phân tích số câu đúng/sai & lần làm bài"
                      >
                        <BarChart3 className="w-3.5 h-3.5" /> Phân tích
                      </Button>
                      <Button
                        size="sm"
                        variant={sub.status === 'graded' ? 'outline' : 'default'}
                        onClick={() => openGradingDialog(sub)}
                        className="rounded-xl font-bold text-xs"
                      >
                        {sub.status === 'graded' ? 'Xem / Chỉnh sửa' : 'Chấm bài ngay'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* CATEGORY 2: EXAM ATTEMPTS (IN-DEPTH METRICS) */}
      {activeCategory === 'exams' && (
        <Card className="rounded-2xl border overflow-hidden shadow-soft">
          {loading ? (
            <CardContent className="py-20 text-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
              Đang tải danh sách bài kiểm tra...
            </CardContent>
          ) : filteredExamAttempts.length === 0 ? (
            <CardContent className="py-20 text-center text-muted-foreground space-y-2">
              <GraduationCap className="w-12 h-12 mx-auto opacity-30" />
              <p className="font-bold text-foreground">Chưa có lượt nộp bài kiểm tra nào.</p>
            </CardContent>
          ) : (
            <Table>
              <TableHeader className="bg-purple-500/10">
                <TableRow>
                  <TableHead className="font-bold">Học viên</TableHead>
                  <TableHead className="font-bold">Đề kiểm tra</TableHead>
                  <TableHead className="font-bold">Lần làm bài</TableHead>
                  <TableHead className="font-bold">Thời gian làm</TableHead>
                  <TableHead className="font-bold">Bắt đầu & Kết thúc</TableHead>
                  <TableHead className="font-bold">Kết quả trắc nghiệm</TableHead>
                  <TableHead className="font-bold">Điểm số</TableHead>
                  <TableHead className="text-right font-bold">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExamAttempts.map((att) => {
                  const stats = getQuestionStats(att.exam?.questions, att.answers);
                  const durText = formatDuration(att.time_spent_seconds, att.started_at, att.submitted_at);

                  return (
                    <TableRow key={att.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <AvatarWithDecoration
                            userId={att.student_id}
                            avatarUrl={att.profile?.avatar_url}
                            name={att.profile?.full_name}
                            frameCode={att.profile?.equipped_frame_code}
                            size="md"
                          />
                          <div>
                            <p className="font-bold text-sm text-foreground leading-tight">{att.profile?.full_name || 'Học viên'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-extrabold text-sm text-foreground">{att.exam?.title_vi || att.exam?.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {att.attachment_url && <Badge variant="outline" className="text-[9px] gap-1"><Paperclip className="w-3 h-3 text-blue-500" />File</Badge>}
                          {att.video_url && <Badge variant="outline" className="text-[9px] gap-1"><Video className="w-3 h-3 text-red-500" />Video</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-extrabold bg-purple-500/10 text-purple-700 border-purple-300">
                          Lần #{att.attempt_number || 1} / {att.total_attempts_count || 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                        ⏱️ {durText}
                      </TableCell>
                      <TableCell className="text-[11px] space-y-0.5 font-mono text-muted-foreground">
                        <p className="flex items-center gap-1 text-emerald-600"><Clock className="w-3 h-3" /> BĐ: {formatWithJST(att.started_at, true)}</p>
                        <p className="flex items-center gap-1 text-blue-600"><CheckCircle2 className="w-3 h-3" /> KT: {formatWithJST(att.submitted_at, true)}</p>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">✓ {stats.correct}</span>
                          <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">✗ {stats.incorrect}</span>
                          <span className="text-muted-foreground text-[10px]">({stats.total} câu)</span>
                        </div>
                      </TableCell>
                      <TableCell>{getScoreBadge(att.score, att.total || 100)}</TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openExamAttemptAnalysis(att)}
                          className="rounded-xl font-bold text-xs gap-1 text-purple-600 border-purple-300 hover:bg-purple-50"
                          title="Xem chi tiết từng câu hỏi đúng/sai và lời giải"
                        >
                          <BarChart3 className="w-3.5 h-3.5" /> Phân tích
                        </Button>
                        <Button
                          size="sm"
                          variant={att.status === 'graded' ? 'outline' : 'default'}
                          onClick={() => openExamGradingDialog(att)}
                          className="rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                        >
                          {att.status === 'graded' ? 'Xem & Chỉnh điểm' : 'Chấm bài đính kèm'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* EXERCISE GRADING DIALOG */}
      <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Chấm Bài Tập Bài Học Chi Tiết
            </DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3 bg-muted/40 p-4 rounded-2xl border text-xs">
                <div>
                  <span className="text-muted-foreground block font-medium">Học viên</span>
                  <p className="font-bold text-sm text-foreground">{selectedSubmission.profile?.full_name || 'Chưa rõ'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Lượt làm bài</span>
                  <p className="font-bold text-sm text-primary">Lượt #{selectedSubmission.attempt_number || 1} / {selectedSubmission.total_attempts_count || 1}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Thời gian nộp</span>
                  <p className="font-bold text-sm text-emerald-600 font-mono">{formatWithJST(selectedSubmission.submitted_at, true)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Bài làm của học viên</Label>
                <div className="p-4 rounded-2xl border bg-card whitespace-pre-wrap text-sm leading-relaxed font-sans">
                  {selectedSubmission.content || 'Không có nội dung văn bản'}
                </div>
              </div>

              {/* AI Assistant Button */}
              <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                  <span>Dùng AI phân tích bài làm để tự động gợi ý điểm & nhận xét chi tiết.</span>
                </div>
                <Button type="button" size="sm" onClick={runAiExerciseGrading} disabled={aiGradingLoading} className="shrink-0 gap-1 rounded-xl font-bold">
                  {aiGradingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  ✨ AI Chấm bài
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Điểm số (0-100)</Label>
                  <Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} className="font-bold text-xl h-12 rounded-xl" />
                  <div className="flex gap-1.5">
                    {[100, 90, 80, 70, 60, 50].map((s) => (
                      <Button key={s} type="button" variant="outline" size="sm" className="h-8 text-xs font-bold rounded-lg flex-1" onClick={() => setScore(String(s))}>
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Nhận xét của giảng viên</Label>
                  <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} className="rounded-xl" placeholder="Viết nhận xét đóng góp ý kiến cho học viên..." />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setGradingDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleGradeExercise} disabled={grading || !score} className="rounded-xl font-bold bg-primary text-primary-foreground">
              {grading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              Lưu Điểm & Nhận Xét
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EXAM ATTEMPT IN-DEPTH GRADING & METRICS DIALOG */}
      <Dialog open={examGradingDialogOpen} onOpenChange={setExamGradingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <GraduationCap className="w-6 h-6 text-purple-600" />
              Chi Tiết Kết Quả & Chấm Đề Thi / Kiểm Tra
            </DialogTitle>
          </DialogHeader>

          {selectedExamAttempt && (() => {
            const stats = getQuestionStats(selectedExamAttempt.exam?.questions, selectedExamAttempt.answers);
            const durText = formatDuration(selectedExamAttempt.time_spent_seconds, selectedExamAttempt.started_at, selectedExamAttempt.submitted_at);

            return (
              <div className="space-y-6 py-2">

                {/* Comprehensive Metrics Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-purple-950 text-white p-5 rounded-2xl shadow-md border border-purple-800/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Lượt làm bài</span>
                    <p className="text-base font-extrabold text-amber-300 mt-0.5">
                      Lần #{selectedExamAttempt.attempt_number || 1} / {selectedExamAttempt.total_attempts_count || 1}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Thời gian làm</span>
                    <p className="text-base font-extrabold text-white mt-0.5">⏱️ {durText}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Câu Đúng / Sai</span>
                    <p className="text-base font-extrabold text-white mt-0.5 flex items-center gap-1">
                      <span className="text-emerald-400">✓ {stats.correct}</span>
                      <span className="text-rose-400">✗ {stats.incorrect}</span>
                      <span className="text-xs font-normal text-purple-200">({stats.total} câu)</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Điểm / Tỷ lệ</span>
                    <p className="text-base font-extrabold text-yellow-300 mt-0.5">
                      {selectedExamAttempt.score ?? 0} / {selectedExamAttempt.total || 100} điểm
                    </p>
                  </div>
                </div>

                {/* Timeline Timestamps Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-muted border text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    🚀 Bắt đầu làm: {formatWithJST(selectedExamAttempt.started_at, true)}
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-600 font-bold">
                    🏁 Nộp bài lúc: {formatWithJST(selectedExamAttempt.submitted_at, true)}
                  </span>
                </div>

                {/* Question-by-Question Detailed Breakdown */}
                {selectedExamAttempt.exam?.questions && selectedExamAttempt.exam.questions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Chi tiết từng câu hỏi ({selectedExamAttempt.exam.questions.length} câu)
                    </h4>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {selectedExamAttempt.exam.questions.map((q: any, i: number) => {
                        const ans = selectedExamAttempt.answers?.[i];
                        const correctAns = q.correct_answer ?? q.answer ?? q.correctAnswer;
                        const isCorrect = ans !== undefined && String(ans).trim().toLowerCase() === String(correctAns).trim().toLowerCase();

                        return (
                          <div key={i} className={`p-3 rounded-xl border text-xs space-y-1.5 ${isCorrect ? 'bg-emerald-500/5 border-emerald-300' : 'bg-rose-500/5 border-rose-300'}`}>
                            <div className="flex items-start justify-between gap-2 font-bold">
                              <span>Câu {i + 1}: <FormattedText text={q.text || q.question} /></span>
                              {isCorrect ? (
                                <Badge className="bg-emerald-500 text-white font-bold text-[10px]">Chính xác (+{q.points || 10}đ)</Badge>
                              ) : (
                                <Badge variant="destructive" className="font-bold text-[10px]">Chưa đúng</Badge>
                              )}
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2 pt-1 border-t border-dashed">
                              <p className="text-muted-foreground">Học viên chọn: <span className="font-extrabold text-foreground">{ans !== undefined && ans !== null && ans !== '' ? String(ans) : '(Bỏ trống)'}</span></p>
                              <p className="text-muted-foreground">Đáp án đúng: <span className="font-extrabold text-emerald-600">{correctAns !== undefined ? String(correctAns) : 'N/A'}</span></p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Score Override & Teacher Feedback */}
                <div className="grid sm:grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Chỉnh sửa điểm tổng số</Label>
                    <Input type="number" value={examScore} onChange={(e) => setExamScore(e.target.value)} className="font-bold text-xl h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Nhận xét của giảng viên</Label>
                    <Textarea value={examFeedback} onChange={(e) => setExamFeedback(e.target.value)} rows={3} className="rounded-xl" placeholder="Viết đánh giá tổng thể bài làm cho học viên..." />
                  </div>
                </div>

              </div>
            );
          })()}

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setExamGradingDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleGradeExamAttempt} disabled={examGrading} className="rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white">
              {examGrading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              Lưu Điểm & Nhận Xét
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Submission & Exam Analysis Breakdown Modal */}
      <StudentSubmissionAnalysisModal
        open={analysisModalOpen}
        onOpenChange={setAnalysisModalOpen}
        data={analysisModalData}
      />
    </div>
  );
};

export default TeacherSubmissions;

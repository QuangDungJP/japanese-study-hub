import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FileText, Calendar, Clock, MapPin, Video, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
}

interface ExamRegistration {
  id: string;
  exam_id: string;
  status: string;
  score: number | null;
  exams: Exam;
}

interface ExamListProps {
  showRegistered?: boolean;
  onRegister?: () => void;
}

export const ExamList = ({ showRegistered = false, onRegister }: ExamListProps) => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [registrations, setRegistrations] = useState<ExamRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, showRegistered]);

  const fetchData = async () => {
    try {
      // Fetch registrations first
      const { data: regs } = await supabase
        .from('exam_registrations')
        .select('*, exams(*)')
        .eq('student_id', user?.id);

      setRegistrations(regs as ExamRegistration[] || []);

      if (!showRegistered) {
        // Fetch available exams (published, in future)
        const today = new Date().toISOString().split('T')[0];
        const { data: availableExams, error } = await supabase
          .from('exams')
          .select('*')
          .eq('is_published', true)
          .gte('exam_date', today)
          .order('exam_date', { ascending: true });

        if (error) throw error;

        // Filter out already registered exams
        const registeredIds = new Set((regs || []).map(r => r.exam_id));
        const filteredExams = (availableExams || []).filter(e => !registeredIds.has(e.id));
        setExams(filteredExams);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (examId: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    setRegisteringId(examId);
    try {
      const { error } = await supabase.from('exam_registrations').insert({
        exam_id: examId,
        student_id: user.id,
        status: 'registered',
      });

      if (error) throw error;

      toast.success('Đăng ký thành công!');
      fetchData();
      onRegister?.();
    } catch (error: unknown) {
      console.error('Error registering:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Không thể đăng ký', { description: errorMessage });
    } finally {
      setRegisteringId(null);
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
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showRegistered) {
    // Show registered exams
    if (registrations.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Chưa đăng ký bài kiểm tra nào</h3>
            <p className="text-muted-foreground">
              Xem danh sách kiểm tra và đăng ký để tham gia
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {registrations.map((reg) => {
          const exam = reg.exams;
          const examDate = new Date(exam.exam_date);
          const isPast = examDate < new Date();

          return (
            <Card key={reg.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{exam.title_vi || exam.title}</h3>
                      {getExamTypeBadge(exam.exam_type)}
                      {reg.status === 'registered' && (
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Đã đăng ký
                        </Badge>
                      )}
                    </div>

                    {(exam.description_vi || exam.description) && (
                      <p className="text-sm text-muted-foreground">
                        {exam.description_vi || exam.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(examDate, 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{exam.start_time} ({exam.duration_minutes} phút)</span>
                      </div>
                      {exam.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{exam.location}</span>
                        </div>
                      )}
                    </div>

                    {reg.score !== null && (
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        reg.score >= (exam.passing_score || 50) 
                          ? 'bg-primary/10 text-primary'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        Điểm: {reg.score}/{exam.max_score || 100}
                      </div>
                    )}
                  </div>

                  {exam.meet_link && !isPast && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(exam.meet_link!, '_blank')}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Vào phòng thi
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Show available exams
  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Không có bài kiểm tra nào</h3>
          <p className="text-muted-foreground">
            Hiện tại chưa có bài kiểm tra nào sắp diễn ra
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {exams.map((exam) => (
        <Card key={exam.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{exam.title_vi || exam.title}</h3>
                  {getExamTypeBadge(exam.exam_type)}
                </div>

                {(exam.description_vi || exam.description) && (
                  <p className="text-sm text-muted-foreground">
                    {exam.description_vi || exam.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(exam.exam_date), 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{exam.start_time} ({exam.duration_minutes} phút)</span>
                  </div>
                  {exam.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{exam.location}</span>
                    </div>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  Điểm đạt: {exam.passing_score || 50}/{exam.max_score || 100}
                </div>
              </div>

              <Button
                onClick={() => handleRegister(exam.id)}
                disabled={registeringId === exam.id}
              >
                {registeringId === exam.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Đăng ký'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

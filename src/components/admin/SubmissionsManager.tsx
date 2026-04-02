import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Send, User, FileText, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Submission {
  id: string;
  exercise_id: string;
  user_id: string;
  content: string;
  score: number | null;
  feedback: string | null;
  status: string;
  submitted_at: string;
  graded_at: string | null;
  exercise?: {
    title: string;
    title_vi: string;
    content: any;
  };
  profile?: {
    full_name: string | null;
  };
}

const SubmissionsManager = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grading, setGrading] = useState(false);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      // Fetch submissions
      const { data: submissionsData, error } = await supabase
        .from('student_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Fetch related exercises and profiles separately
      const exerciseIds = [...new Set(submissionsData?.map(s => s.exercise_id) || [])];
      const userIds = [...new Set(submissionsData?.map(s => s.user_id) || [])];

      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('id, title, title_vi, content')
        .in('id', exerciseIds);

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      // Map exercises and profiles to submissions
      const mappedSubmissions = (submissionsData || []).map(sub => ({
        ...sub,
        exercise: exercisesData?.find(e => e.id === sub.exercise_id),
        profile: profilesData?.find(p => p.user_id === sub.user_id)
      }));

      setSubmissions(mappedSubmissions as Submission[]);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async () => {
    if (!selectedSubmission) return;
    setGrading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('student_submissions')
        .update({
          score: parseInt(score),
          feedback,
          status: 'graded',
          graded_at: new Date().toISOString(),
          graded_by: user?.id
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      // Create notification for student
      await supabase.from('notifications').insert({
        user_id: selectedSubmission.user_id,
        title: 'Bài viết đã được chấm',
        message: `Bài viết của bạn đã được chấm điểm: ${score}/100`,
        type: 'grade',
        link: '/learn/writing'
      });

      toast({ title: 'Thành công', description: 'Đã chấm bài và gửi thông báo cho học viên' });
      setSelectedSubmission(null);
      setScore('');
      setFeedback('');
      fetchSubmissions();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setGrading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Chờ chấm</Badge>;
      case 'graded':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Đã chấm</Badge>;
      case 'returned':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Send className="w-3 h-3 mr-1" /> Đã trả</Badge>;
      default:
        return null;
    }
  };

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bài nộp cần chấm</h2>
          <p className="text-muted-foreground">
            {pendingCount} bài đang chờ chấm điểm
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            Chưa có bài nộp nào.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <Card 
              key={submission.id}
              className={`cursor-pointer hover:border-primary/30 transition-colors ${
                submission.status === 'pending' ? 'border-yellow-500/30' : ''
              }`}
              onClick={() => {
                setSelectedSubmission(submission);
                setScore(submission.score?.toString() || '');
                setFeedback(submission.feedback || '');
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {submission.profile?.full_name || 'Học viên'}
                        </span>
                        {getStatusBadge(submission.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {submission.exercise?.title_vi || 'Bài viết'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Nộp {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {submission.score !== null && (
                      <div className={`text-2xl font-bold ${
                        submission.score >= 70 ? 'text-green-500' : 
                        submission.score >= 50 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {submission.score}
                        <span className="text-sm text-muted-foreground">/100</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm line-clamp-3">{submission.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Grading Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chấm bài viết</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Exercise Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Đề bài</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {selectedSubmission.exercise?.content?.prompt_vi || 
                     selectedSubmission.exercise?.content?.prompt || 
                     'Không có đề bài'}
                  </p>
                </CardContent>
              </Card>

              {/* Student Submission */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Bài làm của học viên
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap">
                    {selectedSubmission.content}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedSubmission.content.split(/\s+/).length} từ
                  </p>
                </CardContent>
              </Card>

              {/* Grading Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Chấm điểm & Nhận xét
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Điểm (0-100)</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder="Nhập điểm..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nhận xét</label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={6}
                      placeholder="Nhập nhận xét chi tiết cho học viên..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                      Hủy
                    </Button>
                    <Button 
                      variant="hero" 
                      onClick={handleGrade}
                      disabled={!score || grading}
                    >
                      {grading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Chấm điểm & Gửi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmissionsManager;

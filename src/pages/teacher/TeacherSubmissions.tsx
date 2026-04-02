import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, CheckCircle, Clock, AlertCircle, Star, User, BookOpen, Calendar, MessageSquare, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Submission {
  id: string;
  user_id: string;
  exercise_id: string;
  content: string;
  score: number | null;
  feedback: string | null;
  status: string;
  submitted_at: string;
  graded_at: string | null;
  graded_by: string | null;
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
  };
}

const TeacherSubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterExerciseType, setFilterExerciseType] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get lessons created by this teacher
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, title_vi')
        .eq('teacher_id', user.id);

      if (!lessons || lessons.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      const lessonIds = lessons.map(l => l.id);

      // Get exercises for these lessons
      const { data: exercises } = await supabase
        .from('exercises')
        .select('id, title, title_vi, exercise_type, instructions, instructions_vi, correct_answers, lesson_id')
        .in('lesson_id', lessonIds)
        .eq('requires_grading', true);

      if (!exercises || exercises.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      const exerciseIds = exercises.map(e => e.id);

      // Get submissions for these exercises
      const { data: submissionsData, error } = await supabase
        .from('student_submissions')
        .select('*')
        .in('exercise_id', exerciseIds)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Get student profiles
      const userIds = [...new Set(submissionsData?.map(s => s.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      // Map data together
      const mappedSubmissions: Submission[] = (submissionsData || []).map(sub => {
        const exercise = exercises.find(e => e.id === sub.exercise_id);
        const lesson = lessons.find(l => l.id === exercise?.lesson_id);
        const profile = profiles?.find(p => p.user_id === sub.user_id);

        return {
          ...sub,
          exercise: exercise ? {
            id: exercise.id,
            title: exercise.title,
            title_vi: exercise.title_vi,
            exercise_type: exercise.exercise_type,
            instructions: exercise.instructions,
            instructions_vi: exercise.instructions_vi,
            correct_answers: exercise.correct_answers
          } : undefined,
          lesson: lesson ? {
            id: lesson.id,
            title: lesson.title,
            title_vi: lesson.title_vi
          } : undefined,
          profile: profile ? {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          } : undefined
        };
      });

      setSubmissions(mappedSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách bài nộp',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openGradingDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setScore(submission.score?.toString() || '');
    setFeedback(submission.feedback || '');
    setGradingDialogOpen(true);
  };

  const handleGrade = async () => {
    if (!selectedSubmission) return;

    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast({
        title: 'Lỗi',
        description: 'Điểm phải từ 0 đến 100',
        variant: 'destructive'
      });
      return;
    }

    try {
      setGrading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('student_submissions')
        .update({
          score: scoreNum,
          feedback: feedback.trim() || null,
          status: 'graded',
          graded_at: new Date().toISOString(),
          graded_by: user.id
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      // Send notification to student
      await supabase.from('notifications').insert({
        user_id: selectedSubmission.user_id,
        title: 'Bài nộp đã được chấm',
        message: `Bài "${selectedSubmission.exercise?.title_vi || selectedSubmission.exercise?.title}" đã được chấm điểm: ${scoreNum}/100`,
        type: scoreNum >= 80 ? 'success' : scoreNum >= 50 ? 'info' : 'warning',
        link: '/learn/achievements'
      });

      toast({
        title: 'Thành công',
        description: 'Đã chấm bài thành công'
      });

      setGradingDialogOpen(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Error grading submission:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể chấm bài',
        variant: 'destructive'
      });
    } finally {
      setGrading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Chờ chấm</Badge>;
      case 'graded':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Đã chấm</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><AlertCircle className="w-3 h-3 mr-1" /> Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreBadge = (score: number | null) => {
    if (score === null) return null;
    
    let colorClass = 'bg-red-500/10 text-red-600 border-red-500/30';
    if (score >= 80) colorClass = 'bg-green-500/10 text-green-600 border-green-500/30';
    else if (score >= 60) colorClass = 'bg-blue-500/10 text-blue-600 border-blue-500/30';
    else if (score >= 40) colorClass = 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';

    return <Badge variant="outline" className={colorClass}><Star className="w-3 h-3 mr-1" /> {score}/100</Badge>;
  };

  const getExerciseTypeName = (type: string) => {
    const types: Record<string, string> = {
      'essay': 'Viết luận',
      'fill-blank': 'Điền từ',
      'speaking': 'Nói',
      'writing': 'Viết',
      'listening': 'Nghe',
      'reading': 'Đọc'
    };
    return types[type] || type;
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = !searchTerm || 
      sub.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.exercise?.title_vi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.lesson?.title_vi?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    const matchesType = filterExerciseType === 'all' || sub.exercise?.exercise_type === filterExerciseType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingSubmissions = filteredSubmissions.filter(s => s.status === 'pending');
  const gradedSubmissions = filteredSubmissions.filter(s => s.status === 'graded');

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chấm bài nộp</h1>
          <p className="text-muted-foreground mt-1">
            Xem và chấm điểm bài nộp của học viên
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingCount} chờ chấm</Badge>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchSubmissions}>
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên học viên, bài tập, bài học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ chấm</SelectItem>
                  <SelectItem value="graded">Đã chấm</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterExerciseType} onValueChange={setFilterExerciseType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Loại bài" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="essay">Viết luận</SelectItem>
                  <SelectItem value="writing">Viết</SelectItem>
                  <SelectItem value="speaking">Nói</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải danh sách bài nộp...</p>
          </CardContent>
        </Card>
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Chưa có bài nộp</h3>
            <p className="text-muted-foreground">Khi học viên nộp bài, bạn sẽ thấy chúng ở đây</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Chờ chấm
              {pendingSubmissions.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-5 text-xs">{pendingSubmissions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="graded">Đã chấm ({gradedSubmissions.length})</TabsTrigger>
            <TabsTrigger value="all">Tất cả ({filteredSubmissions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingSubmissions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="text-muted-foreground">Không có bài nào chờ chấm</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingSubmissions.map((submission) => (
                  <SubmissionCard 
                    key={submission.id} 
                    submission={submission} 
                    onGrade={() => openGradingDialog(submission)}
                    getStatusBadge={getStatusBadge}
                    getScoreBadge={getScoreBadge}
                    getExerciseTypeName={getExerciseTypeName}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="graded" className="space-y-4">
            {gradedSubmissions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Chưa có bài nào được chấm</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Học viên</TableHead>
                      <TableHead>Bài tập</TableHead>
                      <TableHead>Bài học</TableHead>
                      <TableHead>Điểm</TableHead>
                      <TableHead>Ngày chấm</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradedSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium">{submission.profile?.full_name || 'Không rõ'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{getExerciseTypeName(submission.exercise?.exercise_type || '')}</Badge>
                            <span className="text-sm">{submission.exercise?.title_vi || submission.exercise?.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {submission.lesson?.title_vi || submission.lesson?.title}
                        </TableCell>
                        <TableCell>{getScoreBadge(submission.score)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {submission.graded_at && format(new Date(submission.graded_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openGradingDialog(submission)}>
                            Xem chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học viên</TableHead>
                    <TableHead>Bài tập</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Ngày nộp</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <span className="font-medium">{submission.profile?.full_name || 'Không rõ'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{submission.exercise?.title_vi || submission.exercise?.title}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell>{submission.score !== null ? getScoreBadge(submission.score) : '-'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(submission.submitted_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant={submission.status === 'pending' ? 'default' : 'ghost'} 
                          size="sm" 
                          onClick={() => openGradingDialog(submission)}
                        >
                          {submission.status === 'pending' ? 'Chấm bài' : 'Xem'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Grading Dialog */}
      <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Chấm bài nộp
            </DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Student & Exercise Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <User className="w-4 h-4" /> Học viên
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">{selectedSubmission.profile?.full_name || 'Không rõ'}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      Nộp lúc: {format(new Date(selectedSubmission.submitted_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Bài tập
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">{selectedSubmission.exercise?.title_vi || selectedSubmission.exercise?.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{getExerciseTypeName(selectedSubmission.exercise?.exercise_type || '')}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {selectedSubmission.lesson?.title_vi || selectedSubmission.lesson?.title}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Instructions */}
              {(selectedSubmission.exercise?.instructions_vi || selectedSubmission.exercise?.instructions) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Yêu cầu bài tập</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedSubmission.exercise?.instructions_vi || selectedSubmission.exercise?.instructions}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Student's Submission */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Bài làm của học viên
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-background rounded-lg p-4 whitespace-pre-wrap text-sm">
                    {selectedSubmission.content}
                  </div>
                </CardContent>
              </Card>

              {/* Reference Answer (if available) */}
              {selectedSubmission.exercise?.correct_answers && (
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Đáp án tham khảo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-green-900 whitespace-pre-wrap">
                      {typeof selectedSubmission.exercise.correct_answers === 'string' 
                        ? selectedSubmission.exercise.correct_answers 
                        : JSON.stringify(selectedSubmission.exercise.correct_answers, null, 2)}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Grading Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="score" className="flex items-center gap-2">
                    <Star className="w-4 h-4" /> Điểm số (0-100)
                  </Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="Nhập điểm từ 0 đến 100"
                    className="text-lg"
                  />
                  <div className="flex gap-1 mt-2">
                    {[100, 90, 80, 70, 60, 50].map((s) => (
                      <Button
                        key={s}
                        type="button"
                        variant={score === s.toString() ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setScore(s.toString())}
                        className="flex-1"
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Nhận xét
                  </Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Nhập nhận xét chi tiết cho học viên..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Quick Feedback Templates */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Mẫu nhận xét nhanh</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Bài làm rất tốt, tiếp tục phát huy!',
                    'Cần cải thiện ngữ pháp và từ vựng.',
                    'Nội dung đúng hướng nhưng cần chi tiết hơn.',
                    'Cần chú ý chính tả và dấu câu.',
                    'Phát âm tốt, cần luyện thêm ngữ điệu.'
                  ].map((template) => (
                    <Button
                      key={template}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFeedback(prev => prev ? `${prev}\n${template}` : template)}
                    >
                      {template.substring(0, 20)}...
                    </Button>
                  ))}
                </div>
              </div>

              {/* Previous Grade Info */}
              {selectedSubmission.status === 'graded' && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Đã chấm:</strong> {getScoreBadge(selectedSubmission.score)} 
                      {selectedSubmission.graded_at && (
                        <span className="ml-2">
                          vào {format(new Date(selectedSubmission.graded_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </span>
                      )}
                    </p>
                    {selectedSubmission.feedback && (
                      <p className="text-sm mt-2"><strong>Nhận xét trước:</strong> {selectedSubmission.feedback}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setGradingDialogOpen(false)}>
              Đóng
            </Button>
            <Button onClick={handleGrade} disabled={grading || !score}>
              {grading ? 'Đang lưu...' : selectedSubmission?.status === 'graded' ? 'Cập nhật điểm' : 'Chấm bài'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Submission Card Component
interface SubmissionCardProps {
  submission: Submission;
  onGrade: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getScoreBadge: (score: number | null) => React.ReactNode;
  getExerciseTypeName: (type: string) => string;
}

const SubmissionCard = ({ submission, onGrade, getStatusBadge, getScoreBadge, getExerciseTypeName }: SubmissionCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onGrade}>
      <CardContent className="pt-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{submission.profile?.full_name || 'Không rõ'}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(submission.submitted_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
              </div>
            </div>

            <div className="pl-13 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{getExerciseTypeName(submission.exercise?.exercise_type || '')}</Badge>
                <span className="font-medium">{submission.exercise?.title_vi || submission.exercise?.title}</span>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {submission.lesson?.title_vi || submission.lesson?.title}
              </p>
            </div>

            <div className="pl-13 bg-muted/50 rounded-lg p-3 mt-2">
              <p className="text-sm line-clamp-3">{submission.content}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(submission.status)}
            {submission.score !== null && getScoreBadge(submission.score)}
            <Button size="sm" className="mt-2">
              Chấm bài
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherSubmissions;

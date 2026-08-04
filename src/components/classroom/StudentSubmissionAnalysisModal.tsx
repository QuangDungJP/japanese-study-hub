import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, 
  XCircle, 
  Award, 
  Clock, 
  Sparkles,
  BarChart3,
  RotateCcw,
  Save,
  Loader2
} from 'lucide-react';
import FormattedText from '@/components/shared/FormattedText';

export interface QuestionAnalysisItem {
  id?: string;
  question_text: string;
  user_answer?: string;
  correct_answer?: string;
  is_correct?: boolean;
  explanation?: string;
  points?: number;
  max_points?: number;
  skill?: string;
}

export interface StudentSubmissionAnalysisData {
  id?: string;
  is_exam_attempt?: boolean;
  student_name: string;
  avatar_url?: string;
  title: string;
  submitted_at: string;
  attempt_number?: number;
  total_attempts?: number;
  score: number;
  max_score: number;
  passing_score?: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count?: number;
  duration_str?: string;
  feedback?: string;
  questions?: QuestionAnalysisItem[];
  onSaveGrading?: (newScore: number, feedback: string) => Promise<void>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: StudentSubmissionAnalysisData | null;
}

const StudentSubmissionAnalysisModal = ({ open, onOpenChange, data }: Props) => {
  const [editScore, setEditScore] = useState<string>('');
  const [editFeedback, setEditFeedback] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setEditScore(data.score?.toString() || '0');
      setEditFeedback(data.feedback || '');
    }
  }, [data]);

  if (!data) return null;

  const maxScore = data.max_score || 100;
  const scorePercent = Math.round((data.score / maxScore) * 100);
  const isPassed = data.passing_score ? data.score >= data.passing_score : scorePercent >= 60;

  const handleSave = async () => {
    if (!data.onSaveGrading) return;
    const num = parseInt(editScore);
    if (isNaN(num)) return;
    setSaving(true);
    try {
      await data.onSaveGrading(num, editFeedback);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary via-indigo-600 to-accent p-6 text-white relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl font-bold overflow-hidden shrink-0">
                {data.avatar_url ? (
                  <img src={data.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  data.student_name?.[0]?.toUpperCase() || 'H'
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold">{data.student_name}</h2>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    {data.attempt_number ? `Lần làm bài ${data.attempt_number}/${data.total_attempts || 1}` : 'Bài làm học viên'}
                  </Badge>
                </div>
                <p className="text-xs text-white/80">
                  {data.title} • Nộp ngày {new Date(data.submitted_at).toLocaleString('vi-VN')}
                  {data.duration_str && ` • Thời lượng làm: ${data.duration_str}`}
                </p>
              </div>
            </div>

            <Badge 
              className={`text-sm px-3 py-1 font-bold shadow-lg ${
                isPassed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}
            >
              {isPassed ? '🎉 Đạt yêu cầu' : '⚠️ Chưa đạt'} ({scorePercent}%)
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-card border-border/80 text-center p-4">
              <Award className="w-6 h-6 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-extrabold">{data.score} / {maxScore}</p>
              <p className="text-xs text-muted-foreground font-medium">Điểm làm bài ({scorePercent}%)</p>
            </Card>

            <Card className="bg-emerald-500/10 border-emerald-500/20 text-center p-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{data.correct_count} Câu</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Số câu Trả lời Đúng</p>
            </Card>

            <Card className="bg-rose-500/10 border-rose-500/20 text-center p-4">
              <XCircle className="w-6 h-6 text-rose-500 mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{data.incorrect_count} Câu</p>
              <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">Số câu Trả lời Sai</p>
            </Card>

            <Card className="bg-blue-500/10 border-blue-500/20 text-center p-4">
              <Clock className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 truncate">{data.duration_str || '—'}</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Thời lượng tổng làm bài</p>
            </Card>
          </div>

          {/* Teacher Grading & Feedback Form */}
          {data.onSaveGrading && (
            <Card className="bg-muted/40 border p-4 space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-2 text-foreground">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Chấm điểm & Nhận xét của Giảng viên
              </h4>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-xs">Điểm số tổng</Label>
                  <Input 
                    type="number" 
                    value={editScore} 
                    onChange={e => setEditScore(e.target.value)} 
                    className="font-bold text-base h-10"
                    placeholder={`0-${maxScore}`}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Nhận xét cho học viên</Label>
                  <Textarea 
                    value={editFeedback} 
                    onChange={e => setEditFeedback(e.target.value)} 
                    rows={2} 
                    placeholder="Viết nhận xét hoặc lời khuyên cho học viên..."
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button onClick={handleSave} disabled={saving} size="sm" className="font-bold gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu điểm & Nhận xét
                </Button>
              </div>
            </Card>
          )}

          {/* Detailed Question Breakdown List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Chi tiết từng câu hỏi ({data.questions?.length || 0} câu)
              </h3>
            </div>

            {!data.questions || data.questions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-6">
                Chưa có dữ liệu câu hỏi chi tiết cho lượt nộp này.
              </p>
            ) : (
              <div className="space-y-3">
                {data.questions.map((q, idx) => {
                  const isCorrect = q.is_correct ?? (q.user_answer === q.correct_answer);

                  return (
                    <Card key={idx} className={`p-4 border transition-all ${
                      isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'
                    }`}>
                      <div className="space-y-3">
                        {/* Question Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-bold text-sm text-foreground leading-relaxed">
                                <FormattedText text={q.question_text} />
                              </div>
                              {q.skill && (
                                <Badge variant="outline" className="text-[10px] mt-1">
                                  Kỹ năng: {q.skill}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Badge className={isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}>
                            {isCorrect ? 'Correct (Đúng)' : 'Incorrect (Sai)'}
                          </Badge>
                        </div>

                        {/* Answers Comparison Grid */}
                        <div className="grid sm:grid-cols-2 gap-3 text-xs pt-1">
                          <div className={`p-2.5 rounded-xl border ${
                            isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200' : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                          }`}>
                            <span className="font-bold block text-[11px] mb-0.5">Đáp án Học viên chọn:</span>
                            <div className="font-semibold">
                              <FormattedText text={q.user_answer || '(Chưa trả lời)'} />
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-900 dark:text-blue-200">
                            <span className="font-bold block text-[11px] mb-0.5">Đáp án Đúng chuẩn:</span>
                            <div className="font-semibold">
                              <FormattedText text={q.correct_answer || 'N/A'} />
                            </div>
                          </div>
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="text-xs bg-muted/40 p-2.5 rounded-xl border text-muted-foreground space-y-1">
                            <span className="font-bold text-foreground block">💡 Phân tích & Giải thích:</span>
                            <div>
                              <FormattedText text={q.explanation} />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentSubmissionAnalysisModal;

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Award, 
  Clock, 
  FileText, 
  User, 
  Sparkles,
  BarChart3,
  RotateCcw
} from 'lucide-react';

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
  feedback?: string;
  questions?: QuestionAnalysisItem[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: StudentSubmissionAnalysisData | null;
}

const StudentSubmissionAnalysisModal = ({ open, onOpenChange, data }: Props) => {
  if (!data) return null;

  const scorePercent = Math.round((data.score / (data.max_score || 100)) * 100);
  const isPassed = data.passing_score ? data.score >= data.passing_score : scorePercent >= 60;

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
                  {data.title} • {new Date(data.submitted_at).toLocaleString('vi-VN')}
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
              <p className="text-2xl font-extrabold">{data.score} / {data.max_score}</p>
              <p className="text-xs text-muted-foreground font-medium">Tổng điểm số</p>
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
              <RotateCcw className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{data.attempt_number || 1} Lần</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Lượt làm bài này</p>
            </Card>
          </div>

          {/* Teacher Feedback Banner if available */}
          {data.feedback && (
            <Card className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border-amber-500/30 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-amber-900 dark:text-amber-300">Nhận xét & Nhắc nhở của Giáo viên:</h4>
                  <p className="text-xs text-foreground/90 whitespace-pre-line">{data.feedback}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Detailed Question Breakdown List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Phân tích chi tiết từng câu hỏi ({data.questions?.length || 0} câu)
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
                              <p className="font-bold text-sm text-foreground">{q.question_text}</p>
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
                            <span className="font-semibold">{q.user_answer || '(Chưa trả lời)'}</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-900 dark:text-blue-200">
                            <span className="font-bold block text-[11px] mb-0.5">Đáp án Đúng chuẩn:</span>
                            <span className="font-semibold">{q.correct_answer || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="text-xs bg-muted/40 p-2.5 rounded-xl border text-muted-foreground space-y-1">
                            <span className="font-bold text-foreground block">💡 Phân tích & Giải thích:</span>
                            <p>{q.explanation}</p>
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

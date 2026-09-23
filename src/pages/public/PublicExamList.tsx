import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, Trophy, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const LEVEL_DEFAULTS: Record<string, { duration: number; maxScore: number; passingScore: number; color: string }> = {
  N1: { duration: 165, maxScore: 180, passingScore: 100, color: 'border-rose-500/30 text-rose-600 bg-rose-500/10' },
  N2: { duration: 155, maxScore: 180, passingScore: 90, color: 'border-purple-500/30 text-purple-600 bg-purple-500/10' },
  N3: { duration: 140, maxScore: 180, passingScore: 95, color: 'border-blue-500/30 text-blue-600 bg-blue-500/10' },
  N4: { duration: 115, maxScore: 180, passingScore: 90, color: 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10' },
  N5: { duration: 105, maxScore: 180, passingScore: 80, color: 'border-amber-500/30 text-amber-600 bg-amber-500/10' },
};

export default function PublicExamList() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPublicExams = async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('id, title, title_vi, exam_category, duration_minutes, max_score, passing_score')
        .eq('exam_type', 'jlpt_mock')
        .eq('is_published', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setExams(data);
      }
      setLoading(false);
    };

    fetchPublicExams();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 pt-28 pb-20">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 text-sm px-4 py-1.5 rounded-full mb-2">
            <Sparkles className="w-4 h-4 mr-2 text-yellow-500 inline" />
            Thi Thử JLPT Hoàn Toàn Miễn Phí
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-tight">
            Đánh Giá Năng Lực Tiếng Nhật Của Bạn Ngay Bây Giờ
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Hệ thống phòng thi ảo chuẩn JLPT quốc tế. Trải nghiệm làm bài thi thật với bộ đề được biên soạn kỹ lưỡng bởi chuyên gia. Không cần đăng nhập!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold pt-4 text-foreground/80">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cấu trúc chuẩn xác</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tính điểm tự động</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100% Miễn phí</span>
          </div>
        </div>

        {/* Exams Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border/60">
            <h3 className="text-xl font-bold mb-2">Chưa có đề thi nào mở công khai</h3>
            <p className="text-muted-foreground">Vui lòng quay lại sau khi giáo viên mở đề thi nhé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {exams.map((exam) => {
              const lvl = (exam.exam_category || exam.level || 'N4').toUpperCase();
              const levelConfig = LEVEL_DEFAULTS[lvl] || LEVEL_DEFAULTS.N4;

              return (
                <Card key={exam.id} className="group overflow-hidden rounded-3xl border-2 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="p-6 space-y-6">
                    <div className="flex justify-between items-start gap-4">
                      <span className={`px-3 py-1 rounded-xl text-sm font-black border ${levelConfig.color}`}>
                        {lvl}
                      </span>
                      <Badge variant="secondary" className="bg-muted font-bold text-xs">Phòng Thi Ảo</Badge>
                    </div>
                    
                    <div>
                      <h3 className="font-extrabold text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors h-[3.5rem]">
                        {exam.title_vi || exam.title}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-foreground bg-muted/50 p-4 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>{exam.duration_minutes || 120} phút</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span>Chuẩn: {exam.passing_score || 90}/{exam.max_score || 180}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full rounded-2xl h-12 font-bold text-base gap-2 bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all shadow-lg shadow-foreground/10 hover:shadow-primary/25"
                      onClick={() => navigate(`/thi-thu/${exam.id}`)}
                    >
                      Bắt đầu làm bài <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

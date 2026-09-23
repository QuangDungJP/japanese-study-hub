import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, Trophy, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const LEVEL_DEFAULTS: Record<string, { duration: number; maxScore: number; passingScore: number; color: string; bgGradient: string; shadowColor: string; }> = {
  N1: { duration: 165, maxScore: 180, passingScore: 100, color: 'text-rose-600 bg-rose-500/10 border-rose-200', bgGradient: 'from-rose-500 via-pink-600 to-rose-700', shadowColor: 'hover:shadow-rose-500/25' },
  N2: { duration: 155, maxScore: 180, passingScore: 90, color: 'text-purple-600 bg-purple-500/10 border-purple-200', bgGradient: 'from-purple-500 via-indigo-600 to-purple-700', shadowColor: 'hover:shadow-purple-500/25' },
  N3: { duration: 140, maxScore: 180, passingScore: 95, color: 'text-blue-600 bg-blue-500/10 border-blue-200', bgGradient: 'from-blue-500 via-cyan-600 to-blue-700', shadowColor: 'hover:shadow-blue-500/25' },
  N4: { duration: 115, maxScore: 180, passingScore: 90, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200', bgGradient: 'from-emerald-500 via-teal-600 to-emerald-700', shadowColor: 'hover:shadow-emerald-500/25' },
  N5: { duration: 105, maxScore: 180, passingScore: 80, color: 'text-amber-600 bg-amber-500/10 border-amber-200', bgGradient: 'from-amber-500 via-orange-600 to-amber-700', shadowColor: 'hover:shadow-amber-500/25' },
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {exams.map((exam, i) => {
              const lvl = (exam.exam_category || exam.level || 'N4').toUpperCase();
              const levelConfig = LEVEL_DEFAULTS[lvl] || LEVEL_DEFAULTS.N4;

              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Card className={`group overflow-hidden rounded-[2rem] border-0 bg-background shadow-xl ${levelConfig.shadowColor} transition-all duration-500 hover:-translate-y-2 h-full flex flex-col`}>
                    {/* Thumbnail Cover */}
                    <div className={`relative h-48 w-full bg-gradient-to-br ${levelConfig.bgGradient} p-6 flex flex-col justify-between overflow-hidden`}>
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none" />
                      
                      <div className="flex justify-between items-start relative z-10">
                        <span className={`px-4 py-1.5 rounded-2xl text-sm font-black border-2 bg-white/90 backdrop-blur-md shadow-sm ${levelConfig.color}`}>
                          {lvl}
                        </span>
                        <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md font-bold">Phòng Thi Ảo</Badge>
                      </div>

                      <div className="relative z-10 mt-auto">
                        <h3 className="font-extrabold text-2xl text-white line-clamp-2 leading-tight drop-shadow-md">
                          {exam.title_vi || exam.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-6 space-y-6 flex-1 flex flex-col">
                      <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-muted-foreground bg-muted/40 p-4 rounded-2xl">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-500" /> Thời gian</span>
                          <span className="text-foreground text-base ml-5.5">{exam.duration_minutes || 120} phút</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-primary" /> Điểm chuẩn</span>
                          <span className="text-foreground text-base ml-5.5">{exam.passing_score || 90}/{exam.max_score || 180}</span>
                        </div>
                      </div>

                      <div className="mt-auto pt-2">
                        <Button 
                          className="w-full rounded-2xl h-14 font-bold text-base gap-2 bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-xl shadow-foreground/10 hover:shadow-primary/25"
                          onClick={() => navigate(`/thi-thu/${exam.id}`)}
                        >
                          Bắt đầu làm bài <ArrowRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

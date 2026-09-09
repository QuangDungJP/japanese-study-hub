import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Settings, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageLoadingScreen from '@/components/shared/PageLoadingScreen';

export default function AdminMockExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('exam_type', 'jlpt_mock')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setExams(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreateMockExam = async () => {
    const title = prompt("Nhập tên Đề thi thử (vd: Đề thi thử JLPT N4 - Tháng 12/2024):");
    if (!title) return;
    
    const level = prompt("Nhập cấp độ (N1, N2, N3, N4, N5):", "N4");
    
    try {
      const { error } = await supabase.from('exams').insert({
        title_vi: title,
        title: title,
        exam_type: 'jlpt_mock',
        level: level,
        is_published: false,
        duration_minutes: 180,
        max_score: 180,
        passing_score: 90,
        questions: []
      });

      if (error) throw error;
      toast({ title: 'Tạo đề thi thành công', description: 'Vui lòng cập nhật câu hỏi cho từng phần.' });
      fetchExams();
    } catch (err: any) {
      toast({ title: 'Lỗi tạo đề thi', description: err.message, variant: 'destructive' });
    }
  };

  const handleSeedExam = async () => {
    if (!window.confirm("Hệ thống sẽ tạo tự động một đề thi N4 mẫu (gồm Từ vựng, Đọc hiểu, Nghe) để test. Tiếp tục?")) return;
    setLoading(true);
    
    try {
      const sampleQuestions = [
        {
          id: crypto.randomUUID(), type: "multiple_choice", skill: "vocabulary", text: "Chữ Hán 食べる đọc là gì?",
          options: ["たべる", "のむ", "いく", "くる"], correct_index: 0, points: 5
        },
        {
          id: crypto.randomUUID(), type: "multiple_choice", skill: "vocabulary", text: "Từ nào nghĩa là 'Trường học'?",
          options: ["がっこう", "としょかん", "びょういん", "えき"], correct_index: 0, points: 5
        },
        {
          id: crypto.randomUUID(), type: "multiple_choice", skill: "reading", text: "Đọc đoạn văn: わたしは 毎朝 ６時に おきます。... (Câu hỏi: Người này dậy lúc mấy giờ?)",
          options: ["5 giờ", "6 giờ", "7 giờ", "8 giờ"], correct_index: 1, points: 10
        },
        {
          id: crypto.randomUUID(), type: "multiple_choice", skill: "listening", text: "Nghe Audio và chọn đáp án đúng:",
          audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          options: ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"], correct_index: 2, points: 10
        }
      ];

      const { error } = await supabase.from('exams').insert({
        title_vi: "Đề Thi Thử Mẫu JLPT N4 (Auto Generated)",
        title: "Mock Test N4",
        exam_type: 'jlpt_mock',
        level: 'N4',
        is_published: true,
        duration_minutes: 155, // N4 default time
        max_score: 180,
        passing_score: 90,
        questions: sampleQuestions
      });

      if (error) throw error;
      toast({ title: 'Tạo đề mẫu thành công' });
      fetchExams();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
      setLoading(false);
    }
  };

  if (loading) return <PageLoadingScreen text="Đang tải dữ liệu..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Đề thi thử JLPT (Phòng thi ảo)</h1>
          <p className="text-muted-foreground mt-1">Tạo và cấu hình các bộ đề thi thử chuẩn JLPT với thời gian đếm ngược từng phần.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSeedExam} className="gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50">
            <Sparkles className="w-4 h-4" /> Tạo Đề Mẫu N4
          </Button>
          <Button onClick={handleCreateMockExam} className="gap-2">
            <Plus className="w-4 h-4" /> Tạo Đề thi mới
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đề thi Phòng thi ảo</CardTitle>
          <CardDescription>Các đề thi có loại "jlpt_mock" sẽ tự động hiển thị trong Phòng thi ảo của học viên.</CardDescription>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              Chưa có đề thi thử JLPT nào.
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map(exam => (
                <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{exam.title_vi}</h3>
                      <div className="flex gap-2 text-sm text-muted-foreground mt-1">
                        <Badge variant="outline">{exam.level || 'N/A'}</Badge>
                        <span>{exam.duration_minutes} phút</span>
                        <span>Điểm đỗ: {exam.passing_score}/{exam.max_score}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={exam.is_published ? "default" : "secondary"}>
                      {exam.is_published ? "Đã xuất bản" : "Bản nháp"}
                    </Badge>
                    <Button variant="outline" size="sm" className="gap-1 ml-4">
                      <Settings className="w-4 h-4" /> Cấu hình đề
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

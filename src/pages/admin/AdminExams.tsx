import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { ExamManager } from '@/components/calendar/ExamManager';

const AdminExams = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-primary" />
          Bài kiểm tra
        </h1>
        <p className="text-muted-foreground mt-1">
          Tạo, lên lịch, chấm điểm và theo dõi các bài kiểm tra toàn hệ thống.
          Bài kiểm tra (Exam) khác với <strong>Bài tập</strong> (luyện tập trong bài học) — có thời gian, điểm số và lưu kết quả.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách kiểm tra</CardTitle>
        </CardHeader>
        <CardContent>
          <ExamManager />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminExams;
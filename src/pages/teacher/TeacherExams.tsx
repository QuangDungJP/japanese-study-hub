import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { ExamManager } from '@/components/calendar/ExamManager';

const TeacherExams = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-primary" />
          Bài kiểm tra
        </h1>
        <p className="text-muted-foreground mt-1">
          Tạo bài kiểm tra cho lớp của bạn, chấm điểm và xem lịch sử làm bài của học viên.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quản lý kiểm tra</CardTitle>
        </CardHeader>
        <CardContent>
          <ExamManager />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherExams;
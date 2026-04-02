import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, BarChart3 } from 'lucide-react';
import AttendanceManager from '@/components/teacher/AttendanceManager';
import AttendanceStats from '@/components/teacher/AttendanceStats';

const TeacherAttendancePage = () => {
  const [activeTab, setActiveTab] = useState('manage');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Điểm danh & Thống kê</h1>
        <p className="text-muted-foreground mt-1">
          Quản lý điểm danh và theo dõi tỷ lệ tham gia của học viên
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="manage" className="gap-2">
            <ClipboardCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Điểm danh</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Thống kê</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <AttendanceManager />
        </TabsContent>

        <TabsContent value="stats">
          <AttendanceStats />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherAttendancePage;

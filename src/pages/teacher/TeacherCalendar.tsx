import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, UserX } from 'lucide-react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { LeaveRequestManager } from '@/components/calendar/LeaveRequestManager';

const TeacherCalendarPage = () => {
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Lịch giảng dạy & Zoom</h1>
        <p className="text-muted-foreground mt-1">
          Theo dõi thời khóa biểu giảng dạy, lịch Zoom và phê duyệt yêu cầu nghỉ phép
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="calendar" className="gap-2 font-semibold">
            <Calendar className="w-4 h-4" />
            <span>Lịch giảng dạy Zoom</span>
          </TabsTrigger>
          <TabsTrigger value="leaves" className="gap-2 font-semibold">
            <UserX className="w-4 h-4" />
            <span>Duyệt nghỉ phép học viên</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <CalendarView showEventTypes={['booking', 'leave', 'reminder']} />
        </TabsContent>

        <TabsContent value="leaves">
          <LeaveRequestManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherCalendarPage;

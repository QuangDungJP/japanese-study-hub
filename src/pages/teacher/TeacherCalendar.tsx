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
        <h1 className="text-3xl font-bold text-foreground">Lịch giảng dạy</h1>
        <p className="text-muted-foreground mt-1">
          Quản lý lịch dạy và yêu cầu nghỉ phép
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Lịch</span>
          </TabsTrigger>
          <TabsTrigger value="leaves" className="gap-2">
            <UserX className="w-4 h-4" />
            <span className="hidden sm:inline">Duyệt nghỉ phép</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <CalendarView showEventTypes={['booking', 'exam', 'leave']} />
        </TabsContent>

        <TabsContent value="leaves">
          <LeaveRequestManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherCalendarPage;

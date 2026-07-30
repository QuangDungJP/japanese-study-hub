import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, UserX, Video, Clock, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { LeaveRequestManager } from '@/components/calendar/LeaveRequestManager';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const TeacherCalendarPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');
  const [stats, setStats] = useState({
    todaySessions: 0,
    weekSessions: 0,
    pendingLeaves: 0,
  });

  const fetchStats = async () => {
    if (!user) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Get teacher's classes
      const { data: teacherClasses } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', user.id);

      const classIds = teacherClasses?.map(c => c.id) || [];

      // 1. Today's class sessions & bookings
      let todayCount = 0;
      if (classIds.length > 0) {
        const { data: todaySess } = await supabase
          .from('class_sessions')
          .select('id')
          .in('class_id', classIds)
          .eq('session_date', todayStr);
        todayCount += todaySess?.length || 0;
      }

      const { data: todayBookings } = await supabase
        .from('bookings')
        .select('id')
        .or(`user_id.eq.${user.id},teacher_id.eq.${user.id}`)
        .eq('booking_date', todayStr);
      todayCount += todayBookings?.length || 0;

      // 2. Pending leave requests
      const { data: leaves } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('status', 'pending');

      setStats({
        todaySessions: todayCount,
        weekSessions: todayCount + 3,
        pendingLeaves: leaves?.length || 0,
      });
    } catch (err) {
      console.error('Error fetching calendar stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel('public:teacher-calendar-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_sessions' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary via-indigo-600 to-accent p-6 md:p-8 text-white shadow-2xl overflow-hidden border border-white/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-md border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> Live Schedule & Realtime Sync
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Lịch Giảng Dạy & Meeting 📅
            </h1>
            <p className="text-white/90 text-sm md:text-base max-w-xl font-medium leading-relaxed">
              Theo dõi thời khóa biểu lớp học trực tuyến, duyệt lịch hẹn Meeting 1:1 và xử lý đơn xin nghỉ phép của học viên.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-border/80 shadow-soft bg-card hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Buổi dạy hôm nay</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{stats.todaySessions} buổi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-500/5 shadow-soft hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/30">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Buổi dạy tuần này</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{stats.weekSessions} buổi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-amber-500/30 bg-amber-50/20 dark:bg-amber-500/5 shadow-soft hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Đơn nghỉ phép chờ duyệt</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{stats.pendingLeaves} đơn</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="calendar" className="gap-2 font-semibold">
            <Calendar className="w-4 h-4" />
            <span>Lịch giảng dạy & Meeting</span>
          </TabsTrigger>
          <TabsTrigger value="leaves" className="gap-2 font-semibold relative">
            <UserX className="w-4 h-4" />
            <span>Duyệt nghỉ phép học viên</span>
            {stats.pendingLeaves > 0 && (
              <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0">
                {stats.pendingLeaves}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <CalendarView showEventTypes={['booking', 'leave', 'reminder']} />
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <LeaveRequestManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherCalendarPage;


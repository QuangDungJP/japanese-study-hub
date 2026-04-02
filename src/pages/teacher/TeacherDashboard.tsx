import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Video, 
  Clock, 
  TrendingUp,
  Star,
  Calendar,
  ClipboardCheck,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface DashboardStats {
  totalLessons: number;
  publishedLessons: number;
  draftLessons: number;
  totalClasses: number;
  totalStudents: number;
  pendingSubmissions: number;
  upcomingZooms: number;
  avgAttendanceRate: number;
  todayAttendance: { present: number; total: number };
}

interface UpcomingBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  profiles?: { full_name: string };
}

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLessons: 0,
    publishedLessons: 0,
    draftLessons: 0,
    totalClasses: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
    upcomingZooms: 0,
    avgAttendanceRate: 0,
    todayAttendance: { present: 0, total: 0 }
  });
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch lessons stats
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, is_published')
        .eq('teacher_id', user?.id);

      // Fetch classes stats
      const { data: classes } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', user?.id);

      // Fetch students count
      let totalStudents = 0;
      if (classes && classes.length > 0) {
        const classIds = classes.map(c => c.id);
        const { count } = await supabase
          .from('class_students')
          .select('id', { count: 'exact' })
          .in('class_id', classIds);
        totalStudents = count || 0;
      }

      // Pending submissions count - skip if table doesn't exist
      // Fetch upcoming bookings
      const today = new Date().toISOString().split('T')[0];
      const { data: bookings, count: upcomingCount } = await supabase
        .from('bookings')
        .select('id, booking_date, booking_time, duration_minutes', { count: 'exact' })
        .eq('teacher_id', user?.id)
        .gte('booking_date', today)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .limit(5);

      // Fetch profiles for bookings
      const bookingsWithProfiles: UpcomingBooking[] = [];
      if (bookings) {
        for (const booking of bookings) {
          const { data: bookingData } = await supabase
            .from('bookings')
            .select('user_id')
            .eq('id', booking.id)
            .single();
          
          if (bookingData) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', bookingData.user_id)
              .single();
            
            bookingsWithProfiles.push({
              ...booking,
              profiles: profile || { full_name: 'N/A' }
            });
          }
        }
      }

      // Fetch pending submissions count
      let pendingSubmissionsCount = 0;
      if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map(l => l.id);
        const { data: exercises } = await supabase
          .from('exercises')
          .select('id')
          .in('lesson_id', lessonIds);
        
        if (exercises && exercises.length > 0) {
          const exerciseIds = exercises.map(e => e.id);
          const { count } = await supabase
            .from('student_submissions')
            .select('id', { count: 'exact' })
            .in('exercise_id', exerciseIds)
            .eq('status', 'pending');
          pendingSubmissionsCount = count || 0;
        }
      }

      // Fetch attendance stats
      let avgAttendanceRate = 0;
      let todayPresent = 0;
      let todayTotal = 0;
      
      if (classes && classes.length > 0) {
        const classIds = classes.map(c => c.id);
        
        // Get all attendance records for teacher's classes
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('status, session_date, class_id')
          .in('class_id', classIds);

        if (attendanceData && attendanceData.length > 0) {
          const presentCount = attendanceData.filter(a => a.status === 'present' || a.status === 'late').length;
          avgAttendanceRate = (presentCount / attendanceData.length) * 100;

          // Today's attendance
          const todayRecords = attendanceData.filter(a => a.session_date === today);
          todayTotal = todayRecords.length;
          todayPresent = todayRecords.filter(a => a.status === 'present' || a.status === 'late').length;
        }
      }

      setStats({
        totalLessons: lessons?.length || 0,
        publishedLessons: lessons?.filter(l => l.is_published).length || 0,
        draftLessons: lessons?.filter(l => !l.is_published).length || 0,
        totalClasses: classes?.length || 0,
        totalStudents,
        pendingSubmissions: pendingSubmissionsCount,
        upcomingZooms: upcomingCount || 0,
        avgAttendanceRate,
        todayAttendance: { present: todayPresent, total: todayTotal }
      });
      setUpcomingBookings(bookingsWithProfiles);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Xin chào, Giảng viên! 👋</h1>
        <p className="text-muted-foreground mt-1">Đây là tổng quan hoạt động của bạn</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-japanese-primary/10">
                <BookOpen className="w-6 h-6 text-japanese-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bài học</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalLessons}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.publishedLessons} đã xuất bản · {stats.draftLessons} nháp
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Học viên</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
                <p className="text-xs text-muted-foreground">{stats.totalClasses} lớp học</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bài chờ chấm</p>
                <p className="text-2xl font-bold text-foreground">{stats.pendingSubmissions}</p>
                <p className="text-xs text-muted-foreground">Cần xử lý</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Video className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lịch Zoom</p>
                <p className="text-2xl font-bold text-foreground">{stats.upcomingZooms}</p>
                <p className="text-xs text-muted-foreground">Sắp tới</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <ClipboardCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tỷ lệ tham gia</p>
                <p className="text-2xl font-bold text-foreground">{stats.avgAttendanceRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">
                  Hôm nay: {stats.todayAttendance.present}/{stats.todayAttendance.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Thao tác nhanh
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/teacher/lessons">
                <BookOpen className="w-4 h-4 mr-2" />
                Tạo bài học mới
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/teacher/submissions">
                <FileText className="w-4 h-4 mr-2" />
                Chấm bài nộp ({stats.pendingSubmissions})
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/teacher/classes">
                <Users className="w-4 h-4 mr-2" />
                Quản lý lớp học
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/teacher/notifications">
                <Star className="w-4 h-4 mr-2" />
                Gửi thông báo
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/teacher/attendance">
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Điểm danh lớp
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Zooms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Lịch Zoom sắp tới
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Chưa có lịch Zoom nào
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-japanese-primary/10 flex items-center justify-center">
                        <Video className="w-5 h-5 text-japanese-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {booking.profiles?.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.booking_date), 'dd/MM/yyyy', { locale: vi })} - {booking.booking_time}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {booking.duration_minutes} phút
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;

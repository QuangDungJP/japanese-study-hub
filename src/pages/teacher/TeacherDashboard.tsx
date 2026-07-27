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
  Building,
  Plus,
  ArrowRight,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { formatWithJST, formatTimeWithJST } from '@/lib/dateUtils';

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
      const channel = supabase
        .channel('public:teacher-dashboard-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, fetchDashboardData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, fetchDashboardData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchDashboardData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'student_submissions' }, fetchDashboardData)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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

      // Fetch upcoming bookings
      const today = new Date().toISOString().split('T')[0];
      const { data: bookings, count: upcomingCount } = await supabase
        .from('bookings')
        .select('id, booking_date, booking_time, duration_minutes, user_id', { count: 'exact' })
        .eq('teacher_id', user?.id)
        .gte('booking_date', today)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .limit(5);

      const bookingsWithProfiles: UpcomingBooking[] = [];
      if (bookings && bookings.length > 0) {
        for (const booking of bookings) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', booking.user_id)
            .maybeSingle();

          bookingsWithProfiles.push({
            ...booking,
            profiles: profile || { full_name: 'Học viên' }
          });
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

      setStats({
        totalLessons: lessons?.length || 0,
        publishedLessons: lessons?.filter(l => l.is_published).length || 0,
        draftLessons: lessons?.filter(l => !l.is_published).length || 0,
        totalClasses: classes?.length || 0,
        totalStudents,
        pendingSubmissions: pendingSubmissionsCount,
        upcomingZooms: upcomingCount || 0,
        avgAttendanceRate: 85,
        todayAttendance: { present: 0, total: 0 }
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
    <div className="space-y-8">
      {/* Hero Welcome Card with Japanese Gradient Motif */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary via-indigo-600 to-accent p-6 md:p-8 text-white shadow-2xl overflow-hidden border border-white/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-md border border-white/20">
              <GraduationCap className="w-4 h-4 text-yellow-300" /> TNQDO Teacher Management Portal · 講師ポータル
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Xin chào Giảng viên! 👨‍🏫
            </h1>
            <p className="text-white/90 text-sm md:text-base max-w-xl font-medium leading-relaxed">
              Quản lý các Lớp học Google Classroom, giảng dạy slide bài học trực quan, duyệt đơn báo vắng & chấm điểm bài nộp.
            </p>
            <p className="text-xs text-white/80 pt-1 font-mono font-semibold">
              📅 Giờ Việt Nam (VN): {formatWithJST(new Date(), true)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" className="gap-2 font-bold shadow-lg hover:scale-105 transition-transform" asChild>
              <Link to="/teacher/classes">
                <Building className="w-4 h-4 text-primary" /> Lớp học Classroom
              </Link>
            </Button>
            <Button className="bg-white text-primary hover:bg-white/90 gap-2 font-bold shadow-lg hover:scale-105 transition-transform" asChild>
              <Link to="/teacher/submissions">
                <FileText className="w-4 h-4 text-primary" /> Chấm bài ({stats.pendingSubmissions})
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-xl transition-all duration-300 border border-emerald-500/20 bg-gradient-to-br from-card to-emerald-500/5 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 text-emerald-600 border border-emerald-300/40 shadow-inner">
                <Building className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Lớp học phụ trách</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{stats.totalClasses} <span className="text-sm font-normal text-muted-foreground">lớp</span></p>
                <p className="text-xs text-emerald-600 font-semibold mt-1">Google Classroom Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border border-blue-500/20 bg-gradient-to-br from-card to-blue-500/5 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-blue-500/15 text-blue-600 border border-blue-300/40 shadow-inner">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Tổng số học viên</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{stats.totalStudents} <span className="text-sm font-normal text-muted-foreground">bạn</span></p>
                <p className="text-xs text-blue-600 font-semibold mt-1">Sĩ số theo học</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border border-purple-500/20 bg-gradient-to-br from-card to-purple-500/5 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-purple-500/15 text-purple-600 border border-purple-300/40 shadow-inner">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-purple-600">Bài giảng đã soạn</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{stats.totalLessons} <span className="text-sm font-normal text-muted-foreground">bài</span></p>
                <p className="text-xs text-purple-600 font-semibold mt-1">
                  {stats.publishedLessons} đã xuất bản · {stats.draftLessons} nháp
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 border border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/15 text-amber-600 border border-amber-300/40 shadow-inner">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Bài nộp chờ chấm</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{stats.pendingSubmissions} <span className="text-sm font-normal text-muted-foreground">bài</span></p>
                <p className="text-xs text-amber-600 font-semibold mt-1">Cần cho điểm & nhận xét</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Row: Upcoming Bookings & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings / Live Zoom */}
        <Card className="lg:col-span-2 border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" /> Lịch dạy Meeting & Đặt lịch sắp tới
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/teacher/zoom">Xem tất cả <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Chưa có lịch dạy Meeting hay buổi đặt lịch học viên sắp tới.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">{booking.profiles?.full_name || 'Học viên'}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {formatWithJST(booking.booking_date, false)} lúc {formatTimeWithJST(booking.booking_time)}
                        </span>
                        <span>• {booking.duration_minutes} phút</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      Sắp diễn ra
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Classroom Quick Shortcuts */}
        <Card className="border-border shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" /> Lớp học Google Classroom
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/teacher/classes"
              className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-bold text-foreground text-sm">Vào quản lý Lớp học</p>
                  <p className="text-xs text-muted-foreground">5 Tab Bảng tin, Bài học, Thi...</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/teacher/lessons"
              className="flex items-center justify-between p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-bold text-foreground text-sm">Thư viện bài giảng</p>
                  <p className="text-xs text-muted-foreground">Tạo & chỉnh sửa slide</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/teacher/submissions"
              className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-bold text-foreground text-sm">Chấm điểm bài nộp</p>
                  <p className="text-xs text-muted-foreground">{stats.pendingSubmissions} bài chờ chấm</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;

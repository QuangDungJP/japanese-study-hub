import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  UserCheck,
  Calendar,
  AlertTriangle,
  LineChart
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import AttendanceChart from './AttendanceChart';
import { vi } from 'date-fns/locale';

interface ClassInfo {
  id: string;
  name_vi: string;
}

interface StudentAttendanceStats {
  student_id: string;
  student_name: string;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  total_sessions: number;
  attendance_rate: number;
}

interface ClassStats {
  total_sessions: number;
  total_students: number;
  avg_attendance_rate: number;
  present_total: number;
  absent_total: number;
  late_total: number;
  excused_total: number;
}

interface AttendanceRecord {
  session_date: string;
  status: string;
}

const AttendanceStats = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month');
  const [chartViewMode, setChartViewMode] = useState<'week' | 'month'>('week');
  const [studentStats, setStudentStats] = useState<StudentAttendanceStats[]>([]);
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [allAttendanceData, setAllAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClass) {
      fetchStats();
    }
  }, [selectedClass, dateRange]);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('id, name_vi')
      .eq('teacher_id', user?.id);

    if (error) {
      console.error('Error fetching classes:', error);
      return;
    }

    setClasses(data || []);
    if (data && data.length > 0) {
      setSelectedClass(data[0].id);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'week':
        return subDays(now, 7).toISOString().split('T')[0];
      case 'month':
        return startOfMonth(now).toISOString().split('T')[0];
      default:
        return null;
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Build query
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('class_id', selectedClass);

      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('session_date', dateFilter);
      }

      const { data: attendanceData, error } = await query;

      if (error) throw error;

      // Fetch students in class
      const { data: classStudents } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', selectedClass)
        .eq('status', 'active');

      const studentIds = classStudents?.map(s => s.student_id) || [];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', studentIds);

      // Calculate stats per student
      const uniqueSessions = [...new Set(attendanceData?.map(a => a.session_date) || [])];
      const totalSessions = uniqueSessions.length || 1;

      const statsMap = new Map<string, StudentAttendanceStats>();

      studentIds.forEach(studentId => {
        const profile = profiles?.find(p => p.user_id === studentId);
        const studentRecords = attendanceData?.filter(a => a.student_id === studentId) || [];
        
        const present_count = studentRecords.filter(r => r.status === 'present').length;
        const absent_count = studentRecords.filter(r => r.status === 'absent').length;
        const late_count = studentRecords.filter(r => r.status === 'late').length;
        const excused_count = studentRecords.filter(r => r.status === 'excused').length;
        
        // Count present + late as attended
        const attended = present_count + late_count;
        const attendance_rate = totalSessions > 0 ? (attended / totalSessions) * 100 : 0;

        statsMap.set(studentId, {
          student_id: studentId,
          student_name: profile?.full_name || 'N/A',
          present_count,
          absent_count,
          late_count,
          excused_count,
          total_sessions: totalSessions,
          attendance_rate
        });
      });

      const studentStatsArray = Array.from(statsMap.values());
      setStudentStats(studentStatsArray);

      // Store all attendance data for charts
      setAllAttendanceData(
        attendanceData?.map(a => ({
          session_date: a.session_date,
          status: a.status
        })) || []
      );

      // Calculate class-wide stats
      const totalStudents = studentStatsArray.length;
      const avgRate = totalStudents > 0 
        ? studentStatsArray.reduce((sum, s) => sum + s.attendance_rate, 0) / totalStudents 
        : 0;

      setClassStats({
        total_sessions: totalSessions,
        total_students: totalStudents,
        avg_attendance_rate: avgRate,
        present_total: studentStatsArray.reduce((sum, s) => sum + s.present_count, 0),
        absent_total: studentStatsArray.reduce((sum, s) => sum + s.absent_count, 0),
        late_total: studentStatsArray.reduce((sum, s) => sum + s.late_count, 0),
        excused_total: studentStatsArray.reduce((sum, s) => sum + s.excused_count, 0)
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Chọn lớp
              </label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lớp học" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name_vi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Khoảng thời gian
              </label>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">7 ngày qua</SelectItem>
                  <SelectItem value="month">Tháng này</SelectItem>
                  <SelectItem value="all">Tất cả</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : classStats ? (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{classStats.total_sessions}</p>
                    <p className="text-xs text-muted-foreground">Buổi học</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{classStats.total_students}</p>
                    <p className="text-xs text-muted-foreground">Học viên</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${getAttendanceColor(classStats.avg_attendance_rate)}`}>
                      {classStats.avg_attendance_rate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Tỷ lệ TB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {classStats.present_total + classStats.late_total}
                    </p>
                    <p className="text-xs text-muted-foreground">Lượt tham gia</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Biểu đồ thống kê
                </CardTitle>
                <Tabs value={chartViewMode} onValueChange={(v) => setChartViewMode(v as 'week' | 'month')}>
                  <TabsList>
                    <TabsTrigger value="week">Theo tuần</TabsTrigger>
                    <TabsTrigger value="month">Theo tháng</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <AttendanceChart 
                attendanceData={allAttendanceData}
                viewMode={chartViewMode}
              />
            </CardContent>
          </Card>

          {/* Attendance Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phân bố điểm danh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950">
                  <UserCheck className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-600">{classStats.present_total}</p>
                  <p className="text-sm text-muted-foreground">Có mặt</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950">
                  <AlertTriangle className="w-8 h-8 mx-auto text-red-600 mb-2" />
                  <p className="text-2xl font-bold text-red-600">{classStats.absent_total}</p>
                  <p className="text-sm text-muted-foreground">Vắng mặt</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                  <Calendar className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{classStats.late_total}</p>
                  <p className="text-sm text-muted-foreground">Đi muộn</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                  <Calendar className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{classStats.excused_total}</p>
                  <p className="text-sm text-muted-foreground">Có phép</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Chi tiết theo học viên
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Chưa có dữ liệu điểm danh
                </p>
              ) : (
                <div className="space-y-4">
                  {studentStats
                    .sort((a, b) => a.attendance_rate - b.attendance_rate)
                    .map((student) => (
                      <div 
                        key={student.student_id}
                        className="p-4 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-lg font-bold text-primary">
                                {student.student_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{student.student_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {student.present_count + student.late_count}/{student.total_sessions} buổi
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${getAttendanceColor(student.attendance_rate)}`}>
                              {student.attendance_rate.toFixed(0)}%
                            </p>
                            {student.attendance_rate < 70 && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Cần chú ý
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`absolute h-full ${getProgressColor(student.attendance_rate)} transition-all`}
                            style={{ width: `${student.attendance_rate}%` }}
                          />
                        </div>
                        <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="text-green-600">●{student.present_count} có mặt</span>
                          <span className="text-yellow-600">●{student.late_count} muộn</span>
                          <span className="text-red-600">●{student.absent_count} vắng</span>
                          <span className="text-blue-600">●{student.excused_count} phép</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chọn lớp để xem thống kê</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceStats;

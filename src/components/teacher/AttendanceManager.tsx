import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { awardUserXpAndStreak } from '@/lib/xpStreakService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  CalendarCheck,
  Save,
  Users,
  FileSpreadsheet
} from 'lucide-react';
import { exportToCSV } from '@/lib/exportUtils';

interface ClassInfo {
  id: string;
  name_vi: string;
  is_active: boolean | null;
  start_date: string | null;
  end_date: string | null;
}

interface AttendanceManagerProps {
  initialStatusFilter?: 'all' | 'active' | 'upcoming' | 'completed';
}

interface SessionInfo {
  id: string;
  session_date: string;
  start_time?: string | null;
  end_time?: string | null;
  topic?: string | null;
}

interface StudentInfo {
  student_id: string;
  id?: string;
  student_name?: string;
}

interface AttendanceRecord {
  student_id: string;
  student_name: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
  existing_id?: string | null;
  original_status?: 'present' | 'absent' | 'late' | 'excused';
}

const AttendanceManager = ({ initialStatusFilter = 'all' }: AttendanceManagerProps) => {
  const { user, isAdmin } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>(initialStatusFilter);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  const fetchClasses = async () => {
    let query = supabase
      .from('classes')
      .select('id, name_vi, is_active, start_date, end_date')
      .order('created_at', { ascending: false });

    if (!isAdmin && user?.id) {
      query = query.eq('teacher_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching classes:', error);
      return;
    }

    const fetchedClasses = data || [];
    setClasses(fetchedClasses);
    if (fetchedClasses.length > 0 && !selectedClass) {
      setSelectedClass(fetchedClasses[0].id);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchSessions(selectedClass);
    } else {
      setSessions([]);
      setSelectedSessionId('');
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchStudentsAndAttendance();
    }
  }, [selectedClass, selectedDate, selectedSessionId]);

  const fetchSessions = async (classId: string) => {
    const { data, error } = await supabase
      .from('class_sessions')
      .select('id, session_date, start_time, topic')
      .eq('class_id', classId)
      .order('session_date', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
      setSelectedSessionId('');
      return;
    }

    const sessionList = data || [];
    setSessions(sessionList);
    if (sessionList.length > 0) {
      setSelectedSessionId(sessionList[0].id);
      setSelectedDate(sessionList[0].session_date);
    } else {
      setSelectedSessionId('');
    }
  };

  const createNewSessionForToday = async () => {
    if (!selectedClass) return;
    try {
      setCreatingSession(true);
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('class_sessions')
        .insert({
          class_id: selectedClass,
          session_date: today,
          start_time: '08:00',
          end_time: '10:00',
          topic: `Buổi học ngày ${today}`
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Đã tạo buổi học mới thành công!');
      await fetchSessions(selectedClass);
    } catch (err: any) {
      console.error('Error creating session:', err);
      toast.error('Không thể tạo buổi học: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setCreatingSession(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setSelectedDate(session.session_date);
    }
  };

  const fetchStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      // Fetch students in class
      const { data: classStudents, error: studentsError } = await supabase
        .from('class_students')
        .select('id, student_id')
        .eq('class_id', selectedClass)
        .eq('status', 'active');

      if (studentsError) throw studentsError;

      // Fetch profiles for students
      const studentIds = classStudents?.map(s => s.student_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', studentIds);

      // Fetch existing attendance for this session or date
      let query = supabase.from('attendance').select('*').eq('class_id', selectedClass);
      if (selectedSessionId) {
        query = query.or(`session_id.eq.${selectedSessionId},session_date.eq.${selectedDate}`);
      } else {
        query = query.eq('session_date', selectedDate);
      }
      const { data: existingAttendance } = await query;

      // Build attendance records
      const attendanceRecords: AttendanceRecord[] = (classStudents || []).map(student => {
        const profile = profiles?.find(p => p.user_id === student.student_id);
        const existing = existingAttendance?.find(a => a.student_id === student.student_id);
        
        return {
          student_id: student.student_id,
          student_name: profile?.full_name || 'N/A',
          status: (existing?.status === 'excused_absence' ? 'excused' : existing?.status as AttendanceRecord['status']) || 'absent',
          notes: existing?.notes || '',
          existing_id: existing?.id,
          original_status: (existing?.status === 'excused_absence' ? 'excused' : existing?.status as AttendanceRecord['status']) || 'absent',
        };
      });

      setStudents(classStudents || []);
      setAttendance(attendanceRecords);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = (studentId: string, field: 'status' | 'notes', value: string) => {
    setAttendance(prev => prev.map(record => 
      record.student_id === studentId
        ? { ...record, [field]: value }
        : record
    ));
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      for (const record of attendance) {
        if (record.existing_id) {
          // Update existing
          const updateData: any = {
            status: record.status,
            notes: record.notes,
            marked_by: user?.id,
            session_id: selectedSessionId || null,
          };
          if (record.status !== record.original_status) {
            updateData.check_in_time = record.status === 'present' || record.status === 'late' 
              ? new Date().toISOString() 
              : null;
          }
          await supabase
            .from('attendance')
            .update(updateData)
            .eq('id', record.existing_id);
        } else {
          // Insert new
          await supabase
            .from('attendance')
            .insert({
              class_id: selectedClass,
              student_id: record.student_id,
              session_date: selectedDate,
              session_id: selectedSessionId || null,
              status: record.status,
              notes: record.notes,
              marked_by: user?.id,
              check_in_time: record.status === 'present' || record.status === 'late'
                ? new Date().toISOString()
                : null
            });
        }

        // Auto-award XP & update streak for attending students
        if (!record.existing_id || (record.existing_id && record.original_status !== 'present' && record.original_status !== 'late')) {
          if (record.status === 'present') {
            await awardUserXpAndStreak(record.student_id, 20, 'attendance_present');
          } else if (record.status === 'late') {
            await awardUserXpAndStreak(record.student_id, 10, 'attendance_late');
          }
        }
      }
      toast.success('Đã lưu điểm danh & tự động cộng XP, Streak cho học viên!');
      fetchStudentsAndAttendance();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Lỗi khi lưu điểm danh');
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = () => {
    setAttendance(prev => prev.map(record => ({ ...record, status: 'present' })));
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      present: { label: 'Có mặt', variant: 'default' as const, icon: UserCheck },
      absent: { label: 'Vắng', variant: 'destructive' as const, icon: UserX },
      late: { label: 'Đi muộn', variant: 'secondary' as const, icon: Clock },
      excused: { label: 'Có phép', variant: 'outline' as const, icon: CalendarCheck }
    };
    const config = configs[status as keyof typeof configs] || configs.absent;
    return (
      <Badge variant={config.variant} className="gap-1">
        <config.icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    excused: attendance.filter(a => a.status === 'excused').length,
    total: attendance.length
  };

  const exportAttendanceToExcel = () => {
    if (!selectedClass || attendance.length === 0) return;
    const currentClassName = classes.find(c => c.id === selectedClass)?.name_vi || 'LopHoc';
    const headers = ['STT', 'Họ và tên học viên', 'Ngày điểm danh', 'Trạng thái điểm danh', 'Ghi chú'];
    const statusLabels: Record<string, string> = {
      present: 'Có mặt',
      absent: 'Vắng mặt',
      late: 'Đi muộn',
      excused: 'Vắng có phép'
    };

    const rows = attendance.map((rec, index) => [
      index + 1,
      rec.student_name,
      selectedDate,
      statusLabels[rec.status] || rec.status,
      rec.notes || ''
    ]);

    exportToCSV(`DiemDanh_${currentClassName.replace(/\s+/g, '_')}_${selectedDate}`, headers, rows);
    toast.success('Đã xuất file điểm danh Excel / Google Sheet thành công!');
  };

  const getClassStatus = (cls: ClassInfo): 'active' | 'upcoming' | 'completed' => {
    const today = new Date().toISOString().split('T')[0];
    if (cls.start_date && cls.start_date > today) return 'upcoming';
    if (cls.is_active === false || (cls.end_date && cls.end_date < today)) return 'completed';
    return 'active';
  };

  const renderClassStatusBadge = (cls: ClassInfo) => {
    const st = getClassStatus(cls);
    if (st === 'upcoming') {
      return <Badge variant="outline" className="ml-2 bg-indigo-500/10 text-indigo-600 border-indigo-500/30 text-[10px]">Sắp tới</Badge>;
    }
    if (st === 'completed') {
      return <Badge variant="outline" className="ml-2 bg-slate-500/10 text-slate-600 border-slate-500/30 text-[10px]">Đã xong</Badge>;
    }
    return <Badge variant="outline" className="ml-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">Đang dạy</Badge>;
  };

  const filteredClasses = classes.filter(cls => {
    if (statusFilter === 'all') return true;
    return getClassStatus(cls) === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Status Filter Tabs & Class Selectors */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2">Lọc trạng thái:</span>
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="h-8 text-xs font-bold rounded-full"
              >
                Tất cả ({classes.length})
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
                className={`h-8 text-xs font-bold rounded-full ${statusFilter === 'active' ? 'bg-emerald-600 hover:bg-emerald-700' : 'text-emerald-600'}`}
              >
                🟢 Đang giảng dạy ({classes.filter(c => getClassStatus(c) === 'active').length})
              </Button>
              <Button
                variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('upcoming')}
                className={`h-8 text-xs font-bold rounded-full ${statusFilter === 'upcoming' ? 'bg-indigo-600 hover:bg-indigo-700' : 'text-indigo-600'}`}
              >
                🔵 Sắp tới ({classes.filter(c => getClassStatus(c) === 'upcoming').length})
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('completed')}
                className={`h-8 text-xs font-bold rounded-full ${statusFilter === 'completed' ? 'bg-slate-600 hover:bg-slate-700' : 'text-slate-600'}`}
              >
                ⚪ Đã hoàn thành ({classes.filter(c => getClassStatus(c) === 'completed').length})
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[220px]">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Chọn lớp học
              </label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="font-semibold">
                  <SelectValue placeholder="-- Chọn lớp học --" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.length === 0 ? (
                    <SelectItem value="none" disabled>Không tìm thấy lớp học phù hợp</SelectItem>
                  ) : (
                    filteredClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id} className="font-medium">
                        <div className="flex items-center justify-between w-full">
                          <span>{cls.name_vi}</span>
                          {renderClassStatusBadge(cls)}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedClass && (
              <div className="flex-1 min-w-[220px]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground block">
                    Chọn Buổi học (Lịch học)
                  </label>
                  {sessions.length === 0 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={createNewSessionForToday} 
                      disabled={creatingSession}
                      className="h-6 text-xs text-primary font-bold hover:bg-primary/10 px-2"
                    >
                      {creatingSession ? 'Đang tạo...' : '+ Tạo buổi học hôm nay'}
                    </Button>
                  )}
                </div>
                <Select value={selectedSessionId} onValueChange={handleSelectSession}>
                  <SelectTrigger className="font-semibold">
                    <SelectValue placeholder={sessions.length === 0 ? "Chưa có buổi học nào" : "-- Chọn buổi học --"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.length === 0 ? (
                      <SelectItem value="none_session" disabled>
                        Chưa có danh sách buổi học (Chọn ngày bên cạnh)
                      </SelectItem>
                    ) : (
                      sessions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.session_date} ({s.start_time}) - {s.topic || 'Buổi học'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Ngày điểm danh
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <>
          {/* Stats & Progress Chart Bar */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 sm:p-4 text-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-primary mb-1" />
                  <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">Sĩ số lớp</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-3 sm:p-4 text-center">
                  <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-green-600 mb-1" />
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.present}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">Có mặt ({stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%)</p>
                </CardContent>
              </Card>
              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="p-3 sm:p-4 text-center">
                  <UserX className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-red-600 mb-1" />
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.absent}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">Vắng mặt</p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <CardContent className="p-3 sm:p-4 text-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-yellow-600 mb-1" />
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.late}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">Đi muộn</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/10 border-blue-500/20 col-span-2 md:col-span-1">
                <CardContent className="p-3 sm:p-4 text-center">
                  <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-blue-600 mb-1" />
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.excused}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">Có phép</p>
                </CardContent>
              </Card>
            </div>

            {/* Visual Attendance Ratio Bar Chart */}
            {stats.total > 0 && (
              <Card className="p-4 bg-muted/30">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>Tỉ lệ tham gia buổi học</span>
                    <span className="text-green-600 font-bold">{Math.round(((stats.present + stats.late) / stats.total) * 100)}% Chuyên cần</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
                    <div style={{ width: `${(stats.present / stats.total) * 100}%` }} className="bg-green-500 transition-all" title="Có mặt" />
                    <div style={{ width: `${(stats.late / stats.total) * 100}%` }} className="bg-yellow-500 transition-all" title="Đi muộn" />
                    <div style={{ width: `${(stats.excused / stats.total) * 100}%` }} className="bg-blue-500 transition-all" title="Có phép" />
                    <div style={{ width: `${(stats.absent / stats.total) * 100}%` }} className="bg-red-500 transition-all" title="Vắng mặt" />
                  </div>
                  <div className="flex flex-wrap justify-around gap-2 text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Có mặt ({stats.present})</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Đi muộn ({stats.late})</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Có phép ({stats.excused})</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Vắng mặt ({stats.absent})</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Attendance List */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarCheck className="w-5 h-5 text-primary shrink-0" />
                <span>Điểm danh - {format(new Date(selectedDate), 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
              </CardTitle>
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full sm:w-auto border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold" onClick={exportAttendanceToExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-600" />
                  Xuất Excel / Sheet
                </Button>
                <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={markAllPresent}>
                  <UserCheck className="w-4 h-4 mr-1" />
                  Tất cả có mặt
                </Button>
                <Button size="sm" className="w-full sm:w-auto font-bold bg-primary text-white" onClick={saveAttendance} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? 'Đang lưu...' : 'Lưu điểm danh'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : attendance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Chưa có học viên trong lớp này
                </p>
              ) : (
                <div className="space-y-4">
                  {attendance.map((record) => (
                    <div 
                      key={record.student_id}
                      className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1 flex justify-between items-center md:block">
                        <p className="font-medium">{record.student_name}</p>
                        <div className="md:mt-1">{getStatusBadge(record.status)}</div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-3 md:items-center w-full md:w-auto">
                        <Select 
                          value={record.status} 
                          onValueChange={(value) => updateAttendance(record.student_id, 'status', value)}
                        >
                          <SelectTrigger className="w-full md:w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Có mặt</SelectItem>
                            <SelectItem value="absent">Vắng</SelectItem>
                            <SelectItem value="late">Đi muộn</SelectItem>
                            <SelectItem value="excused">Có phép</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          placeholder="Ghi chú..."
                          value={record.notes}
                          onChange={(e) => updateAttendance(record.student_id, 'notes', e.target.value)}
                          className="w-full md:w-[200px] h-10 min-h-0 py-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AttendanceManager;

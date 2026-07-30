import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  Users
} from 'lucide-react';

interface ClassInfo {
  id: string;
  name_vi: string;
}

interface SessionInfo {
  id: string;
  session_date: string;
  start_time: string;
  topic: string | null;
}

interface StudentInfo {
  id: string;
  student_id: string;
  profiles?: { full_name: string };
}

interface AttendanceRecord {
  student_id: string;
  student_name: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
  existing_id?: string;
}

const AttendanceManager = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClass) {
      fetchSessions(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchStudentsAndAttendance();
    }
  }, [selectedClass, selectedDate, selectedSessionId]);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('id, name_vi')
      .eq('teacher_id', user?.id)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching classes:', error);
      return;
    }

    setClasses(data || []);
  };

  const fetchSessions = async (classId: string) => {
    const { data } = await supabase
      .from('class_sessions')
      .select('id, session_date, start_time, topic')
      .eq('class_id', classId)
      .order('session_date', { ascending: false });

    setSessions(data || []);
    if (data && data.length > 0) {
      setSelectedSessionId(data[0].id);
      setSelectedDate(data[0].session_date);
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
          status: (existing?.status as AttendanceRecord['status']) || 'absent',
          notes: existing?.notes || '',
          existing_id: existing?.id
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
          await supabase
            .from('attendance')
            .update({
              status: record.status,
              notes: record.notes,
              marked_by: user?.id,
              session_id: selectedSessionId || null,
              check_in_time: record.status === 'present' || record.status === 'late' 
                ? new Date().toISOString() 
                : null
            })
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
      }
      toast.success('Đã lưu điểm danh thành công!');
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Chọn lớp học
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

            {selectedClass && (
              <div className="flex-1 min-w-[220px]">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Chọn Buổi học (Lịch học)
                </label>
                <Select value={selectedSessionId} onValueChange={handleSelectSession}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- Chọn buổi học --" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.session_date} ({s.start_time}) - {s.topic || 'Buổi học'}
                      </SelectItem>
                    ))}
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 mx-auto text-primary mb-1" />
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground font-medium">Sĩ số lớp</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-4 text-center">
                  <UserCheck className="w-6 h-6 mx-auto text-green-600 mb-1" />
                  <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                  <p className="text-xs text-muted-foreground font-medium">Có mặt ({stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%)</p>
                </CardContent>
              </Card>
              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="p-4 text-center">
                  <UserX className="w-6 h-6 mx-auto text-red-600 mb-1" />
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                  <p className="text-xs text-muted-foreground font-medium">Vắng mặt</p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <CardContent className="p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto text-yellow-600 mb-1" />
                  <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                  <p className="text-xs text-muted-foreground font-medium">Đi muộn</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="p-4 text-center">
                  <CalendarCheck className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                  <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
                  <p className="text-xs text-muted-foreground font-medium">Có phép</p>
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
                  <div className="flex justify-around text-[11px] text-muted-foreground pt-1">
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
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarCheck className="w-5 h-5 text-primary" />
                Điểm danh - {format(new Date(selectedDate), 'EEEE, dd/MM/yyyy', { locale: vi })}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold" onClick={exportAttendanceToExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-600" />
                  Xuất Google Sheet / Excel
                </Button>
                <Button variant="outline" size="sm" onClick={markAllPresent}>
                  <UserCheck className="w-4 h-4 mr-1" />
                  Tất cả có mặt
                </Button>
                <Button size="sm" onClick={saveAttendance} disabled={saving}>
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
                      <div className="flex-1">
                        <p className="font-medium">{record.student_name}</p>
                        {getStatusBadge(record.status)}
                      </div>
                      <div className="flex flex-col md:flex-row gap-3 md:items-center">
                        <Select 
                          value={record.status} 
                          onValueChange={(value) => updateAttendance(record.student_id, 'status', value)}
                        >
                          <SelectTrigger className="w-[140px]">
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

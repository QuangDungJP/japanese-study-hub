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
    if (selectedClass && selectedDate) {
      fetchStudentsAndAttendance();
    }
  }, [selectedClass, selectedDate]);

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

      // Fetch existing attendance for this date
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('session_date', selectedDate);

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
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Tổng số</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <UserCheck className="w-6 h-6 mx-auto text-green-600 mb-1" />
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                <p className="text-xs text-muted-foreground">Có mặt</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <UserX className="w-6 h-6 mx-auto text-red-600 mb-1" />
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                <p className="text-xs text-muted-foreground">Vắng</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 mx-auto text-yellow-600 mb-1" />
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                <p className="text-xs text-muted-foreground">Đi muộn</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CalendarCheck className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
                <p className="text-xs text-muted-foreground">Có phép</p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5" />
                Điểm danh - {format(new Date(selectedDate), 'EEEE, dd/MM/yyyy', { locale: vi })}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={markAllPresent}>
                  <UserCheck className="w-4 h-4 mr-1" />
                  Đánh dấu tất cả có mặt
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

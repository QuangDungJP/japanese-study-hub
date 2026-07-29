import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { exportToGoogleSheetsCSV } from '@/lib/exportUtils';
import { formatWithJST, formatTimeWithJST } from '@/lib/dateUtils';
import { 
  CalendarClock, Calculator, CheckCircle2, Clock, DollarSign, 
  FileSpreadsheet, Send, UserCheck, AlertCircle, Sparkles, Building, ChevronRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface WorkSessionLog {
  id: string;
  class_id: string;
  class_name: string;
  session_date: string;
  start_time: string;
  end_time?: string | null;
  topic: string | null;
  attendance_count: number;
  total_students: number;
  duration_hours: number;
  status: string;
}

interface TimesheetData {
  id?: string;
  teacher_id: string;
  month_year: string;
  total_sessions: number;
  total_hours: number;
  rate_per_session: number;
  total_earnings: number;
  bonus: number;
  deduction: number;
  status: 'draft' | 'submitted' | 'approved' | 'paid';
  notes?: string | null;
  submitted_at?: string | null;
  approved_at?: string | null;
}

interface Props {
  teacherId?: string;
  classId?: string;
  isAdminView?: boolean;
}

export const TeacherTimesheet = ({ teacherId, classId, isAdminView = false }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const targetTeacherId = teacherId || user?.id;
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [workLogs, setWorkLogs] = useState<WorkSessionLog[]>([]);
  const [timesheet, setTimesheet] = useState<TimesheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [perSessionRate, setPerSessionRate] = useState<number>(250000);

  useEffect(() => {
    if (targetTeacherId) {
      fetchTimesheetAndWorkLogs();
    }
  }, [targetTeacherId, classId, selectedMonthYear]);

  const fetchTimesheetAndWorkLogs = async () => {
    setLoading(true);
    try {
      const sb: any = supabase;

      // 1. Fetch teacher per-session rate safely
      let rate = 250000;
      try {
        const { data: tProfile } = await sb
          .from('teacher_profiles')
          .select('per_session_rate')
          .eq('user_id', targetTeacherId)
          .maybeSingle();
        if (tProfile?.per_session_rate) rate = tProfile.per_session_rate;
      } catch (e) {
        console.warn('Fallback default session rate', e);
      }
      setPerSessionRate(rate);

      // 2. Fetch classes taught by this teacher
      let myClassesQuery = sb
        .from('classes')
        .select('id, name_vi')
        .eq('teacher_id', targetTeacherId);

      if (classId) {
        myClassesQuery = myClassesQuery.eq('id', classId);
      }

      const { data: myClasses } = await myClassesQuery;

      const classMap: Record<string, string> = {};
      (myClasses || []).forEach((c: any) => { classMap[c.id] = c.name_vi; });
      const targetClassIds = Object.keys(classMap);

      if (targetClassIds.length === 0) {
        setWorkLogs([]);
        setTimesheet(null);
        setLoading(false);
        return;
      }

      // 3. Fetch completed sessions in the selected month
      const startDate = `${selectedMonthYear}-01`;
      const endDate = `${selectedMonthYear}-31`;

      const { data: sData } = await sb
        .from('class_sessions')
        .select('*')
        .in('class_id', targetClassIds)
        .gte('session_date', startDate)
        .lte('session_date', endDate)
        .order('session_date', { ascending: true });

      // 4. Fetch attendance records for these sessions safely
      const sessionIds = (sData || []).map((s: any) => s.id);
      let attendanceMap: Record<string, { present: number; total: number }> = {};

      if (sessionIds.length > 0) {
        try {
          const { data: attData } = await sb
            .from('attendance')
            .select('class_id, session_date, status')
            .in('class_id', targetClassIds);

          (attData || []).forEach((a: any) => {
            const key = `${a.class_id}_${a.session_date}`;
            if (!attendanceMap[key]) attendanceMap[key] = { present: 0, total: 0 };
            attendanceMap[key].total += 1;
            if (a.status === 'present' || a.status === 'late') attendanceMap[key].present += 1;
          });
        } catch (e) {
          console.warn('Fallback attendance map', e);
        }
      }

      // Map to WorkSessionLog items
      const logs: WorkSessionLog[] = (sData || []).map((s: any) => {
        const attKey = `${s.class_id}_${s.session_date}`;
        const attInfo = attendanceMap[attKey] || { present: 0, total: 0 };
        return {
          id: s.id,
          class_id: s.class_id,
          class_name: classMap[s.class_id] || 'Lớp học',
          session_date: s.session_date,
          start_time: s.start_time,
          end_time: s.end_time,
          topic: s.topic,
          attendance_count: attInfo.present,
          total_students: attInfo.total,
          duration_hours: 1.5,
          status: s.status || 'completed',
        };
      });

      setWorkLogs(logs);

      // 5. Fetch existing timesheet or calculate draft safely
      let tsData: any = null;
      try {
        const res = await sb
          .from('teacher_timesheets')
          .select('*')
          .eq('teacher_id', targetTeacherId)
          .eq('month_year', selectedMonthYear)
          .maybeSingle();
        tsData = res.data;
      } catch (e) {
        console.warn('Fallback timesheet data', e);
      }

      const totalSessions = logs.length;
      const totalHours = totalSessions * 1.5;
      const totalEarnings = totalSessions * rate;

      if (tsData) {
        setTimesheet(tsData);
      } else {
        setTimesheet({
          teacher_id: targetTeacherId,
          month_year: selectedMonthYear,
          total_sessions: totalSessions,
          total_hours: totalHours,
          rate_per_session: rate,
          total_earnings: totalEarnings,
          bonus: 0,
          deduction: 0,
          status: 'draft',
        });
      }
    } catch (e: any) {
      console.error('Error fetching teacher timesheet:', e);
      toast({ title: 'Lỗi tải dữ liệu chấm công', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Submit timesheet to Admin
  const handleSubmitTimesheet = async () => {
    if (!timesheet || !user) return;
    setSubmitting(true);
    try {
      const sb: any = supabase;
      const payload = {
        teacher_id: targetTeacherId,
        month_year: selectedMonthYear,
        total_sessions: workLogs.length,
        total_hours: workLogs.length * 1.5,
        rate_per_session: perSessionRate,
        total_earnings: workLogs.length * perSessionRate + (timesheet.bonus || 0) - (timesheet.deduction || 0),
        bonus: timesheet.bonus || 0,
        deduction: timesheet.deduction || 0,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      };

      const { error } = await sb
        .from('teacher_timesheets')
        .upsert(payload, { onConflict: 'teacher_id,month_year' });

      if (error) throw error;

      toast({
        title: 'Đã gửi chốt công tháng!',
        description: `Bảng chấm công Tháng ${selectedMonthYear} đã được gửi tới Ban Giám Hiệu / Admin.`,
      });

      fetchTimesheetAndWorkLogs();
    } catch (e: any) {
      toast({ title: 'Lỗi gửi chốt công', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Admin Approve / Mark Paid
  const handleAdminUpdateStatus = async (newStatus: 'approved' | 'paid') => {
    if (!timesheet || !user) return;
    try {
      const sb: any = supabase;
      const { error } = await sb
        .from('teacher_timesheets')
        .update({
          status: newStatus,
          approved_at: new Date().toISOString(),
        })
        .eq('teacher_id', targetTeacherId)
        .eq('month_year', selectedMonthYear);

      if (error) throw error;

      toast({
        title: newStatus === 'approved' ? 'Đã duyệt bảng chấm công' : 'Đã xác nhận thanh toán thù lao',
      });
      fetchTimesheetAndWorkLogs();
    } catch (e: any) {
      toast({ title: 'Lỗi cập nhật', description: e.message, variant: 'destructive' });
    }
  };

  // Export to Google Sheets
  const handleExportExcel = () => {
    if (!timesheet) return;
    const headers = ['STT', 'Ngày dạy', 'Tên Lớp học', 'Chủ đề bài giảng', 'Giờ dạy', 'Thời lượng (giờ)', 'Điểm danh (Hiện diện/Sĩ số)', 'Trạng thái'];
    const rows = workLogs.map((log, idx) => [
      idx + 1,
      format(parseISO(log.session_date), 'dd/MM/yyyy'),
      log.class_name,
      log.topic || 'Bài học trên lớp',
      log.start_time,
      log.duration_hours,
      `${log.attendance_count}/${log.total_students}`,
      'Đã hoàn thành'
    ]);

    // Append summary rows
    rows.push([]);
    rows.push(['TỔNG CỘNG', '', '', '', '', `${timesheet.total_hours} giờ`, `${workLogs.length} buổi học`, '']);
    rows.push(['MỨC THÙ LAO BUỔI', '', '', '', '', `${perSessionRate.toLocaleString('vi-VN')} VNĐ / buổi`, '', '']);
    rows.push(['TỔNG THÙ LAO TÍNH LƯƠNG', '', '', '', '', `${(timesheet.total_earnings || 0).toLocaleString('vi-VN')} VNĐ`, '', '']);

    exportToGoogleSheetsCSV(`Bang_Cham_Cong_Giang_Vien_${selectedMonthYear}`, headers, rows);
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'submitted':
        return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30">🟡 Chờ Admin duyệt</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30">🔵 Đã duyệt chốt công</Badge>;
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-700 border-green-500/30">🟢 Đã thanh toán thù lao</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground">⚪ Bản nháp</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-sm text-muted-foreground">Đang tải bảng chấm công...</div>;
  }

  const finalEarnings = (workLogs.length * perSessionRate) + (timesheet?.bonus || 0) - (timesheet?.deduction || 0);

  return (
    <div className="space-y-6">
      {/* Month Picker Header */}
      <div className="bg-gradient-to-r from-card via-card/90 to-primary/5 p-5 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              Bảng Chấm Công & Thù Lao Giảng Dạy
            </h2>
            {getStatusBadge(timesheet?.status || 'draft')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Theo dõi tổng số buổi dạy, số giờ đứng lớp và tính toán thù lao tự động hàng tháng.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Input
            type="month"
            value={selectedMonthYear}
            onChange={(e) => setSelectedMonthYear(e.target.value)}
            className="h-10 text-xs font-bold w-40 bg-background"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-10 text-xs font-bold bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/30"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Xuất Excel / Sheets
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Tổng số buổi dạy</p>
              <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{workLogs.length} buổi</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Tổng số giờ giảng</p>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-400">{workLogs.length * 1.5} giờ</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Mức thù lao / buổi</p>
              <p className="text-xl font-black text-amber-700 dark:text-amber-400">{perSessionRate.toLocaleString('vi-VN')} đ</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Tổng thù lao nhận được</p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{finalEarnings.toLocaleString('vi-VN')} đ</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table of Taught Sessions */}
      <Card className="border-border shadow-soft">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Chi tiết các Buổi học đã hoàn thành trong tháng {selectedMonthYear}
          </CardTitle>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isAdminView ? (
              <Button
                size="sm"
                onClick={handleSubmitTimesheet}
                disabled={submitting || timesheet?.status === 'approved' || timesheet?.status === 'paid'}
                className="font-bold gap-1.5 bg-primary shadow-xs"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu chốt công tháng'}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAdminUpdateStatus('approved')}
                  disabled={timesheet?.status === 'approved' || timesheet?.status === 'paid'}
                  className="text-xs font-bold border-blue-500/30 text-blue-700 hover:bg-blue-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Duyệt chốt công
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAdminUpdateStatus('paid')}
                  disabled={timesheet?.status === 'paid'}
                  className="text-xs font-bold bg-green-600 hover:bg-green-700"
                >
                  <DollarSign className="w-3.5 h-3.5 mr-1" /> Xác nhận đã thanh toán
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {workLogs.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30 text-primary" />
              Chưa có dữ liệu buổi dạy nào trong tháng {selectedMonthYear}.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">STT</TableHead>
                  <TableHead>Ngày dạy</TableHead>
                  <TableHead>Lớp học</TableHead>
                  <TableHead>Chủ đề bài giảng</TableHead>
                  <TableHead>Khung giờ</TableHead>
                  <TableHead>Thời lượng</TableHead>
                  <TableHead>Điểm danh</TableHead>
                  <TableHead className="text-right">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workLogs.map((log, idx) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-bold text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-semibold text-xs">
                      {format(parseISO(log.session_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="font-bold text-xs text-primary">{log.class_name}</TableCell>
                    <TableCell className="text-xs font-medium">{log.topic || 'Bài học trên lớp'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.start_time}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.duration_hours}h (90p)</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30">
                        {log.attendance_count}/{log.total_students || 0} học viên
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-500/10 text-green-700 border-green-500/30 text-[11px]">
                        🟢 Hoàn thành
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherTimesheet;

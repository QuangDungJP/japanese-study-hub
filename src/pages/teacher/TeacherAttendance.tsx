import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardCheck, 
  BarChart3, 
  GraduationCap, 
  PlayCircle, 
  Clock, 
  CheckCircle2,
  Layers,
  Sparkles
} from 'lucide-react';
import AttendanceManager from '@/components/teacher/AttendanceManager';
import AttendanceStats from '@/components/teacher/AttendanceStats';

interface ClassItem {
  id: string;
  name_vi: string;
  is_active: boolean | null;
  start_date: string | null;
  end_date: string | null;
}

export type ClassStatusFilter = 'all' | 'active' | 'upcoming' | 'completed';

export function getClassStatus(cls: { is_active?: boolean | null; start_date?: string | null; end_date?: string | null }): 'active' | 'upcoming' | 'completed' {
  const today = new Date().toISOString().split('T')[0];
  if (cls.start_date && cls.start_date > today) {
    return 'upcoming';
  }
  if (cls.is_active === false || (cls.end_date && cls.end_date < today)) {
    return 'completed';
  }
  return 'active';
}

const TeacherAttendancePage = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('manage');
  const [statusFilter, setStatusFilter] = useState<ClassStatusFilter>('all');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchClassOverview();
    }
  }, [user]);

  const fetchClassOverview = async () => {
    try {
      let query = supabase
        .from('classes')
        .select('id, name_vi, is_active, start_date, end_date');

      if (!isAdmin && user?.id) {
        query = query.eq('teacher_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClasses(data || []);
    } catch (err) {
      console.error('Error fetching class overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalClasses = classes.length;
  const activeCount = classes.filter(c => getClassStatus(c) === 'active').length;
  const upcomingCount = classes.filter(c => getClassStatus(c) === 'upcoming').length;
  const completedCount = classes.filter(c => getClassStatus(c) === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2.5">
            <ClipboardCheck className="w-8 h-8 text-primary" />
            Điểm danh & Thống kê Chuyên cần
          </h1>
          <p className="text-muted-foreground mt-1">
            Tổng quan tất cả lớp học, thực hiện điểm danh buổi học và theo dõi tỷ lệ tham gia của học viên
          </p>
        </div>
      </div>

      {/* KPI Overview Bar - Summary across ALL classes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all border-2 ${statusFilter === 'all' ? 'border-primary shadow-md bg-primary/5' : 'hover:border-primary/50'}`}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng các lớp</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">{totalClasses}</span>
                <span className="text-xs text-muted-foreground">lớp học</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all border-2 ${statusFilter === 'active' ? 'border-emerald-500 shadow-md bg-emerald-500/5' : 'hover:border-emerald-500/50'}`}
          onClick={() => setStatusFilter('active')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <PlayCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đang giảng dạy</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                  Hoạt động
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all border-2 ${statusFilter === 'upcoming' ? 'border-indigo-500 shadow-md bg-indigo-500/5' : 'hover:border-indigo-500/50'}`}
          onClick={() => setStatusFilter('upcoming')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sắp khai giảng</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{upcomingCount}</span>
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/30 text-[10px]">
                  Sắp tới
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all border-2 ${statusFilter === 'completed' ? 'border-slate-500 shadow-md bg-slate-500/5' : 'hover:border-slate-500/50'}`}
          onClick={() => setStatusFilter('completed')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đã hoàn thành</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-600 dark:text-slate-400">{completedCount}</span>
                <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/30 text-[10px]">
                  Kết thúc
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="manage" className="gap-2 font-bold">
            <ClipboardCheck className="w-4 h-4" />
            <span>Điểm danh lớp học</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2 font-bold">
            <BarChart3 className="w-4 h-4" />
            <span>Báo cáo & Thống kê</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-4">
          <AttendanceManager initialStatusFilter={statusFilter} />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <AttendanceStats initialStatusFilter={statusFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherAttendancePage;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  BookText, 
  TrendingUp,
  Plus,
  ArrowRight,
  GraduationCap,
  Building,
  Globe,
  FileText,
  DollarSign,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatWithJST } from '@/lib/dateUtils';
import ActivityChart from '@/components/admin/ActivityChart';
import SkillDistributionChart from '@/components/admin/SkillDistributionChart';
import TopLearnersCard from '@/components/admin/TopLearnersCard';

interface Stats {
  totalUsers: number;
  totalClasses: number;
  totalLessons: number;
  totalVocabulary: number;
  activeUsers: number;
  totalOrders: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalClasses: 0,
    totalLessons: 0,
    totalVocabulary: 0,
    activeUsers: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel('public:admin-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vocabulary' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [usersResult, classesResult, lessonsResult, vocabResult, activeResult, ordersResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('vocabulary').select('*', { count: 'exact', head: true }),
        supabase.from('user_progress').select('*', { count: 'exact', head: true }).eq('last_activity_date', today),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalClasses: classesResult.count || 0,
        totalLessons: lessonsResult.count || 0,
        totalVocabulary: vocabResult.count || 0,
        activeUsers: activeResult.count || 0,
        totalOrders: ordersResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: 'Tổng học viên', value: stats.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-500/10 border-blue-200', href: '/admin/users' },
    { name: 'Lớp học Google Classroom', value: stats.totalClasses, icon: Building, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200', href: '/admin/classes' },
    { name: 'Bài học & Bài tập', value: stats.totalLessons, icon: BookOpen, color: 'text-purple-600 bg-purple-500/10 border-purple-200', href: '/admin/lessons' },
    { name: 'Từ vựng JLPT', value: stats.totalVocabulary, icon: BookText, color: 'text-pink-600 bg-pink-500/10 border-pink-200', href: '/admin/vocabulary' },
    { name: 'Hoạt động hôm nay', value: stats.activeUsers, icon: TrendingUp, color: 'text-amber-600 bg-amber-500/10 border-amber-200', href: '/admin/users' },
    { name: 'Đơn hàng mua khóa học', value: stats.totalOrders, icon: DollarSign, color: 'text-indigo-600 bg-indigo-500/10 border-indigo-200', href: '/admin/orders' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary via-primary/90 to-accent p-6 md:p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" /> TNQDO Admin Portal
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Bảng điều khiển Quản trị viên
            </h1>
            <p className="text-white/80 text-sm md:text-base max-w-xl font-medium">
              Theo dõi tình hình đào tạo, lớp học Google Classroom, bài học và hoạt động của toàn bộ hệ thống.
            </p>
            <p className="text-xs text-white/70 pt-1 font-mono">
              📅 {formatWithJST(new Date(), true)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" className="gap-2 font-bold shadow-md" asChild>
              <Link to="/admin/classes">
                <Building className="w-4 h-4" /> Quản lý Lớp học
              </Link>
            </Button>
            <Button className="bg-white text-primary hover:bg-white/90 gap-2 font-bold shadow-md" asChild>
              <Link to="/admin/lessons">
                <Plus className="w-4 h-4" /> Thêm bài học mới
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="bg-card rounded-2xl p-6 border border-border/80 shadow-soft hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3.5 rounded-2xl border ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </div>
            <div className="mt-5">
              <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
              <p className="text-3xl font-extrabold text-foreground mt-1">
                {loading ? '...' : stat.value.toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Activity Chart */}
      <ActivityChart />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkillDistributionChart />
        <TopLearnersCard />
      </div>

      {/* Quick Access Modules Hub */}
      <Card className="border-border shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" /> Thao tác nhanh hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/classes"
              className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all group"
            >
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">Lớp học Classroom</p>
                <p className="text-xs text-muted-foreground">5 Tab quản lý toàn diện</p>
              </div>
            </Link>

            <Link
              to="/admin/teachers"
              className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all group"
            >
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">Giảng viên</p>
                <p className="text-xs text-muted-foreground">Phân quyền & duyệt hồ sơ</p>
              </div>
            </Link>

            <Link
              to="/admin/website"
              className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all group"
            >
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">Website CMS</p>
                <p className="text-xs text-muted-foreground">Chỉnh sửa trang chủ, Banner</p>
              </div>
            </Link>

            <Link
              to="/admin/orders"
              className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all group"
            >
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">Đơn hàng</p>
                <p className="text-xs text-muted-foreground">Xác nhận chuyển khoản</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

// D:\QuangDung\QuangDung\japanese-study-hub\src\pages\admin\AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  BookText, 
  TrendingUp,
  Plus,
  ArrowRight,
  Layout // Icon chuyên dụng cho CMS quản lý giao diện
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import ActivityChart from '@/components/admin/ActivityChart';
import SkillDistributionChart from '@/components/admin/SkillDistributionChart';
import TopLearnersCard from '@/components/admin/TopLearnersCard';

interface Stats {
  totalUsers: number;
  totalLessons: number;
  totalVocabulary: number;
  activeUsers: number;
  totalContent: number; // Biến đếm số lượng khối nội dung tĩnh trong DB
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalLessons: 0,
    totalVocabulary: 0,
    activeUsers: 0,
    totalContent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [usersResult, lessonsResult, vocabResult, activeResult, contentResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('vocabulary').select('*', { count: 'exact', head: true }),
        supabase.from('user_progress').select('*', { count: 'exact', head: true }).eq('last_activity_date', today),
        supabase.from('website_content').select('*', { count: 'exact', head: true }), // Đếm tổng số khối nội dung trang tĩnh
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalLessons: lessonsResult.count || 0,
        totalVocabulary: vocabResult.count || 0,
        activeUsers: activeResult.count || 0,
        totalContent: contentResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: 'Tổng người dùng', value: stats.totalUsers, icon: Users, color: 'bg-blue-500', href: '/admin/users' },
    { name: 'Bài học', value: stats.totalLessons, icon: BookOpen, color: 'bg-green-500', href: '/admin/lessons' },
    { name: 'Từ vựng', value: stats.totalVocabulary, icon: BookText, color: 'bg-purple-500', href: '/admin/vocabulary' },
    { name: 'Nội dung Website', value: stats.totalContent, icon: Layout, color: 'bg-pink-500', href: '/admin/website' }, // Tích hợp link /admin/website
    { name: 'Hoạt động hôm nay', value: stats.activeUsers, icon: TrendingUp, color: 'bg-orange-500', href: '/admin/users' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Quản lý nội dung và người dùng</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/vocabulary">
              <Plus className="w-4 h-4" />
              Thêm từ vựng
            </Link>
          </Button>
          <Button variant="hero" asChild>
            <Link to="/admin/lessons">
              <Plus className="w-4 h-4" />
              Thêm bài học
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid - Đổi lên 5 cột (lg:grid-cols-5) để layout vừa vặn khi thêm card mới */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="bg-card rounded-2xl p-6 border border-border shadow-soft hover:shadow-card-hover transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-xl ${stat.color}/10 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{stat.name}</p>
              <p className="text-3xl font-bold text-foreground">
                {loading ? '...' : stat.value}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-soft">
          <h2 className="text-lg font-bold text-foreground mb-4">Thao tác nhanh</h2>
          <div className="space-y-3">
            <Link
              to="/admin/lessons"
              className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="font-medium">Quản lý bài học</span>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </Link>
            <Link
              to="/admin/vocabulary"
              className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookText className="w-5 h-5 text-primary" />
                <span className="font-medium">Quản lý từ vựng</span>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </Link>
            <Link
              to="/admin/website" // Sửa endpoint khớp lệnh hệ thống /admin/website
              className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Layout className="w-5 h-5 text-primary" />
                <span className="font-medium">Quản lý giao diện & FAQ (CMS)</span>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium">Quản lý người dùng</span>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-soft">
          <h2 className="text-lg font-bold text-foreground mb-4">Hướng dẫn</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Thêm bài học:</strong> Vào mục "Bài học" để tạo các bài học mới cho từng kỹ năng (Đọc, Nói, Viết, Nghe).
            </p>
            <p>
              <strong className="text-foreground">Thêm từ vựng:</strong> Vào mục "Từ vựng" để thêm các từ mới với nghĩa tiếng Việt, phát âm và ví dụ.
            </p>
            <p>
              <strong className="text-foreground">Quản lý nội dung Web:</strong> Chỉnh sửa linh hoạt hệ thống câu hỏi FAQ xổ xuống và cấu hình chuỗi chữ tĩnh ngoài trang Landing Page thông qua trang quản trị nội dung.
            </p>
            <p>
              <strong className="text-foreground">Quản lý người dùng:</strong> Theo dõi tiến độ học viên và quản lý quyền truy cập hệ thống.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
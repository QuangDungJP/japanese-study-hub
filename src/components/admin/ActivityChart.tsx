import { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subWeeks, subMonths, startOfDay, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ActivityData {
  date: string;
  lessonsCompleted: number;
  xpEarned: number;
  activeUsers: number;
}

const ActivityChart = () => {
  const [dailyData, setDailyData] = useState<ActivityData[]>([]);
  const [weeklyData, setWeeklyData] = useState<ActivityData[]>([]);
  const [monthlyData, setMonthlyData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      const now = new Date();
      
      // Fetch completed lessons for the last 30 days
      const thirtyDaysAgo = subDays(now, 30);
      const { data: completedLessons } = await supabase
        .from('completed_lessons')
        .select('completed_at, user_id, score')
        .gte('completed_at', thirtyDaysAgo.toISOString());

      // Fetch user progress for XP tracking
      const { data: userProgress } = await supabase
        .from('user_progress')
        .select('total_xp, last_activity_date, user_id');

      // Generate daily data for last 7 days
      const last7Days = eachDayOfInterval({
        start: subDays(now, 6),
        end: now
      });

      const daily = last7Days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const lessonsOnDay = completedLessons?.filter(lesson => {
          const lessonDate = new Date(lesson.completed_at || '');
          return lessonDate >= dayStart && lessonDate < dayEnd;
        }) || [];

        const uniqueUsers = new Set(lessonsOnDay.map(l => l.user_id)).size;
        const xpEarned = lessonsOnDay.length * 25; // Assuming 25 XP per lesson

        return {
          date: format(day, 'EEE', { locale: vi }),
          lessonsCompleted: lessonsOnDay.length,
          xpEarned,
          activeUsers: uniqueUsers
        };
      });

      // Generate weekly data for last 4 weeks
      const last4Weeks = eachWeekOfInterval({
        start: subWeeks(now, 3),
        end: now
      }, { weekStartsOn: 1 });

      const weekly = last4Weeks.map((week, index) => {
        const weekStart = startOfWeek(week, { weekStartsOn: 1 });
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const lessonsInWeek = completedLessons?.filter(lesson => {
          const lessonDate = new Date(lesson.completed_at || '');
          return lessonDate >= weekStart && lessonDate < weekEnd;
        }) || [];

        const uniqueUsers = new Set(lessonsInWeek.map(l => l.user_id)).size;
        const xpEarned = lessonsInWeek.length * 25;

        return {
          date: `Tuần ${index + 1}`,
          lessonsCompleted: lessonsInWeek.length,
          xpEarned,
          activeUsers: uniqueUsers
        };
      });

      // Generate monthly data for last 6 months
      const last6Months = eachMonthOfInterval({
        start: subMonths(now, 5),
        end: now
      });

      const monthly = last6Months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        const lessonsInMonth = completedLessons?.filter(lesson => {
          const lessonDate = new Date(lesson.completed_at || '');
          return lessonDate >= monthStart && lessonDate < monthEnd;
        }) || [];

        const uniqueUsers = new Set(lessonsInMonth.map(l => l.user_id)).size;
        const xpEarned = lessonsInMonth.length * 25;

        return {
          date: format(month, 'MMM', { locale: vi }),
          lessonsCompleted: lessonsInMonth.length,
          xpEarned,
          activeUsers: uniqueUsers
        };
      });

      setDailyData(daily);
      setWeeklyData(weekly);
      setMonthlyData(monthly);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-soft">
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-soft">
      <h2 className="text-lg font-bold text-foreground mb-4">Thống kê hoạt động</h2>
      
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="daily">Theo ngày</TabsTrigger>
          <TabsTrigger value="weekly">Theo tuần</TabsTrigger>
          <TabsTrigger value="monthly">Theo tháng</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-muted-foreground" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis className="text-muted-foreground" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="lessonsCompleted" 
                name="Bài học hoàn thành"
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorLessons)" 
              />
              <Area 
                type="monotone" 
                dataKey="activeUsers" 
                name="Người dùng hoạt động"
                stroke="hsl(142, 76%, 36%)" 
                fillOpacity={1} 
                fill="url(#colorXp)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="weekly" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="lessonsCompleted" 
                name="Bài học hoàn thành"
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="xpEarned" 
                name="XP kiếm được"
                fill="hsl(142, 76%, 36%)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="monthly" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="lessonsCompleted" 
                name="Bài học hoàn thành"
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="activeUsers" 
                name="Người dùng hoạt động"
                fill="hsl(262, 83%, 58%)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ActivityChart;

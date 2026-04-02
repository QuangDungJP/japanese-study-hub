import { useMemo } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, subWeeks, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AttendanceRecord {
  session_date: string;
  status: string;
}

interface AttendanceChartProps {
  attendanceData: AttendanceRecord[];
  viewMode: 'week' | 'month';
}

const chartConfig = {
  present: {
    label: 'Có mặt',
    color: 'hsl(var(--chart-1))',
  },
  late: {
    label: 'Đi muộn',
    color: 'hsl(var(--chart-2))',
  },
  absent: {
    label: 'Vắng mặt',
    color: 'hsl(var(--chart-3))',
  },
  excused: {
    label: 'Có phép',
    color: 'hsl(var(--chart-4))',
  },
  rate: {
    label: 'Tỷ lệ tham gia',
    color: 'hsl(var(--chart-5))',
  },
};

const AttendanceChart = ({ attendanceData, viewMode }: AttendanceChartProps) => {
  const chartData = useMemo(() => {
    const now = new Date();

    if (viewMode === 'week') {
      // Last 8 weeks data
      const weeks = eachWeekOfInterval({
        start: subWeeks(now, 7),
        end: now,
      }, { weekStartsOn: 1 });

      return weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekData = attendanceData.filter(a => {
          const date = parseISO(a.session_date);
          return date >= weekStart && date <= weekEnd;
        });

        const present = weekData.filter(a => a.status === 'present').length;
        const late = weekData.filter(a => a.status === 'late').length;
        const absent = weekData.filter(a => a.status === 'absent').length;
        const excused = weekData.filter(a => a.status === 'excused').length;
        const total = weekData.length || 1;
        const rate = Math.round(((present + late) / total) * 100);

        return {
          name: format(weekStart, 'dd/MM', { locale: vi }),
          present,
          late,
          absent,
          excused,
          rate,
        };
      });
    } else {
      // Last 6 months data
      const months = eachMonthOfInterval({
        start: subMonths(startOfMonth(now), 5),
        end: now,
      });

      return months.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthData = attendanceData.filter(a => {
          const date = parseISO(a.session_date);
          return date >= monthStart && date <= monthEnd;
        });

        const present = monthData.filter(a => a.status === 'present').length;
        const late = monthData.filter(a => a.status === 'late').length;
        const absent = monthData.filter(a => a.status === 'absent').length;
        const excused = monthData.filter(a => a.status === 'excused').length;
        const total = monthData.length || 1;
        const rate = Math.round(((present + late) / total) * 100);

        return {
          name: format(monthStart, 'MM/yyyy', { locale: vi }),
          present,
          late,
          absent,
          excused,
          rate,
        };
      });
    }
  }, [attendanceData, viewMode]);

  return (
    <div className="space-y-6">
      {/* Attendance Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Xu hướng tỷ lệ tham gia {viewMode === 'week' ? '(theo tuần)' : '(theo tháng)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]}
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value) => [`${value}%`, 'Tỷ lệ tham gia']}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorRate)"
                name="Tỷ lệ tham gia"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status Distribution Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Phân bố trạng thái {viewMode === 'week' ? '(theo tuần)' : '(theo tháng)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    present: 'Có mặt',
                    late: 'Đi muộn',
                    absent: 'Vắng mặt',
                    excused: 'Có phép',
                  };
                  return labels[value] || value;
                }}
              />
              <Bar dataKey="present" stackId="a" fill="hsl(142.1 76.2% 36.3%)" name="present" radius={[0, 0, 0, 0]} />
              <Bar dataKey="late" stackId="a" fill="hsl(47.9 95.8% 53.1%)" name="late" />
              <Bar dataKey="absent" stackId="a" fill="hsl(0 72.2% 50.6%)" name="absent" />
              <Bar dataKey="excused" stackId="a" fill="hsl(221.2 83.2% 53.3%)" name="excused" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceChart;

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface SkillData {
  name: string;
  value: number;
  color: string;
}

const SKILL_COLORS: Record<string, string> = {
  reading: 'hsl(var(--primary))',
  listening: 'hsl(142, 76%, 36%)',
  speaking: 'hsl(262, 83%, 58%)',
  writing: 'hsl(25, 95%, 53%)',
};

const SKILL_NAMES: Record<string, string> = {
  reading: 'Đọc hiểu',
  listening: 'Nghe hiểu',
  speaking: 'Nói',
  writing: 'Viết',
};

const SkillDistributionChart = () => {
  const [data, setData] = useState<SkillData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkillDistribution();
  }, []);

  const fetchSkillDistribution = async () => {
    try {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('skill');

      if (lessons) {
        const skillCounts: Record<string, number> = {};
        lessons.forEach(lesson => {
          skillCounts[lesson.skill] = (skillCounts[lesson.skill] || 0) + 1;
        });

        const chartData = Object.entries(skillCounts).map(([skill, count]) => ({
          name: SKILL_NAMES[skill] || skill,
          value: count,
          color: SKILL_COLORS[skill] || 'hsl(var(--muted))',
        }));

        setData(chartData);
      }
    } catch (error) {
      console.error('Error fetching skill distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">{payload[0].value} bài học</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-soft h-full">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-soft h-full">
        <h2 className="text-lg font-bold text-foreground mb-4">Phân bố bài học theo kỹ năng</h2>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Chưa có dữ liệu bài học
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-soft h-full">
      <h2 className="text-lg font-bold text-foreground mb-4">Phân bố bài học theo kỹ năng</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SkillDistributionChart;

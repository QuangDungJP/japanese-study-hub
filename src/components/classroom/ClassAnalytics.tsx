import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, AlertTriangle, Trophy, Percent } from 'lucide-react';

interface Props { classId: string }

const ClassAnalytics = ({ classId }: Props) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const sb: any = supabase;
      const [{ data: a }, { data: cs }] = await Promise.all([
        sb.from('class_assignments').select('id, title, points, due_date').eq('class_id', classId),
        sb.from('class_students').select('student_id').eq('class_id', classId),
      ]);
      setAssignments(a || []);
      const sids = (cs || []).map((x: any) => x.student_id);
      if (sids.length) {
        const { data: profs } = await supabase.from('profiles').select('user_id, full_name').in('user_id', sids);
        setStudents((cs || []).map((x: any) => ({ ...x, profile: profs?.find(p => p.user_id === x.student_id) })));
      }
      const aids = (a || []).map((x: any) => x.id);
      if (aids.length) {
        const { data } = await sb.from('class_assignment_submissions').select('*').in('assignment_id', aids);
        setSubs(data || []);
      }
    };
    load();
  }, [classId]);

  const stats = useMemo(() => {
    const totalSlots = assignments.length * students.length;
    const submittedCount = subs.filter(s => s.status === 'submitted' || s.status === 'graded').length;
    const gradedCount = subs.filter(s => s.status === 'graded').length;
    const submitRate = totalSlots ? Math.round((submittedCount / totalSlots) * 100) : 0;
    const avgScore = gradedCount
      ? subs.filter(s => s.score != null).reduce((a, s) => a + Number(s.score), 0) / gradedCount
      : 0;

    const chartData = assignments.map(a => {
      const sList = subs.filter(s => s.assignment_id === a.id);
      const submitted = sList.filter(s => s.status !== 'assigned').length;
      const graded = sList.filter(s => s.score != null);
      const avg = graded.length ? graded.reduce((x, s) => x + Number(s.score), 0) / graded.length : 0;
      return {
        name: a.title.length > 18 ? a.title.slice(0, 18) + '…' : a.title,
        'Nộp': students.length ? Math.round((submitted / students.length) * 100) : 0,
        'Điểm TB': Math.round(avg),
      };
    });

    const perStudent: Record<string, { sub: number; sum: number; graded: number }> = {};
    students.forEach(s => { perStudent[s.student_id] = { sub: 0, sum: 0, graded: 0 }; });
    subs.forEach(s => {
      if (!perStudent[s.student_id]) return;
      if (s.status === 'submitted' || s.status === 'graded') perStudent[s.student_id].sub++;
      if (s.score != null) { perStudent[s.student_id].sum += Number(s.score); perStudent[s.student_id].graded++; }
    });
    const ranked = students.map(s => ({
      name: s.profile?.full_name || '—',
      sub: perStudent[s.student_id]?.sub || 0,
      avg: perStudent[s.student_id]?.graded ? perStudent[s.student_id].sum / perStudent[s.student_id].graded : 0,
    }));
    const top = [...ranked].sort((a, b) => b.avg - a.avg || b.sub - a.sub).slice(0, 5);
    const attention = ranked.filter(r => r.sub < assignments.length && assignments.length > 0)
      .sort((a, b) => a.sub - b.sub).slice(0, 5);

    return { submitRate, avgScore, submittedCount, gradedCount, chartData, top, attention };
  }, [assignments, subs, students]);

  if (assignments.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Percent className="w-3 h-3" />Tỷ lệ nộp</div>
          <p className="text-2xl font-bold text-primary">{stats.submitRate}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><TrendingUp className="w-3 h-3" />Điểm TB</div>
          <p className="text-2xl font-bold">{stats.avgScore.toFixed(1)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-muted-foreground text-xs">Đã nộp / đã chấm</div>
          <p className="text-2xl font-bold">{stats.submittedCount}<span className="text-base text-muted-foreground">/{stats.gradedCount}</span></p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-muted-foreground text-xs">Học viên · Bài</div>
          <p className="text-2xl font-bold">{students.length}<span className="text-base text-muted-foreground"> · {assignments.length}</span></p>
        </CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card><CardContent className="p-4">
          <h4 className="font-semibold mb-3 text-sm">Tỷ lệ nộp theo bài (%)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="Nộp" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <h4 className="font-semibold mb-3 text-sm">Điểm trung bình theo bài</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="Điểm TB" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card><CardContent className="p-4">
          <h4 className="font-semibold mb-3 text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" />Top học viên</h4>
          <div className="space-y-2">
            {stats.top.length === 0 ? <p className="text-xs text-muted-foreground">Chưa có dữ liệu</p> :
              stats.top.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><Badge variant="outline" className="w-6 justify-center">{i + 1}</Badge>{s.name}</span>
                  <span className="text-primary font-semibold">{s.avg.toFixed(1)}</span>
                </div>
              ))}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <h4 className="font-semibold mb-3 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" />Cần chú ý</h4>
          <div className="space-y-2">
            {stats.attention.length === 0 ? <p className="text-xs text-muted-foreground">Tất cả đều đã nộp đủ 🎉</p> :
              stats.attention.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{s.name}</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-500/30">{s.sub}/{assignments.length} bài</Badge>
                </div>
              ))}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
};

export default ClassAnalytics;
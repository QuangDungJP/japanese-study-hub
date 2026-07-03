import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, ClipboardCheck } from 'lucide-react';
import GradingDialog from './GradingDialog';

interface Props { classId: string }

const Gradebook = ({ classId }: Props) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [grading, setGrading] = useState<{ a: any; s: any; name: string } | null>(null);

  const load = async () => {
    const sb: any = supabase;
    const [{ data: a }, { data: cs }] = await Promise.all([
      sb.from('class_assignments').select('*').eq('class_id', classId).order('created_at'),
      sb.from('class_students').select('*').eq('class_id', classId),
    ]);
    setAssignments(a || []);
    const sids = (cs || []).map((x: any) => x.student_id);
    let profs: any[] = [];
    if (sids.length) {
      const { data: p } = await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', sids);
      profs = p || [];
    }
    setStudents((cs || []).map((x: any) => ({ ...x, profile: profs.find(p => p.user_id === x.student_id) })));
    const aids = (a || []).map((x: any) => x.id);
    if (aids.length) {
      const { data: subsData } = await sb.from('class_assignment_submissions').select('*').in('assignment_id', aids);
      setSubs(subsData || []);
    } else setSubs([]);
  };

  useEffect(() => { load(); }, [classId]);

  const cell = (aid: string, sid: string) => subs.find(x => x.assignment_id === aid && x.student_id === sid);

  const totals = useMemo(() => {
    const map: Record<string, { sum: number; max: number }> = {};
    students.forEach(s => {
      let sum = 0, max = 0;
      assignments.forEach(a => {
        const sub = cell(a.id, s.student_id);
        if (sub?.score != null) sum += Number(sub.score) || 0;
        max += a.points || 100;
      });
      map[s.student_id] = { sum, max };
    });
    return map;
  }, [assignments, students, subs]);

  const exportCSV = () => {
    const header = ['Học viên', ...assignments.map(a => `${a.title} (/${a.points || 100})`), 'Tổng', 'Trung bình %'];
    const rows = students.map(s => {
      const cells = assignments.map(a => cell(a.id, s.student_id)?.score ?? '');
      const t = totals[s.student_id];
      const pct = t?.max ? ((t.sum / t.max) * 100).toFixed(1) : '';
      return [s.profile?.full_name || s.student_id, ...cells, t?.sum ?? '', pct];
    });
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `so-diem-${classId}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (sub: any, a: any) => {
    if (!sub) return <Badge variant="outline" className="text-[10px]">—</Badge>;
    if (sub.status === 'graded') return <Badge className="bg-green-500/15 text-green-700 border-green-500/30">{sub.score}/{a.points || 100}</Badge>;
    if (sub.status === 'submitted') return <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30">Đã nộp</Badge>;
    return <Badge variant="outline">{sub.status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Sổ điểm lớp học</h3>
          <Badge variant="outline">{students.length} HV · {assignments.length} bài</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />Xuất CSV</Button>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">Học viên</TableHead>
              {assignments.map(a => (
                <TableHead key={a.id} className="min-w-[120px] text-center">
                  <div className="text-xs font-medium truncate max-w-[140px]" title={a.title}>{a.title}</div>
                  <div className="text-[10px] text-muted-foreground">/{a.points || 100}</div>
                </TableHead>
              ))}
              <TableHead className="text-center">Tổng</TableHead>
              <TableHead className="text-center">TB %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow><TableCell colSpan={assignments.length + 3} className="text-center text-muted-foreground py-8">Chưa có học viên</TableCell></TableRow>
            ) : students.map(s => {
              const t = totals[s.student_id];
              const pct = t?.max ? (t.sum / t.max) * 100 : 0;
              return (
                <TableRow key={s.student_id}>
                  <TableCell className="sticky left-0 bg-background font-medium">{s.profile?.full_name || '—'}</TableCell>
                  {assignments.map(a => {
                    const sub = cell(a.id, s.student_id);
                    return (
                      <TableCell key={a.id} className="text-center">
                        <button className="hover:opacity-70 transition" onClick={() => sub && setGrading({ a, s: sub, name: s.profile?.full_name })} disabled={!sub}>
                          {statusBadge(sub, a)}
                        </button>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center font-semibold">{t?.sum ?? 0}</TableCell>
                  <TableCell className="text-center">
                    <span className={pct >= 80 ? 'text-green-600 font-bold' : pct >= 50 ? 'text-orange-500' : 'text-red-500'}>
                      {pct.toFixed(0)}%
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>

      {grading && (
        <GradingDialog
          open={!!grading}
          onOpenChange={(v) => !v && setGrading(null)}
          assignment={grading.a}
          submission={grading.s}
          studentName={grading.name}
          onSaved={load}
        />
      )}
    </div>
  );
};

export default Gradebook;
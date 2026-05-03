import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, ClipboardList, GraduationCap, CalendarClock, ExternalLink, Link2, Play, Clock } from 'lucide-react';
import { format } from 'date-fns';

const StudentClassDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [cls, setCls] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const sb: any = supabase;
      const [{ data: c }, { data: l }, { data: a }, { data: e }] = await Promise.all([
        sb.from('classes').select('*').eq('id', id).maybeSingle(),
        sb.from('lessons').select('*').eq('class_id', id).eq('is_published', true).order('start_at', { ascending: true, nullsFirst: false }),
        sb.from('class_assignments').select('*').eq('class_id', id).order('start_at', { ascending: true, nullsFirst: false }),
        sb.from('exams').select('*').eq('class_id', id).eq('is_published', true).order('exam_date', { ascending: true }),
      ]);
      setCls(c); setLessons(l || []); setAssignments(a || []); setExams(e || []);
      setLoading(false);
    })();
  }, [id, user]);

  const now = new Date();
  const isAvailable = (start?: string | null, end?: string | null) => {
    if (start && new Date(start) > now) return 'upcoming';
    if (end && new Date(end) < now) return 'ended';
    return 'open';
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Đang tải...</div>;
  if (!cls) return <div className="text-center py-12">Không tìm thấy lớp học</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/learn/classes"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{cls.name_vi}</h1>
          <p className="text-sm text-muted-foreground">{cls.description_vi || cls.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" /><span className="text-sm text-muted-foreground">Bài học</span></div><p className="text-2xl font-bold">{lessons.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-orange-500" /><span className="text-sm text-muted-foreground">Bài tập</span></div><p className="text-2xl font-bold">{assignments.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-purple-500" /><span className="text-sm text-muted-foreground">Kiểm tra</span></div><p className="text-2xl font-bold">{exams.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="lessons">
        <TabsList>
          <TabsTrigger value="lessons"><BookOpen className="w-4 h-4 mr-1" />Bài học</TabsTrigger>
          <TabsTrigger value="assignments"><ClipboardList className="w-4 h-4 mr-1" />Bài tập</TabsTrigger>
          <TabsTrigger value="exams"><GraduationCap className="w-4 h-4 mr-1" />Kiểm tra</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="mt-4 space-y-3">
          {lessons.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Chưa có bài học nào</CardContent></Card> :
            lessons.map(l => {
              const st = isAvailable(l.start_at, l.end_at);
              return (
                <Card key={l.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{l.title_vi}</h3>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        {l.start_at && <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />{format(new Date(l.start_at), 'dd/MM HH:mm')}{l.end_at && ` → ${format(new Date(l.end_at), 'HH:mm')}`}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{l.duration_minutes} phút</span>
                      </div>
                    </div>
                    {st === 'upcoming' ? <Badge variant="outline">Sắp tới</Badge> :
                     st === 'ended' ? <Badge variant="outline">Đã kết thúc</Badge> :
                     <Button size="sm" asChild><Link to={`/learn/${l.skill}`}><Play className="w-4 h-4 mr-1" />Vào học</Link></Button>}
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>

        <TabsContent value="assignments" className="mt-4 space-y-3">
          {assignments.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Chưa có bài tập</CardContent></Card> :
            assignments.map(a => {
              const st = isAvailable(a.start_at, a.due_date);
              return (
                <Card key={a.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{a.title}</h3>
                          {st === 'upcoming' && <Badge variant="outline">Sắp mở</Badge>}
                          {st === 'ended' && <Badge className="bg-red-500/10 text-red-600">Quá hạn</Badge>}
                        </div>
                        {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs">
                          {a.start_at && <span className="text-muted-foreground flex items-center gap-1"><CalendarClock className="w-3 h-3" />Mở: {format(new Date(a.start_at), 'dd/MM HH:mm')}</span>}
                          {a.due_date && <span className="text-muted-foreground">Hạn: {format(new Date(a.due_date), 'dd/MM HH:mm')}</span>}
                          {a.file_url && <a href={a.file_url} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1"><ExternalLink className="w-3 h-3" />Tệp</a>}
                          {a.link_url && <a href={a.link_url} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1"><Link2 className="w-3 h-3" />Liên kết</a>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>

        <TabsContent value="exams" className="mt-4 space-y-3">
          {exams.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Chưa có kiểm tra</CardContent></Card> :
            exams.map(e => (
              <Card key={e.id}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{e.title_vi || e.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />{format(new Date(e.exam_date), 'dd/MM/yyyy')} • {e.start_time}{e.end_time && ` → ${e.end_time}`}</span>
                      <span>{e.duration_minutes} phút</span>
                    </div>
                  </div>
                  <Badge variant="outline">{e.exam_type}</Badge>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentClassDetail;

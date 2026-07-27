import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Clock, CalendarClock, Play, Search } from 'lucide-react';
import { formatWithJST } from '@/lib/dateUtils';

const LearnerLessons = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      if (!user) return;
      const nowIso = new Date().toISOString();
      // Lessons học viên có thể thấy: published + (mở cho tất cả hoặc lớp mà mình tham gia)
      const { data: myClassRows } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', user.id);
      const classIds = (myClassRows || []).map((r: any) => r.class_id);

      const q = supabase
        .from('lessons')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(200);
      const { data } = await q;
      const filtered = (data || []).filter((l: any) => {
        if (l.class_id && !classIds.includes(l.class_id)) return false;
        if (l.start_at && l.start_at > nowIso) return false;
        if (l.end_at && l.end_at < nowIso) return false;
        return true;
      });
      setLessons(filtered);
      setLoading(false);
    })();
  }, [user]);

  const filtered = lessons.filter((l) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (l.title_vi || '').toLowerCase().includes(q) || (l.title || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 flex-wrap">
          <BookOpen className="w-7 h-7 text-primary" /> Bài học
        </h1>
        <p className="text-muted-foreground mt-1">
          Tổng hợp toàn bộ bài học bạn có quyền truy cập. Tách biệt rõ với <strong>Bài tập</strong> (luyện tập) và <strong>Bài kiểm tra</strong> (chấm điểm).
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Tìm bài học..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          Chưa có bài học nào dành cho bạn.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <Card key={l.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                {l.thumbnail_url && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img src={l.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {l.skill && <Badge className="bg-primary/10 text-primary">{l.skill}</Badge>}
                  {l.level && <Badge variant="outline">{l.level}</Badge>}
                </div>
                <h3 className="font-semibold line-clamp-2">{l.title_vi || l.title}</h3>
                {l.description_vi && <p className="text-sm text-muted-foreground line-clamp-2">{l.description_vi}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{l.duration_minutes} phút</span>
                  {l.end_at && (
                    <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />Hạn {formatWithJST(l.end_at, false)}</span>
                  )}
                </div>
                <Button asChild size="sm" className="w-full">
                  <Link to={`/learn/lessons/${l.id}`}>
                    <Play className="w-4 h-4 mr-1" /> Vào học
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnerLessons;
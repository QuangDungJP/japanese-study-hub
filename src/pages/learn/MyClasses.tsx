import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, Calendar, ArrowRight, Search, GraduationCap,
  Sparkles, BookOpen, Clock, LayoutGrid,
} from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const accents = [
  'from-japanese/20 via-japanese/5 to-transparent',
  'from-primary/20 via-primary/5 to-transparent',
  'from-accent/25 via-accent/5 to-transparent',
  'from-emerald-500/20 via-emerald-500/5 to-transparent',
  'from-violet-500/20 via-violet-500/5 to-transparent',
  'from-amber-500/20 via-amber-500/5 to-transparent',
];

const MyClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: enrol } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', user.id);
      const ids = (enrol || []).map((e: any) => e.class_id);
      if (!ids.length) { setClasses([]); setLoading(false); return; }
      const { data } = await supabase
        .from('classes')
        .select('*')
        .in('id', ids)
        .eq('approval_status', 'approved');
      setClasses(data || []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) =>
      [c.name_vi, c.name, c.description_vi].some((v) => v?.toLowerCase().includes(q))
    );
  }, [classes, query]);

  const activeCount = classes.filter((c) => {
    if (!c.end_date) return true;
    return new Date(c.end_date) >= new Date();
  }).length;

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-japanese/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-japanese/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-japanese/10 text-japanese text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Hành trình học của bạn
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Lớp học của tôi
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Toàn bộ bài học, bài tập, lịch trình và kết quả của mỗi lớp đều ở đây.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="px-4 py-3 rounded-2xl bg-card/80 backdrop-blur border border-border min-w-[140px]">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <LayoutGrid className="w-3.5 h-3.5" />
                Tổng số lớp
              </div>
              <div className="text-2xl font-bold text-foreground mt-1">{classes.length}</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-card/80 backdrop-blur border border-border min-w-[140px]">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <GraduationCap className="w-3.5 h-3.5" />
                Đang học
              </div>
              <div className="text-2xl font-bold text-japanese mt-1">{activeCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      {classes.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm lớp theo tên..."
            className="pl-9 h-11 rounded-full bg-card border-border"
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Chưa tham gia lớp học nào"
          description="Hãy liên hệ giáo viên để được thêm vào lớp."
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          Không tìm thấy lớp nào khớp với "{query}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c, idx) => {
            const accent = accents[idx % accents.length];
            const ended = c.end_date && new Date(c.end_date) < new Date();
            return (
              <Link key={c.id} to={`/learn/classes/${c.id}`} className="group">
                <Card className="relative overflow-hidden h-full border-border hover:border-japanese/40 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                  <div className={cn('absolute inset-0 bg-gradient-to-br opacity-80', accent)} />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-2xl" />
                  <CardContent className="relative p-6 flex flex-col h-full min-h-[220px]">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-card/90 backdrop-blur border border-border flex items-center justify-center shadow-sm">
                        <BookOpen className="w-5 h-5 text-japanese" />
                      </div>
                      <Badge className={cn(
                        'rounded-full font-medium',
                        ended
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                      )}>
                        {ended ? 'Đã kết thúc' : '● Đang học'}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-lg leading-snug text-foreground group-hover:text-japanese transition-colors line-clamp-2">
                      {c.name_vi || c.name}
                    </h3>

                    {c.description_vi && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {c.description_vi}
                      </p>
                    )}

                    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60">
                      <div className="flex items-center gap-3">
                        {c.start_date && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(c.start_date), 'dd/MM/yyyy')}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {c.max_students}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-japanese font-semibold opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all">
                        Vào lớp
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyClasses;

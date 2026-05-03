import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, ArrowRight } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { format } from 'date-fns';

const MyClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: enrol } = await supabase.from('class_students').select('class_id').eq('student_id', user.id);
      const ids = (enrol || []).map((e: any) => e.class_id);
      if (!ids.length) { setClasses([]); setLoading(false); return; }
      const { data } = await supabase.from('classes').select('*').in('id', ids).eq('approval_status', 'approved');
      setClasses(data || []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="text-center py-12 text-muted-foreground">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lớp học của tôi</h1>
        <p className="text-muted-foreground mt-1">Tất cả bài học, bài tập và kiểm tra theo từng lớp.</p>
      </div>
      {classes.length === 0 ? (
        <EmptyState icon={Users} title="Chưa tham gia lớp học nào" description="Hãy liên hệ giáo viên để được thêm vào lớp." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(c => (
            <Link key={c.id} to={`/learn/classes/${c.id}`} className="group">
              <Card className="hover:shadow-card-hover transition-all hover:-translate-y-1">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-lg">{c.name_vi}</h3>
                    <Badge className="bg-green-500/10 text-green-600">Đang học</Badge>
                  </div>
                  {c.description_vi && <p className="text-sm text-muted-foreground line-clamp-2">{c.description_vi}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {c.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(c.start_date), 'dd/MM/yyyy')}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />Sĩ số tối đa {c.max_students}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Vào lớp <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClasses;

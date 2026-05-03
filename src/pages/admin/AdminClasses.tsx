import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Check, X, Eye, Trash2, Users, UserPlus, Search } from 'lucide-react';
import { format } from 'date-fns';

interface ClassStudent {
  id: string;
  student_id: string;
  enrolled_at: string;
  status: string;
  full_name?: string;
}

interface ClassRow {
  id: string;
  name_vi: string;
  name: string;
  description_vi: string | null;
  teacher_id: string;
  approval_status: string;
  rejection_reason: string | null;
  custom_fields: any;
  max_students: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  is_active: boolean;
  teacher_name?: string;
  student_count?: number;
}

const AdminClasses = () => {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [selected, setSelected] = useState<ClassRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{ user_id: string; full_name: string | null }[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Lỗi tải lớp học', description: error.message, variant: 'destructive' });
      setLoading(false); return;
    }
    const rows = data || [];
    const teacherIds = [...new Set(rows.map(r => r.teacher_id))];
    const { data: profiles } = await supabase
      .from('profiles').select('user_id, full_name').in('user_id', teacherIds);
    const nameMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

    const enriched = await Promise.all(rows.map(async (r) => {
      const { count } = await supabase
        .from('class_students').select('id', { count: 'exact', head: true }).eq('class_id', r.id);
      return { ...r, teacher_name: nameMap.get(r.teacher_id) || '—', student_count: count || 0 };
    }));
    setClasses(enriched as ClassRow[]);
    setLoading(false);
  };

  const approve = async (cls: ClassRow) => {
    const { error } = await supabase
      .from('classes')
      .update({ approval_status: 'approved', approved_at: new Date().toISOString(), rejection_reason: null })
      .eq('id', cls.id);
    if (error) return toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    toast({ title: 'Đã duyệt lớp học' });
    fetchAll();
  };

  const reject = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from('classes')
      .update({ approval_status: 'rejected', rejection_reason: rejectReason })
      .eq('id', selected.id);
    if (error) return toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    toast({ title: 'Đã từ chối lớp học' });
    setRejectOpen(false); setRejectReason(''); setSelected(null);
    fetchAll();
  };

  const remove = async (cls: ClassRow) => {
    if (!confirm(`Xóa lớp "${cls.name_vi}"?`)) return;
    const { error } = await supabase.from('classes').delete().eq('id', cls.id);
    if (error) return toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    toast({ title: 'Đã xóa lớp' });
    fetchAll();
  };

  const openStudents = async (cls: ClassRow) => {
    setSelected(cls);
    setStudentsOpen(true);
    await loadClassStudents(cls.id);
    await loadAvailableUsers(cls.id);
  };

  const loadClassStudents = async (classId: string) => {
    const { data } = await supabase.from('class_students').select('*').eq('class_id', classId).order('enrolled_at', { ascending: false });
    const ids = (data || []).map((s: any) => s.student_id);
    const { data: profs } = ids.length ? await supabase.from('profiles').select('user_id, full_name').in('user_id', ids) : { data: [] as any[] };
    setClassStudents((data || []).map((s: any) => ({ ...s, full_name: profs?.find((p: any) => p.user_id === s.student_id)?.full_name || '—' })));
  };

  const loadAvailableUsers = async (classId: string) => {
    const { data: existing } = await supabase.from('class_students').select('student_id').eq('class_id', classId);
    const exIds = new Set((existing || []).map((e: any) => e.student_id));
    const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'user');
    const ids = (roles || []).map((r: any) => r.user_id).filter((id: string) => !exIds.has(id));
    if (!ids.length) return setAvailableUsers([]);
    const { data: profs } = await supabase.from('profiles').select('user_id, full_name').in('user_id', ids).limit(200);
    setAvailableUsers(profs || []);
  };

  const addStudent = async (uid: string) => {
    if (!selected) return;
    const { error } = await supabase.from('class_students').insert({ class_id: selected.id, student_id: uid, status: 'active' });
    if (error) return toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    toast({ title: 'Đã thêm học viên' });
    await loadClassStudents(selected.id);
    await loadAvailableUsers(selected.id);
    fetchAll();
  };

  const removeStudent = async (sid: string) => {
    if (!selected || !confirm('Xóa học viên khỏi lớp?')) return;
    const { error } = await supabase.from('class_students').delete().eq('class_id', selected.id).eq('student_id', sid);
    if (error) return toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    await loadClassStudents(selected.id);
    await loadAvailableUsers(selected.id);
    fetchAll();
  };

  const filtered = classes.filter(c =>
    tab === 'all' ? true : c.approval_status === tab
  );

  const renderTable = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên lớp</TableHead>
              <TableHead>Giáo viên</TableHead>
              <TableHead>Học viên</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Không có lớp học</TableCell></TableRow>
            ) : filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium">{c.name_vi}</div>
                  <div className="text-xs text-muted-foreground">{c.name}</div>
                </TableCell>
                <TableCell>{c.teacher_name}</TableCell>
                <TableCell><div className="flex items-center gap-1"><Users className="w-3 h-3" />{c.student_count}/{c.max_students}</div></TableCell>
                <TableCell>{format(new Date(c.created_at), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <Badge className={
                    c.approval_status === 'approved' ? 'bg-green-500/10 text-green-600' :
                    c.approval_status === 'rejected' ? 'bg-red-500/10 text-red-600' :
                    'bg-yellow-500/10 text-yellow-700'
                  }>
                    {c.approval_status === 'approved' ? 'Đã duyệt' :
                     c.approval_status === 'rejected' ? 'Bị từ chối' : 'Chờ duyệt'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setSelected(c); setDetailOpen(true); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-blue-600" onClick={() => openStudents(c)}>
                      <Users className="w-4 h-4" />
                    </Button>
                    {c.approval_status !== 'approved' && (
                      <Button variant="ghost" size="icon" className="text-green-600" onClick={() => approve(c)}>
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    {c.approval_status !== 'rejected' && (
                      <Button variant="ghost" size="icon" className="text-orange-600"
                        onClick={() => { setSelected(c); setRejectReason(''); setRejectOpen(true); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(c)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Quản lý lớp học</h1>
        <p className="text-muted-foreground mt-1">Duyệt và quản lý các lớp học do giáo viên tạo</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Chờ duyệt ({classes.filter(c => c.approval_status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
          <TabsTrigger value="rejected">Bị từ chối</TabsTrigger>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {loading ? <div className="text-center py-12 text-muted-foreground">Đang tải...</div> : renderTable()}
        </TabsContent>
      </Tabs>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Từ chối lớp học</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Lý do từ chối</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={reject}>Từ chối</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{selected?.name_vi}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Giáo viên: </span><span className="font-medium">{selected.teacher_name}</span></div>
              <div><span className="text-muted-foreground">Mô tả: </span>{selected.description_vi || '—'}</div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-muted-foreground">Sĩ số: </span>{selected.student_count}/{selected.max_students}</div>
                <div><span className="text-muted-foreground">Bắt đầu: </span>{selected.start_date || '—'}</div>
              </div>
              {selected.rejection_reason && (
                <div className="p-3 bg-red-500/10 rounded text-red-700">
                  <strong>Lý do từ chối:</strong> {selected.rejection_reason}
                </div>
              )}
              {Array.isArray(selected.custom_fields) && selected.custom_fields.length > 0 && (
                <div className="border-t pt-3">
                  <div className="font-medium mb-2">Trường tùy chỉnh</div>
                  <div className="space-y-1">
                    {selected.custom_fields.map((cf: any, i: number) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-muted-foreground min-w-[140px]">{cf.label}:</span>
                        <span>{cf.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClasses;

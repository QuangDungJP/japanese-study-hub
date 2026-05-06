import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Calendar, Clock, MapPin, Video } from 'lucide-react';
import { format } from 'date-fns';

interface Session {
  id: string;
  class_id: string;
  session_date: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  meet_link: string | null;
  topic: string | null;
  notes: string | null;
  status: string;
}

interface Props {
  classId: string;
  className?: string;
  canEdit?: boolean;
}

const empty = (classId: string): Partial<Session> => ({
  class_id: classId,
  session_date: format(new Date(), 'yyyy-MM-dd'),
  start_time: '19:00',
  end_time: '20:30',
  location: '',
  meet_link: '',
  topic: '',
  notes: '',
  status: 'scheduled',
});

export const ClassSessionsManager = ({ classId, className, canEdit = false }: Props) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Session>>(empty(classId));
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState({
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    weekdays: [] as number[],
    start_time: '19:00',
    end_time: '20:30',
    location: '',
    meet_link: '',
    topic: '',
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('class_sessions')
      .select('*')
      .eq('class_id', classId)
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true });
    if (error) toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    setSessions((data || []) as Session[]);
    setLoading(false);
  };

  useEffect(() => { if (classId) load(); }, [classId]);

  const save = async () => {
    if (!editing.session_date || !editing.start_time) {
      return toast({ title: 'Thiếu thông tin', description: 'Cần ngày và giờ bắt đầu', variant: 'destructive' });
    }
    const payload: any = { ...editing, class_id: classId };
    delete payload.id;
    const op = editing.id
      ? (supabase as any).from('class_sessions').update(payload).eq('id', editing.id)
      : (supabase as any).from('class_sessions').insert(payload);
    const { error } = await op;
    if (error) return toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    toast({ title: editing.id ? 'Đã cập nhật buổi học' : 'Đã thêm buổi học' });
    setOpen(false);
    setEditing(empty(classId));
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa buổi học này?')) return;
    const { error } = await (supabase as any).from('class_sessions').delete().eq('id', id);
    if (error) return toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    load();
  };

  const generateBulk = async () => {
    if (!bulk.start_date || !bulk.end_date || bulk.weekdays.length === 0) {
      return toast({ title: 'Thiếu thông tin', description: 'Chọn khoảng ngày và thứ trong tuần', variant: 'destructive' });
    }
    const rows: any[] = [];
    const start = new Date(bulk.start_date);
    const end = new Date(bulk.end_date);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (bulk.weekdays.includes(d.getDay())) {
        rows.push({
          class_id: classId,
          session_date: format(d, 'yyyy-MM-dd'),
          start_time: bulk.start_time,
          end_time: bulk.end_time,
          location: bulk.location || null,
          meet_link: bulk.meet_link || null,
          topic: bulk.topic || null,
          status: 'scheduled',
        });
      }
    }
    if (!rows.length) return toast({ title: 'Không có buổi nào khớp', variant: 'destructive' });
    const { error } = await (supabase as any).from('class_sessions').insert(rows);
    if (error) return toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    toast({ title: `Đã tạo ${rows.length} buổi học` });
    setBulkOpen(false);
    load();
  };

  const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Lịch học {className && <span className="text-muted-foreground">- {className}</span>}</h3>
          <p className="text-xs text-muted-foreground">{sessions.length} buổi đã lên lịch</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
              <Calendar className="w-4 h-4 mr-1" /> Tạo hàng loạt
            </Button>
            <Button size="sm" onClick={() => { setEditing(empty(classId)); setOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Buổi mới
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-6 text-sm text-muted-foreground">Đang tải...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg">Chưa có buổi học nào</div>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto">
          {sessions.map(s => (
            <div key={s.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30">
              <div className="text-center min-w-[56px]">
                <div className="text-xs text-muted-foreground">{format(new Date(s.session_date), 'EEE')}</div>
                <div className="font-bold">{format(new Date(s.session_date), 'dd/MM')}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{s.topic || 'Buổi học'}</div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.start_time?.slice(0,5)}{s.end_time && ` - ${s.end_time.slice(0,5)}`}</span>
                  {s.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.location}</span>}
                  {s.meet_link && (
                    <a href={s.meet_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Video className="w-3 h-3" />Vào lớp
                    </a>
                  )}
                </div>
                {s.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.notes}</p>}
              </div>
              <Badge variant="outline" className="capitalize">{s.status === 'cancelled' ? 'Đã hủy' : s.status === 'completed' ? 'Hoàn thành' : 'Sắp tới'}</Badge>
              {canEdit && (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(s.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Single session edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing.id ? 'Sửa buổi học' : 'Thêm buổi học'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Chủ đề</Label><Input value={editing.topic || ''} onChange={e => setEditing({ ...editing, topic: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Ngày</Label><Input type="date" value={editing.session_date || ''} onChange={e => setEditing({ ...editing, session_date: e.target.value })} /></div>
              <div><Label>Bắt đầu</Label><Input type="time" value={editing.start_time || ''} onChange={e => setEditing({ ...editing, start_time: e.target.value })} /></div>
              <div><Label>Kết thúc</Label><Input type="time" value={editing.end_time || ''} onChange={e => setEditing({ ...editing, end_time: e.target.value })} /></div>
            </div>
            <div><Label>Địa điểm</Label><Input value={editing.location || ''} onChange={e => setEditing({ ...editing, location: e.target.value })} /></div>
            <div><Label>Link Zoom/Meet</Label><Input value={editing.meet_link || ''} onChange={e => setEditing({ ...editing, meet_link: e.target.value })} /></div>
            <div><Label>Trạng thái</Label>
              <select className="w-full h-9 rounded-md border bg-background px-2" value={editing.status || 'scheduled'} onChange={e => setEditing({ ...editing, status: e.target.value })}>
                <option value="scheduled">Sắp tới</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div><Label>Ghi chú</Label><Textarea value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={save}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk create */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tạo lịch học hàng loạt</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Từ ngày</Label><Input type="date" value={bulk.start_date} onChange={e => setBulk({ ...bulk, start_date: e.target.value })} /></div>
              <div><Label>Đến ngày</Label><Input type="date" value={bulk.end_date} onChange={e => setBulk({ ...bulk, end_date: e.target.value })} /></div>
            </div>
            <div>
              <Label>Thứ trong tuần</Label>
              <div className="flex gap-1 mt-1">
                {weekdayLabels.map((lbl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setBulk({ ...bulk, weekdays: bulk.weekdays.includes(i) ? bulk.weekdays.filter(x => x !== i) : [...bulk.weekdays, i] })}
                    className={`flex-1 py-1.5 rounded border text-sm ${bulk.weekdays.includes(i) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}
                  >{lbl}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Giờ bắt đầu</Label><Input type="time" value={bulk.start_time} onChange={e => setBulk({ ...bulk, start_time: e.target.value })} /></div>
              <div><Label>Giờ kết thúc</Label><Input type="time" value={bulk.end_time} onChange={e => setBulk({ ...bulk, end_time: e.target.value })} /></div>
            </div>
            <div><Label>Chủ đề mặc định</Label><Input value={bulk.topic} onChange={e => setBulk({ ...bulk, topic: e.target.value })} /></div>
            <div><Label>Địa điểm</Label><Input value={bulk.location} onChange={e => setBulk({ ...bulk, location: e.target.value })} /></div>
            <div><Label>Link Zoom/Meet</Label><Input value={bulk.meet_link} onChange={e => setBulk({ ...bulk, meet_link: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBulkOpen(false)}>Hủy</Button>
            <Button onClick={generateBulk}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassSessionsManager;
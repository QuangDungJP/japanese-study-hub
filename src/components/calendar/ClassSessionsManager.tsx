import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatWithJST, formatTimeWithJST } from '@/lib/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Calendar, Clock, MapPin, Video, CalendarPlus, CheckSquare, Square, RefreshCw, AlertCircle } from 'lucide-react';
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
  status: string; // 'scheduled' | 'completed' | 'cancelled' | 'makeup'
}

interface Props {
  classId: string;
  className?: string;
  canEdit?: boolean;
}

const emptySession = (classId: string): Partial<Session> => ({
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
  
  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Dialog states
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Session>>(emptySession(classId));
  
  // Bulk create dialog state
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

  // Bulk edit existing sessions dialog state
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    updateTime: false,
    start_time: '19:00',
    end_time: '20:30',
    updateLocation: false,
    location: '',
    updateMeetLink: false,
    meet_link: '',
    updateStatus: false,
    status: 'scheduled',
  });

  // Makeup session creation dialog state
  const [makeupOpen, setMakeupOpen] = useState(false);
  const [makeupData, setMakeupData] = useState({
    session_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '19:00',
    end_time: '20:30',
    topic: 'Buổi học bù',
    notes: '',
    location: '',
    meet_link: '',
    replaced_session_id: '',
  });

  // Cascade shift (push down) dialog state
  const [shiftOpen, setShiftOpen] = useState(false);
  const [shiftData, setShiftData] = useState({
    fromSessionId: '',
    shiftDays: 7, // Default 1 week push down
  });

  // Cascade shift remaining sessions forward
  const handleCascadeShift = async () => {
    if (!shiftData.fromSessionId) {
      return toast({ title: 'Thiếu thông tin', description: 'Vui lòng chọn buổi học bắt đầu dời lịch', variant: 'destructive' });
    }
    const targetSession = sessions.find(s => s.id === shiftData.fromSessionId);
    if (!targetSession) return;

    const affectedSessions = sessions.filter(
      s => s.session_date >= targetSession.session_date && s.status !== 'completed'
    );

    if (affectedSessions.length === 0) {
      return toast({ title: 'Thông báo', description: 'Không có buổi học nào bị ảnh hưởng', variant: 'destructive' });
    }

    const days = Number(shiftData.shiftDays) || 7;

    const updates = affectedSessions.map(s => {
      const parts = s.session_date.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + days);
      const newDateStr = format(d, 'yyyy-MM-dd');
      return (supabase as any)
        .from('class_sessions')
        .update({ session_date: newDateStr })
        .eq('id', s.id);
    });

    const results = await Promise.all(updates);
    const hasError = results.some((r: any) => r.error);

    if (hasError) {
      return toast({ title: 'Lỗi', description: 'Một số buổi học chưa được dời lịch', variant: 'destructive' });
    }

    toast({ 
      title: 'Đẩy lịch tịnh tiến thành công!', 
      description: `Đã lùi ${affectedSessions.length} buổi học còn lại thêm ${days} ngày.` 
    });
    setShiftOpen(false);
    load();
  };

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

  useEffect(() => {
    if (classId) load();
  }, [classId]);

  // Handle single session select toggle
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedIds.length === sessions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sessions.map(s => s.id));
    }
  };

  // Single session save
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
    setEditing(emptySession(classId));
    load();
  };

  // Single session remove
  const remove = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa buổi học này?')) return;
    const { error } = await (supabase as any).from('class_sessions').delete().eq('id', id);
    if (error) return toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    toast({ title: 'Đã xóa buổi học' });
    setSelectedIds(prev => prev.filter(i => i !== id));
    load();
  };

  // Bulk remove selected sessions
  const removeSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} buổi học đã chọn?`)) return;
    
    const { error } = await (supabase as any)
      .from('class_sessions')
      .delete()
      .in('id', selectedIds);
      
    if (error) return toast({ title: 'Lỗi khi xóa hàng loạt', description: error.message, variant: 'destructive' });
    toast({ title: `Đã xóa thành công ${selectedIds.length} buổi học` });
    setSelectedIds([]);
    load();
  };

  // Bulk edit existing sessions submit
  const saveBulkEdit = async () => {
    if (selectedIds.length === 0) return;
    
    const updates: any = {};
    if (bulkEditData.updateTime) {
      updates.start_time = bulkEditData.start_time;
      updates.end_time = bulkEditData.end_time;
    }
    if (bulkEditData.updateLocation) {
      updates.location = bulkEditData.location;
    }
    if (bulkEditData.updateMeetLink) {
      updates.meet_link = bulkEditData.meet_link;
    }
    if (bulkEditData.updateStatus) {
      updates.status = bulkEditData.status;
    }

    if (Object.keys(updates).length === 0) {
      return toast({ title: 'Chưa chọn trường cần sửa', description: 'Vui lòng đánh dấu chọn ít nhất một thông tin cần thay đổi', variant: 'destructive' });
    }

    const { error } = await (supabase as any)
      .from('class_sessions')
      .update(updates)
      .in('id', selectedIds);

    if (error) return toast({ title: 'Lỗi cập nhật hàng loạt', description: error.message, variant: 'destructive' });
    
    toast({ title: `Đã cập nhật ${selectedIds.length} buổi học` });
    setBulkEditOpen(false);
    setSelectedIds([]);
    load();
  };

  // Generate bulk new sessions
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
    toast({ title: `Đã tạo ${rows.length} buổi học mới` });
    setBulkOpen(false);
    load();
  };

  // Create Make-up session
  const saveMakeupSession = async () => {
    if (!makeupData.session_date || !makeupData.start_time) {
      return toast({ title: 'Thiếu thông tin', description: 'Vui lòng nhập ngày và giờ học bù', variant: 'destructive' });
    }

    let notesText = makeupData.notes || '';
    if (makeupData.replaced_session_id) {
      const repSession = sessions.find(s => s.id === makeupData.replaced_session_id);
      if (repSession) {
        notesText = `[Học bù cho buổi ngày ${formatWithJST(repSession.session_date, false)}${repSession.topic ? `: ${repSession.topic}` : ''}] ${notesText}`.trim();
      }
    }

    const payload = {
      class_id: classId,
      session_date: makeupData.session_date,
      start_time: makeupData.start_time,
      end_time: makeupData.end_time || null,
      topic: makeupData.topic || 'Buổi học bù',
      location: makeupData.location || null,
      meet_link: makeupData.meet_link || null,
      notes: notesText || null,
      status: 'makeup',
    };

    const { error } = await (supabase as any).from('class_sessions').insert(payload);
    if (error) return toast({ title: 'Lỗi tạo buổi học bù', description: error.message, variant: 'destructive' });
    
    toast({ title: 'Đã tạo buổi học bù thành công!' });
    setMakeupOpen(false);
    load();
  };

  const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Helper render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'makeup':
        return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-400/40 font-bold">Học bù</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40">Hoàn thành</Badge>;
      case 'scheduled':
      default:
        return <Badge variant="outline">Sắp tới</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            Lịch học {className && <span className="text-muted-foreground text-sm font-normal">- {className}</span>}
          </h3>
          <p className="text-xs text-muted-foreground">{sessions.length} buổi đã lên lịch</p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950" onClick={() => setShiftOpen(true)}>
              <RefreshCw className="w-4 h-4 mr-1" /> Đẩy lùi lịch tịnh tiến
            </Button>
            <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-950" onClick={() => setMakeupOpen(true)}>
              <CalendarPlus className="w-4 h-4 mr-1" /> + Tạo buổi học bù
            </Button>
            <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
              <Calendar className="w-4 h-4 mr-1" /> Tạo hàng loạt
            </Button>
            <Button size="sm" onClick={() => { setEditing(emptySession(classId)); setOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Buổi mới
            </Button>
          </div>
        )}
      </div>

      {/* Bulk action toolbar when items are selected */}
      {canEdit && sessions.length > 0 && (
        <div className="flex items-center justify-between p-2.5 bg-muted/50 border rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 text-xs px-2"
              onClick={toggleSelectAll}
            >
              {selectedIds.length === sessions.length ? (
                <CheckSquare className="w-3.5 h-3.5 mr-1 text-primary" />
              ) : (
                <Square className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              )}
              {selectedIds.length === sessions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
            {selectedIds.length > 0 && (
              <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Đã chọn {selectedIds.length} buổi
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="default"
                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white" 
                onClick={() => setBulkEditOpen(true)}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Sửa hàng loạt ({selectedIds.length})
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                className="h-7 text-xs" 
                onClick={removeSelected}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa ({selectedIds.length})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Sessions list */}
      {loading ? (
        <div className="text-center py-6 text-sm text-muted-foreground">Đang tải lịch học...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg">Chưa có buổi học nào được lên lịch</div>
      ) : (
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {sessions.map(s => {
            const isSelected = selectedIds.includes(s.id);
            return (
              <div 
                key={s.id} 
                className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                  isSelected ? 'bg-primary/5 border-primary/40' : 'hover:bg-muted/30'
                }`}
              >
                {canEdit && (
                  <div className="pt-1">
                    <Checkbox 
                      checked={isSelected} 
                      onCheckedChange={() => toggleSelect(s.id)}
                    />
                  </div>
                )}
                <div className="text-center min-w-[56px] bg-muted/40 p-1.5 rounded">
                  <div className="text-xs text-muted-foreground">{format(new Date(s.session_date), 'EEE')}</div>
                  <div className="font-bold text-sm">{formatWithJST(s.session_date, false)}</div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    <span>{s.topic || 'Buổi học'}</span>
                    {s.status === 'makeup' && (
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded">
                        HỌC BÙ
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {formatTimeWithJST(s.start_time)}
                      {s.end_time && ` - ${s.end_time.slice(0,5)}`}
                    </span>
                    {s.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {s.location}
                      </span>
                    )}
                    {s.meet_link && (
                      <a href={s.meet_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary font-medium hover:underline">
                        <Video className="w-3.5 h-3.5" /> Vào lớp Zoom/Meet
                      </a>
                    )}
                  </div>
                  {s.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">{s.notes}</p>}
                </div>

                <div className="flex items-center gap-2">
                  {renderStatusBadge(s.status)}
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:text-amber-700" title="Đẩy lùi buổi này và các buổi sau" onClick={() => { setShiftData({ fromSessionId: s.id, shiftDays: 7 }); setShiftOpen(true); }}>
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(s); setOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(s.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Single session edit modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Sửa thông tin buổi học' : 'Thêm buổi học mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Chủ đề / Bài học</Label>
              <Input value={editing.topic || ''} onChange={e => setEditing({ ...editing, topic: e.target.value })} placeholder="Ví dụ: Bài 1 - Chào hỏi & Giới thiệu bản thân" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Ngày học</Label>
                <Input type="date" value={editing.session_date || ''} onChange={e => setEditing({ ...editing, session_date: e.target.value })} />
              </div>
              <div>
                <Label>Giờ bắt đầu</Label>
                <Input type="time" value={editing.start_time || ''} onChange={e => setEditing({ ...editing, start_time: e.target.value })} />
              </div>
              <div>
                <Label>Giờ kết thúc</Label>
                <Input type="time" value={editing.end_time || ''} onChange={e => setEditing({ ...editing, end_time: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Địa điểm / Phòng học</Label>
              <Input value={editing.location || ''} onChange={e => setEditing({ ...editing, location: e.target.value })} placeholder="Phòng A1 / Online" />
            </div>
            <div>
              <Label>Link Meeting (Zoom / Google Meet)</Label>
              <Input value={editing.meet_link || ''} onChange={e => setEditing({ ...editing, meet_link: e.target.value })} placeholder="https://zoom.us/j/..." />
            </div>
            <div>
              <Label>Trạng thái</Label>
              <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={editing.status || 'scheduled'} onChange={e => setEditing({ ...editing, status: e.target.value })}>
                <option value="scheduled">Sắp tới</option>
                <option value="makeup">Học bù</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div>
              <Label>Ghi chú</Label>
              <Textarea value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} rows={2} placeholder="Ghi chú thêm cho học viên..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={save}>Lưu buổi học</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk create modal */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo lịch học hàng loạt</DialogTitle>
            <DialogDescription>Tự động tạo lịch học lặp lại theo thứ trong tuần cho lớp.</DialogDescription>
          </DialogHeader>
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
                    className={`flex-1 py-1.5 rounded border text-sm font-medium transition-colors ${bulk.weekdays.includes(i) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                  >{lbl}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Giờ bắt đầu</Label><Input type="time" value={bulk.start_time} onChange={e => setBulk({ ...bulk, start_time: e.target.value })} /></div>
              <div><Label>Giờ kết thúc</Label><Input type="time" value={bulk.end_time} onChange={e => setBulk({ ...bulk, end_time: e.target.value })} /></div>
            </div>
            <div><Label>Chủ đề mặc định</Label><Input value={bulk.topic} onChange={e => setBulk({ ...bulk, topic: e.target.value })} placeholder="Buổi học" /></div>
            <div><Label>Địa điểm</Label><Input value={bulk.location} onChange={e => setBulk({ ...bulk, location: e.target.value })} /></div>
            <div><Label>Link Meeting</Label><Input value={bulk.meet_link} onChange={e => setBulk({ ...bulk, meet_link: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBulkOpen(false)}>Hủy</Button>
            <Button onClick={generateBulk}>Tạo danh sách buổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk edit existing sessions modal */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <RefreshCw className="w-5 h-5" /> Sửa hàng loạt cho {selectedIds.length} buổi học đã chọn
            </DialogTitle>
            <DialogDescription>
              Đánh dấu chọn thông tin bạn muốn thay đổi. Chỉ những trường được tích chọn mới được cập nhật.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Update time */}
            <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 font-medium text-sm">
                <Checkbox 
                  id="upTime" 
                  checked={bulkEditData.updateTime} 
                  onCheckedChange={c => setBulkEditData({ ...bulkEditData, updateTime: !!c })} 
                />
                <label htmlFor="upTime" className="cursor-pointer">Thay đổi Giờ học</label>
              </div>
              {bulkEditData.updateTime && (
                <div className="grid grid-cols-2 gap-2 pl-6 pt-1">
                  <div>
                    <Label className="text-xs">Giờ bắt đầu mới</Label>
                    <Input type="time" value={bulkEditData.start_time} onChange={e => setBulkEditData({ ...bulkEditData, start_time: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Giờ kết thúc mới</Label>
                    <Input type="time" value={bulkEditData.end_time} onChange={e => setBulkEditData({ ...bulkEditData, end_time: e.target.value })} />
                  </div>
                </div>
              )}
            </div>

            {/* Update location */}
            <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 font-medium text-sm">
                <Checkbox 
                  id="upLoc" 
                  checked={bulkEditData.updateLocation} 
                  onCheckedChange={c => setBulkEditData({ ...bulkEditData, updateLocation: !!c })} 
                />
                <label htmlFor="upLoc" className="cursor-pointer">Thay đổi Địa điểm / Phòng học</label>
              </div>
              {bulkEditData.updateLocation && (
                <div className="pl-6 pt-1">
                  <Input value={bulkEditData.location} onChange={e => setBulkEditData({ ...bulkEditData, location: e.target.value })} placeholder="Nhập địa điểm mới..." />
                </div>
              )}
            </div>

            {/* Update meeting link */}
            <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 font-medium text-sm">
                <Checkbox 
                  id="upMeet" 
                  checked={bulkEditData.updateMeetLink} 
                  onCheckedChange={c => setBulkEditData({ ...bulkEditData, updateMeetLink: !!c })} 
                />
                <label htmlFor="upMeet" className="cursor-pointer">Thay đổi Link Meeting (Zoom/Google Meet)</label>
              </div>
              {bulkEditData.updateMeetLink && (
                <div className="pl-6 pt-1">
                  <Input value={bulkEditData.meet_link} onChange={e => setBulkEditData({ ...bulkEditData, meet_link: e.target.value })} placeholder="https://zoom.us/j/..." />
                </div>
              )}
            </div>

            {/* Update status */}
            <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 font-medium text-sm">
                <Checkbox 
                  id="upStatus" 
                  checked={bulkEditData.updateStatus} 
                  onCheckedChange={c => setBulkEditData({ ...bulkEditData, updateStatus: !!c })} 
                />
                <label htmlFor="upStatus" className="cursor-pointer">Thay đổi Trạng thái hàng loạt</label>
              </div>
              {bulkEditData.updateStatus && (
                <div className="pl-6 pt-1">
                  <select 
                    className="w-full h-9 rounded-md border bg-background px-2 text-sm" 
                    value={bulkEditData.status} 
                    onChange={e => setBulkEditData({ ...bulkEditData, status: e.target.value })}
                  >
                    <option value="scheduled">Sắp tới</option>
                    <option value="makeup">Học bù</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setBulkEditOpen(false)}>Hủy</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={saveBulkEdit}>
              Cập nhật {selectedIds.length} buổi học
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dedicated Make-up Session Creation Modal */}
      <Dialog open={makeupOpen} onOpenChange={setMakeupOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <CalendarPlus className="w-5 h-5 text-purple-600" /> Tạo buổi học bù mới
            </DialogTitle>
            <DialogDescription>
              Tạo buổi học bù cho lớp. Buổi học bù sẽ được gắn nhãn "Học bù" nổi bật cho học viên theo dõi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Tên / Chủ đề buổi học bù</Label>
              <Input 
                value={makeupData.topic} 
                onChange={e => setMakeupData({ ...makeupData, topic: e.target.value })} 
                placeholder="Ví dụ: Buổi học bù - Ôn tập Bài 5" 
              />
            </div>

            {/* Optional linkage to cancelled session */}
            {sessions.filter(s => s.status === 'cancelled' || new Date(s.session_date) < new Date()).length > 0 && (
              <div className="p-2.5 rounded-lg border bg-purple-50/50 dark:bg-purple-950/20 text-xs space-y-1">
                <Label className="text-xs font-semibold flex items-center gap-1 text-purple-800 dark:text-purple-300">
                  <AlertCircle className="w-3.5 h-3.5" /> Học bù cho buổi học nào? (Tùy chọn)
                </Label>
                <select 
                  className="w-full h-8 rounded border bg-background px-2 text-xs"
                  value={makeupData.replaced_session_id}
                  onChange={e => setMakeupData({ ...makeupData, replaced_session_id: e.target.value })}
                >
                  <option value="">-- Không chọn (Tạo buổi bù độc lập) --</option>
                  {sessions
                    .filter(s => s.status === 'cancelled' || new Date(s.session_date) < new Date())
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.session_date} ({s.start_time}) - {s.topic || 'Buổi học'} {s.status === 'cancelled' ? '[Đã hủy]' : ''}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Ngày học bù</Label>
                <Input 
                  type="date" 
                  value={makeupData.session_date} 
                  onChange={e => setMakeupData({ ...makeupData, session_date: e.target.value })} 
                />
              </div>
              <div>
                <Label>Giờ bắt đầu</Label>
                <Input 
                  type="time" 
                  value={makeupData.start_time} 
                  onChange={e => setMakeupData({ ...makeupData, start_time: e.target.value })} 
                />
              </div>
              <div>
                <Label>Giờ kết thúc</Label>
                <Input 
                  type="time" 
                  value={makeupData.end_time} 
                  onChange={e => setMakeupData({ ...makeupData, end_time: e.target.value })} 
                />
              </div>
            </div>

            <div>
              <Label>Địa điểm / Phòng học</Label>
              <Input 
                value={makeupData.location} 
                onChange={e => setMakeupData({ ...makeupData, location: e.target.value })} 
                placeholder="Ví dụ: Phòng A1 / Online" 
              />
            </div>

            <div>
              <Label>Link Meeting (Zoom / Google Meet)</Label>
              <Input 
                value={makeupData.meet_link} 
                onChange={e => setMakeupData({ ...makeupData, meet_link: e.target.value })} 
                placeholder="https://zoom.us/j/..." 
              />
            </div>

            <div>
              <Label>Ghi chú lý do học bù</Label>
              <Textarea 
                value={makeupData.notes} 
                onChange={e => setMakeupData({ ...makeupData, notes: e.target.value })} 
                rows={2} 
                placeholder="Nhập lý do học bù hoặc ghi chú cho học viên..." 
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setMakeupOpen(false)}>Hủy</Button>
            <Button className="bg-purple-700 hover:bg-purple-800 text-white" onClick={saveMakeupSession}>
              Xác nhận Tạo buổi học bù
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cascade Shift (Push Down) Dialog */}
      <Dialog open={shiftOpen} onOpenChange={setShiftOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <RefreshCw className="w-5 h-5 text-amber-600" /> Tự động đẩy lùi lịch tịnh tiến (Cascade Shift)
            </DialogTitle>
            <DialogDescription>
              Khi hoãn hoặc dời 1 buổi học, hệ thống sẽ tự động đẩy lùi tất cả các buổi học tiếp theo lùi lại để luôn bảo đảm 100% tổng số buổi học đã quy định.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Chọn buổi bắt đầu bị dời lịch</Label>
              <select
                className="w-full h-9 rounded-md border bg-background px-2 text-sm mt-1"
                value={shiftData.fromSessionId}
                onChange={e => setShiftData({ ...shiftData, fromSessionId: e.target.value })}
              >
                <option value="">-- Chọn buổi học bị dời --</option>
                {sessions
                  .filter(s => s.status !== 'completed')
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.session_date} ({s.start_time}) - {s.topic || 'Buổi học'}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <Label>Số ngày lùi lại (Ví dụ: 7 ngày = lùi 1 tuần)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={shiftData.shiftDays}
                  onChange={e => setShiftData({ ...shiftData, shiftDays: parseInt(e.target.value) || 7 })}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShiftData({ ...shiftData, shiftDays: 7 })}
                >
                  Lùi 1 tuần (+7 ngày)
                </Button>
              </div>
            </div>

            {shiftData.fromSessionId && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Số buổi bị ảnh hưởng:
                </p>
                <p className="text-muted-foreground">
                  Có {sessions.filter(s => s.session_date >= (sessions.find(x => x.id === shiftData.fromSessionId)?.session_date || '') && s.status !== 'completed').length} buổi học từ ngày này trở đi sẽ được dời lùi thêm +{shiftData.shiftDays} ngày. Tổng số buổi của khóa học được giữ nguyên đầy đủ.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShiftOpen(false)}>Hủy</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCascadeShift}>
              Xác nhận Đẩy lùi lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassSessionsManager;
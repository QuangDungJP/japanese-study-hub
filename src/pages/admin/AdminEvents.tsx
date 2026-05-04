import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import MediaUploader from '@/components/shared/MediaUploader';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  CalendarDays, Plus, Edit, Trash2, Eye, EyeOff, Users, Loader2, Save,
  MapPin, Clock, Image as ImageIcon, FileText, GripVertical, X, CheckCircle,
  ListOrdered, Mic2, Sparkles, HelpCircle, Award, ArrowUp, ArrowDown, Layers,
} from 'lucide-react';

interface AgendaItem { time: string; title: string; description?: string; }
interface Speaker { name: string; title?: string; avatar_url?: string; bio?: string; }
interface Highlight { icon?: string; title: string; description?: string; }
interface FaqItem { question: string; answer: string; }
interface Sponsor { name: string; logo_url?: string; url?: string; }

interface SectionVisibility {
  hero: boolean; info: boolean; video: boolean; gallery: boolean; content: boolean;
  highlights: boolean; agenda: boolean; speakers: boolean; sponsors: boolean; faq: boolean; register: boolean;
}

const DEFAULT_VIS: SectionVisibility = {
  hero: true, info: true, video: true, gallery: true, content: true,
  highlights: true, agenda: true, speakers: true, sponsors: true, faq: true, register: true,
};

interface EventRow {
  id: string;
  title: string; title_vi: string;
  description: string | null; description_vi: string | null;
  thumbnail_url: string | null; video_url: string | null;
  gallery_urls: string[];
  event_date: string; start_time: string; end_time: string | null;
  location: string | null; location_vi: string | null;
  is_online: boolean; meet_link: string | null;
  max_participants: number | null;
  is_published: boolean; layout_style: string;
  content_html: string | null; content_html_vi: string | null;
  order_index: number;
  agenda: AgendaItem[]; speakers: Speaker[]; highlights: Highlight[]; faq: FaqItem[]; sponsors: Sponsor[];
  price: number | null; price_note: string | null; register_button_label: string | null;
  section_visibility: SectionVisibility;
  created_at: string;
}

interface FormField {
  id?: string; event_id?: string;
  label: string; label_vi: string; field_type: string;
  placeholder: string; placeholder_vi: string;
  is_required: boolean; options: string[]; order_index: number; is_active: boolean;
}

interface Registration {
  id: string; event_id: string; user_id: string | null;
  data: Record<string, any>; status: string; notes: string | null; created_at: string;
}

const defaultEvent: Partial<EventRow> = {
  title: '', title_vi: '', description: '', description_vi: '',
  thumbnail_url: '', video_url: '', gallery_urls: [],
  event_date: new Date().toISOString().split('T')[0],
  start_time: '09:00', end_time: '17:00',
  location: '', location_vi: '', is_online: false, meet_link: '',
  max_participants: null, is_published: false, layout_style: 'standard',
  content_html: '', content_html_vi: '',
  order_index: 0, agenda: [], speakers: [], highlights: [], faq: [], sponsors: [],
  price: null, price_note: '', register_button_label: '',
  section_visibility: { ...DEFAULT_VIS },
};

const defaultField: FormField = {
  label: '', label_vi: '', field_type: 'text', placeholder: '', placeholder_vi: '',
  is_required: false, options: [], order_index: 0, is_active: true,
};

const AdminEvents = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editEvent, setEditEvent] = useState<Partial<EventRow>>(defaultEvent);
  const [editTab, setEditTab] = useState('basic');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [regDialog, setRegDialog] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events').select('*')
      .order('order_index', { ascending: true })
      .order('event_date', { ascending: false });
    const rows = (data as any[] || []).map(e => ({
      ...e,
      gallery_urls: Array.isArray(e.gallery_urls) ? e.gallery_urls : [],
      agenda: Array.isArray(e.agenda) ? e.agenda : [],
      speakers: Array.isArray(e.speakers) ? e.speakers : [],
      highlights: Array.isArray(e.highlights) ? e.highlights : [],
      faq: Array.isArray(e.faq) ? e.faq : [],
      sponsors: Array.isArray(e.sponsors) ? e.sponsors : [],
      section_visibility: { ...DEFAULT_VIS, ...(e.section_visibility || {}) },
    }));
    setEvents(rows);
    setLoading(false);
  };

  const openCreate = () => {
    setEditEvent({ ...defaultEvent, order_index: events.length });
    setFormFields([
      { ...defaultField, label: 'Full Name', label_vi: 'Họ và tên', is_required: true, order_index: 0 },
      { ...defaultField, label: 'Email', label_vi: 'Email', field_type: 'email', is_required: true, order_index: 1 },
      { ...defaultField, label: 'Phone', label_vi: 'Số điện thoại', field_type: 'tel', order_index: 2 },
    ]);
    setEditTab('basic');
    setEditDialog(true);
  };

  const openEdit = async (event: EventRow) => {
    setEditEvent(event);
    setEditTab('basic');
    const { data: fields } = await supabase.from('event_form_fields').select('*').eq('event_id', event.id).order('order_index');
    setFormFields((fields as any[])?.map(f => ({ ...f, options: Array.isArray(f.options) ? f.options : [] })) || []);
    setEditDialog(true);
  };

  const openRegistrations = async (eventId: string) => {
    setSelectedEventId(eventId);
    const { data } = await supabase.from('event_registrations').select('*').eq('event_id', eventId).order('created_at', { ascending: false });
    setRegistrations((data as any[]) || []);
    setRegDialog(true);
  };

  const handleSave = async () => {
    if (!editEvent.title_vi || !editEvent.event_date || !editEvent.start_time) {
      toast({ title: 'Lỗi', description: 'Vui lòng điền đầy đủ thông tin bắt buộc', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        title: editEvent.title || editEvent.title_vi,
        title_vi: editEvent.title_vi,
        description: editEvent.description, description_vi: editEvent.description_vi,
        thumbnail_url: editEvent.thumbnail_url || null, video_url: editEvent.video_url || null,
        gallery_urls: editEvent.gallery_urls || [],
        event_date: editEvent.event_date, start_time: editEvent.start_time,
        end_time: editEvent.end_time || null,
        location: editEvent.location || null, location_vi: editEvent.location_vi || null,
        is_online: editEvent.is_online || false, meet_link: editEvent.meet_link || null,
        max_participants: editEvent.max_participants || null,
        is_published: editEvent.is_published || false, layout_style: editEvent.layout_style || 'standard',
        content_html: editEvent.content_html || null, content_html_vi: editEvent.content_html_vi || null,
        order_index: editEvent.order_index ?? 0,
        agenda: editEvent.agenda || [], speakers: editEvent.speakers || [],
        highlights: editEvent.highlights || [], faq: editEvent.faq || [], sponsors: editEvent.sponsors || [],
        price: editEvent.price ?? null, price_note: editEvent.price_note || null,
        register_button_label: editEvent.register_button_label || null,
        section_visibility: editEvent.section_visibility || DEFAULT_VIS,
      };

      let eventId = editEvent.id;
      if (editEvent.id) {
        const { error } = await supabase.from('events').update(payload).eq('id', editEvent.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('events').insert(payload).select().single();
        if (error) throw error;
        eventId = (data as any).id;
      }

      if (eventId) {
        await supabase.from('event_form_fields').delete().eq('event_id', eventId);
        if (formFields.length > 0) {
          const fieldsPayload = formFields.map((f, i) => ({
            event_id: eventId, label: f.label || f.label_vi, label_vi: f.label_vi,
            field_type: f.field_type, placeholder: f.placeholder || null, placeholder_vi: f.placeholder_vi || null,
            is_required: f.is_required, options: f.options || [], order_index: i, is_active: f.is_active,
          }));
          await supabase.from('event_form_fields').insert(fieldsPayload as any);
        }
      }
      toast({ title: 'Thành công', description: editEvent.id ? 'Đã cập nhật sự kiện' : 'Đã tạo sự kiện mới' });
      setEditDialog(false);
      fetchEvents();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const togglePublish = async (id: string, published: boolean) => {
    await supabase.from('events').update({ is_published: !published } as any).eq('id', id);
    fetchEvents();
    toast({ title: published ? 'Đã ẩn sự kiện' : 'Đã xuất bản sự kiện' });
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Xóa sự kiện này?')) return;
    await supabase.from('events').delete().eq('id', id);
    fetchEvents();
    toast({ title: 'Đã xóa sự kiện' });
  };

  // Reorder
  const persistOrder = async (rows: EventRow[]) => {
    await Promise.all(rows.map((r, i) =>
      supabase.from('events').update({ order_index: i } as any).eq('id', r.id)
    ));
  };

  const moveEvent = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= events.length) return;
    const next = [...events];
    [next[idx], next[target]] = [next[target], next[idx]];
    setEvents(next);
    await persistOrder(next);
  };

  const onDrop = async (toIdx: number) => {
    if (dragIndex === null || dragIndex === toIdx) { setDragIndex(null); return; }
    const next = [...events];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(toIdx, 0, moved);
    setEvents(next); setDragIndex(null);
    await persistOrder(next);
    toast({ title: 'Đã cập nhật thứ tự' });
  };

  // Field helpers
  const addField = () => setFormFields([...formFields, { ...defaultField, order_index: formFields.length }]);
  const updateField = (i: number, u: Partial<FormField>) => setFormFields(formFields.map((f, idx) => idx === i ? { ...f, ...u } : f));
  const removeField = (i: number) => setFormFields(formFields.filter((_, idx) => idx !== i));

  // Generic array helpers
  const updateArr = <T,>(key: keyof EventRow, items: T[]) => setEditEvent({ ...editEvent, [key]: items as any });

  const updateRegStatus = async (regId: string, status: string) => {
    await supabase.from('event_registrations').update({ status } as any).eq('id', regId);
    if (selectedEventId) {
      const { data } = await supabase.from('event_registrations').select('*').eq('event_id', selectedEventId).order('created_at', { ascending: false });
      setRegistrations((data as any[]) || []);
    }
    toast({ title: 'Đã cập nhật trạng thái' });
  };

  const vis = (editEvent.section_visibility || DEFAULT_VIS) as SectionVisibility;
  const setVis = (k: keyof SectionVisibility, v: boolean) =>
    setEditEvent({ ...editEvent, section_visibility: { ...vis, [k]: v } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý sự kiện</h1>
          <p className="text-muted-foreground">Tạo, sắp xếp và quản lý sự kiện, workshop, hội thảo</p>
        </div>
        <Button onClick={openCreate} variant="hero">
          <Plus className="w-4 h-4 mr-2" />Tạo sự kiện
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10"><CalendarDays className="w-6 h-6 text-primary" /></div>
          <div><p className="text-sm text-muted-foreground">Tổng sự kiện</p><p className="text-2xl font-bold">{events.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/10"><Eye className="w-6 h-6 text-green-600" /></div>
          <div><p className="text-sm text-muted-foreground">Đang hiển thị</p><p className="text-2xl font-bold">{events.filter(e => e.is_published).length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10"><Users className="w-6 h-6 text-blue-600" /></div>
          <div><p className="text-sm text-muted-foreground">Sắp diễn ra</p><p className="text-2xl font-bold">{events.filter(e => new Date(e.event_date) >= new Date()).length}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5" /> Danh sách sự kiện (kéo-thả để sắp xếp)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có sự kiện nào</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {events.map((event, idx) => (
                <div
                  key={event.id}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => onDrop(idx)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    dragIndex === idx ? 'opacity-50 border-primary' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">{idx + 1}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveEvent(idx, -1)} disabled={idx === 0}>
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveEvent(idx, 1)} disabled={idx === events.length - 1}>
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                  {event.thumbnail_url ? (
                    <img src={event.thumbnail_url} alt={event.title_vi} className="w-24 h-16 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-24 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-foreground truncate">{event.title_vi}</h3>
                      {event.is_published ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">Hiển thị</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Nháp</Badge>
                      )}
                      {event.is_online && <Badge variant="secondary" className="text-xs">Online</Badge>}
                      {event.layout_style && event.layout_style !== 'standard' && (
                        <Badge variant="outline" className="text-xs">{event.layout_style}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(event.event_date), 'dd/MM/yyyy', { locale: vi })} • {event.start_time?.slice(0,5)}</span>
                      {event.location_vi && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location_vi}</span>}
                      {event.max_participants && <span className="flex items-center gap-1"><Users className="w-3 h-3" />Tối đa {event.max_participants}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openRegistrations(event.id)} title="Xem đăng ký">
                      <Users className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => togglePublish(event.id, event.is_published)}>
                      {event.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(event)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteEvent(event.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editEvent.id ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}</DialogTitle>
          </DialogHeader>

          <Tabs value={editTab} onValueChange={setEditTab}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="basic"><FileText className="w-4 h-4 mr-1" />Thông tin</TabsTrigger>
              <TabsTrigger value="media"><ImageIcon className="w-4 h-4 mr-1" />Media</TabsTrigger>
              <TabsTrigger value="content"><Edit className="w-4 h-4 mr-1" />Nội dung</TabsTrigger>
              <TabsTrigger value="highlights"><Sparkles className="w-4 h-4 mr-1" />Nổi bật</TabsTrigger>
              <TabsTrigger value="agenda"><ListOrdered className="w-4 h-4 mr-1" />Lịch trình</TabsTrigger>
              <TabsTrigger value="speakers"><Mic2 className="w-4 h-4 mr-1" />Diễn giả</TabsTrigger>
              <TabsTrigger value="extras"><Award className="w-4 h-4 mr-1" />Khác</TabsTrigger>
              <TabsTrigger value="form"><Users className="w-4 h-4 mr-1" />Form</TabsTrigger>
            </TabsList>

            {/* BASIC */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tên sự kiện (Tiếng Việt) *</label>
                  <Input value={editEvent.title_vi || ''} onChange={e => setEditEvent({ ...editEvent, title_vi: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Tên sự kiện (English)</label>
                  <Input value={editEvent.title || ''} onChange={e => setEditEvent({ ...editEvent, title: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Mô tả ngắn (Vi)</label>
                  <Textarea value={editEvent.description_vi || ''} onChange={e => setEditEvent({ ...editEvent, description_vi: e.target.value })} rows={3} />
                </div>
                <div>
                  <label className="text-sm font-medium">Mô tả ngắn (En)</label>
                  <Textarea value={editEvent.description || ''} onChange={e => setEditEvent({ ...editEvent, description: e.target.value })} rows={3} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-sm font-medium">Ngày *</label>
                  <Input type="date" value={editEvent.event_date || ''} onChange={e => setEditEvent({ ...editEvent, event_date: e.target.value })} /></div>
                <div><label className="text-sm font-medium">Giờ bắt đầu *</label>
                  <Input type="time" value={editEvent.start_time || ''} onChange={e => setEditEvent({ ...editEvent, start_time: e.target.value })} /></div>
                <div><label className="text-sm font-medium">Giờ kết thúc</label>
                  <Input type="time" value={editEvent.end_time || ''} onChange={e => setEditEvent({ ...editEvent, end_time: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Địa điểm (Vi)</label>
                  <Input value={editEvent.location_vi || ''} onChange={e => setEditEvent({ ...editEvent, location_vi: e.target.value })} /></div>
                <div><label className="text-sm font-medium">Địa điểm (En)</label>
                  <Input value={editEvent.location || ''} onChange={e => setEditEvent({ ...editEvent, location: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Switch checked={editEvent.is_online || false} onCheckedChange={v => setEditEvent({ ...editEvent, is_online: v })} />
                  <label className="text-sm font-medium">Online</label>
                </div>
                <div><label className="text-sm font-medium">Link Meet/Zoom</label>
                  <Input value={editEvent.meet_link || ''} onChange={e => setEditEvent({ ...editEvent, meet_link: e.target.value })} placeholder="https://" disabled={!editEvent.is_online} /></div>
                <div><label className="text-sm font-medium">Số lượng tối đa</label>
                  <Input type="number" value={editEvent.max_participants || ''} onChange={e => setEditEvent({ ...editEvent, max_participants: e.target.value ? parseInt(e.target.value) : null })} placeholder="Không giới hạn" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-sm font-medium">Layout</label>
                  <Select value={editEvent.layout_style || 'standard'} onValueChange={v => setEditEvent({ ...editEvent, layout_style: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Tiêu chuẩn</SelectItem>
                      <SelectItem value="hero">Hero Banner lớn</SelectItem>
                      <SelectItem value="minimal">Tối giản</SelectItem>
                      <SelectItem value="magazine">Magazine</SelectItem>
                    </SelectContent>
                  </Select></div>
                <div><label className="text-sm font-medium">Thứ tự (order)</label>
                  <Input type="number" value={editEvent.order_index ?? 0} onChange={e => setEditEvent({ ...editEvent, order_index: parseInt(e.target.value || '0') })} /></div>
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Switch checked={editEvent.is_published || false} onCheckedChange={v => setEditEvent({ ...editEvent, is_published: v })} />
                  <label className="text-sm font-medium">Xuất bản</label>
                </div>
              </div>
            </TabsContent>

            {/* MEDIA */}
            <TabsContent value="media" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ảnh đại diện</label>
                <MediaUploader value={editEvent.thumbnail_url || ''} onChange={url => setEditEvent({ ...editEvent, thumbnail_url: url })} accept="image" bucket="website-assets" folder="events" aspectRatio="video" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Video giới thiệu</label>
                <MediaUploader value={editEvent.video_url || ''} onChange={url => setEditEvent({ ...editEvent, video_url: url })} accept="video" bucket="website-assets" folder="events" aspectRatio="video" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Thư viện ảnh ({(editEvent.gallery_urls || []).length})</label>
                  <Button size="sm" variant="outline" onClick={() => updateArr('gallery_urls', [...(editEvent.gallery_urls || []), ''])}>
                    <Plus className="w-3 h-3 mr-1" />Thêm ảnh
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(editEvent.gallery_urls || []).map((url, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Ảnh #{i + 1}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => updateArr('gallery_urls', (editEvent.gallery_urls || []).filter((_, idx) => idx !== i))}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <MediaUploader value={url} onChange={u => {
                        const next = [...(editEvent.gallery_urls || [])]; next[i] = u; updateArr('gallery_urls', next);
                      }} accept="image" bucket="website-assets" folder="events/gallery" aspectRatio="square" />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* CONTENT */}
            <TabsContent value="content" className="space-y-4 mt-4">
              <div><label className="text-sm font-medium mb-2 block">Nội dung chi tiết (Tiếng Việt)</label>
                <Textarea value={editEvent.content_html_vi || ''} onChange={e => setEditEvent({ ...editEvent, content_html_vi: e.target.value })} rows={12} placeholder="Mô tả chi tiết, hoạt động, chương trình..." /></div>
              <div><label className="text-sm font-medium mb-2 block">Nội dung chi tiết (English)</label>
                <Textarea value={editEvent.content_html || ''} onChange={e => setEditEvent({ ...editEvent, content_html: e.target.value })} rows={12} /></div>
            </TabsContent>

            {/* HIGHLIGHTS */}
            <TabsContent value="highlights" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Điểm nổi bật</h3>
                <Button size="sm" onClick={() => updateArr('highlights', [...(editEvent.highlights || []), { title: '', description: '' }])}>
                  <Plus className="w-4 h-4 mr-1" />Thêm
                </Button>
              </div>
              {(editEvent.highlights || []).map((h, i) => (
                <div key={i} className="p-4 border rounded-xl space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">#{i + 1}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updateArr('highlights', (editEvent.highlights || []).filter((_, idx) => idx !== i))}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input placeholder="Tiêu đề điểm nổi bật" value={h.title} onChange={e => {
                    const next = [...(editEvent.highlights || [])]; next[i] = { ...h, title: e.target.value }; updateArr('highlights', next);
                  }} />
                  <Textarea placeholder="Mô tả ngắn" value={h.description || ''} rows={2} onChange={e => {
                    const next = [...(editEvent.highlights || [])]; next[i] = { ...h, description: e.target.value }; updateArr('highlights', next);
                  }} />
                </div>
              ))}
            </TabsContent>

            {/* AGENDA */}
            <TabsContent value="agenda" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Lịch trình sự kiện</h3>
                <Button size="sm" onClick={() => updateArr('agenda', [...(editEvent.agenda || []), { time: '', title: '', description: '' }])}>
                  <Plus className="w-4 h-4 mr-1" />Thêm mục
                </Button>
              </div>
              {(editEvent.agenda || []).map((a, i) => (
                <div key={i} className="p-4 border rounded-xl space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Mục #{i + 1}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updateArr('agenda', (editEvent.agenda || []).filter((_, idx) => idx !== i))}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="Thời gian (VD: 09:00 - 10:00)" value={a.time} onChange={e => {
                      const next = [...(editEvent.agenda || [])]; next[i] = { ...a, time: e.target.value }; updateArr('agenda', next);
                    }} />
                    <Input className="col-span-2" placeholder="Tiêu đề hoạt động" value={a.title} onChange={e => {
                      const next = [...(editEvent.agenda || [])]; next[i] = { ...a, title: e.target.value }; updateArr('agenda', next);
                    }} />
                  </div>
                  <Textarea placeholder="Mô tả" rows={2} value={a.description || ''} onChange={e => {
                    const next = [...(editEvent.agenda || [])]; next[i] = { ...a, description: e.target.value }; updateArr('agenda', next);
                  }} />
                </div>
              ))}
            </TabsContent>

            {/* SPEAKERS */}
            <TabsContent value="speakers" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Diễn giả</h3>
                <Button size="sm" onClick={() => updateArr('speakers', [...(editEvent.speakers || []), { name: '', title: '', bio: '', avatar_url: '' }])}>
                  <Plus className="w-4 h-4 mr-1" />Thêm diễn giả
                </Button>
              </div>
              {(editEvent.speakers || []).map((s, i) => (
                <div key={i} className="p-4 border rounded-xl space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Diễn giả #{i + 1}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updateArr('speakers', (editEvent.speakers || []).filter((_, idx) => idx !== i))}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Họ tên" value={s.name} onChange={e => {
                      const next = [...(editEvent.speakers || [])]; next[i] = { ...s, name: e.target.value }; updateArr('speakers', next);
                    }} />
                    <Input placeholder="Chức danh" value={s.title || ''} onChange={e => {
                      const next = [...(editEvent.speakers || [])]; next[i] = { ...s, title: e.target.value }; updateArr('speakers', next);
                    }} />
                  </div>
                  <MediaUploader value={s.avatar_url || ''} onChange={u => {
                    const next = [...(editEvent.speakers || [])]; next[i] = { ...s, avatar_url: u }; updateArr('speakers', next);
                  }} accept="image" bucket="website-assets" folder="events/speakers" aspectRatio="square" />
                  <Textarea placeholder="Tiểu sử" rows={2} value={s.bio || ''} onChange={e => {
                    const next = [...(editEvent.speakers || [])]; next[i] = { ...s, bio: e.target.value }; updateArr('speakers', next);
                  }} />
                </div>
              ))}
            </TabsContent>

            {/* EXTRAS: FAQ, Sponsors, price, visibility */}
            <TabsContent value="extras" className="space-y-6 mt-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Award className="w-4 h-4" />Giá vé & nút đăng ký</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-xs text-muted-foreground">Giá (VND)</label>
                    <Input type="number" value={editEvent.price ?? ''} onChange={e => setEditEvent({ ...editEvent, price: e.target.value ? parseFloat(e.target.value) : null })} placeholder="0 = Miễn phí" /></div>
                  <div><label className="text-xs text-muted-foreground">Ghi chú giá</label>
                    <Input value={editEvent.price_note || ''} onChange={e => setEditEvent({ ...editEvent, price_note: e.target.value })} placeholder="VD: Bao gồm trà chiều" /></div>
                  <div><label className="text-xs text-muted-foreground">Nhãn nút đăng ký</label>
                    <Input value={editEvent.register_button_label || ''} onChange={e => setEditEvent({ ...editEvent, register_button_label: e.target.value })} placeholder="Đăng ký ngay" /></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center gap-2"><HelpCircle className="w-4 h-4" />Câu hỏi thường gặp</h3>
                  <Button size="sm" onClick={() => updateArr('faq', [...(editEvent.faq || []), { question: '', answer: '' }])}>
                    <Plus className="w-4 h-4 mr-1" />Thêm
                  </Button>
                </div>
                {(editEvent.faq || []).map((f, i) => (
                  <div key={i} className="p-3 border rounded-lg space-y-2 mb-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Q#{i + 1}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updateArr('faq', (editEvent.faq || []).filter((_, idx) => idx !== i))}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input placeholder="Câu hỏi" value={f.question} onChange={e => {
                      const next = [...(editEvent.faq || [])]; next[i] = { ...f, question: e.target.value }; updateArr('faq', next);
                    }} />
                    <Textarea placeholder="Câu trả lời" rows={2} value={f.answer} onChange={e => {
                      const next = [...(editEvent.faq || [])]; next[i] = { ...f, answer: e.target.value }; updateArr('faq', next);
                    }} />
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center gap-2"><Award className="w-4 h-4" />Nhà tài trợ / Đối tác</h3>
                  <Button size="sm" onClick={() => updateArr('sponsors', [...(editEvent.sponsors || []), { name: '', logo_url: '', url: '' }])}>
                    <Plus className="w-4 h-4 mr-1" />Thêm
                  </Button>
                </div>
                {(editEvent.sponsors || []).map((s, i) => (
                  <div key={i} className="p-3 border rounded-lg space-y-2 mb-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">#{i + 1}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updateArr('sponsors', (editEvent.sponsors || []).filter((_, idx) => idx !== i))}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Tên" value={s.name} onChange={e => {
                        const next = [...(editEvent.sponsors || [])]; next[i] = { ...s, name: e.target.value }; updateArr('sponsors', next);
                      }} />
                      <Input placeholder="Website (https://...)" value={s.url || ''} onChange={e => {
                        const next = [...(editEvent.sponsors || [])]; next[i] = { ...s, url: e.target.value }; updateArr('sponsors', next);
                      }} />
                    </div>
                    <MediaUploader value={s.logo_url || ''} onChange={u => {
                      const next = [...(editEvent.sponsors || [])]; next[i] = { ...s, logo_url: u }; updateArr('sponsors', next);
                    }} accept="image" bucket="website-assets" folder="events/sponsors" aspectRatio="square" />
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Layers className="w-4 h-4" />Hiển thị các phần trên trang sự kiện</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {([
                    ['hero','Hero Banner'],['info','Thông tin nhanh'],['video','Video'],['gallery','Thư viện ảnh'],
                    ['content','Nội dung chi tiết'],['highlights','Điểm nổi bật'],['agenda','Lịch trình'],
                    ['speakers','Diễn giả'],['sponsors','Nhà tài trợ'],['faq','FAQ'],['register','Form đăng ký'],
                  ] as Array<[keyof SectionVisibility, string]>).map(([k, label]) => (
                    <div key={k} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">{label}</span>
                      <Switch checked={vis[k]} onCheckedChange={v => setVis(k, v)} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* FORM */}
            <TabsContent value="form" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Trường form đăng ký</h3>
                  <p className="text-sm text-muted-foreground">Cấu hình các trường người dùng cần điền</p>
                </div>
                <Button size="sm" onClick={addField}><Plus className="w-4 h-4 mr-1" />Thêm trường</Button>
              </div>
              <div className="space-y-3">
                {formFields.map((field, idx) => (
                  <div key={idx} className="p-4 border rounded-xl space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Trường #{idx + 1}</span>
                        {field.is_required && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                      </div>
                      <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => removeField(idx)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs text-muted-foreground">Nhãn (Vi)</label>
                        <Input value={field.label_vi} onChange={e => updateField(idx, { label_vi: e.target.value })} /></div>
                      <div><label className="text-xs text-muted-foreground">Nhãn (En)</label>
                        <Input value={field.label} onChange={e => updateField(idx, { label: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="text-xs text-muted-foreground">Loại</label>
                        <Select value={field.field_type} onValueChange={v => updateField(idx, { field_type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Văn bản</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="tel">Số điện thoại</SelectItem>
                            <SelectItem value="number">Số</SelectItem>
                            <SelectItem value="textarea">Đoạn văn</SelectItem>
                            <SelectItem value="select">Dropdown</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                          </SelectContent>
                        </Select></div>
                      <div><label className="text-xs text-muted-foreground">Placeholder (Vi)</label>
                        <Input value={field.placeholder_vi} onChange={e => updateField(idx, { placeholder_vi: e.target.value })} /></div>
                      <div className="flex items-end">
                        <div className="flex items-center gap-2 p-2 border rounded-lg">
                          <Switch checked={field.is_required} onCheckedChange={v => updateField(idx, { is_required: v })} />
                          <label className="text-xs">Bắt buộc</label>
                        </div>
                      </div>
                    </div>
                    {field.field_type === 'select' && (
                      <div><label className="text-xs text-muted-foreground">Tùy chọn (mỗi dòng)</label>
                        <Textarea value={(field.options || []).join('\n')} onChange={e => updateField(idx, { options: e.target.value.split('\n').filter(Boolean) })} rows={3} /></div>
                    )}
                  </div>
                ))}
                {formFields.length === 0 && (
                  <p className="text-center py-6 text-muted-foreground">Chưa có trường nào.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditDialog(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {editEvent.id ? 'Cập nhật' : 'Tạo sự kiện'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registrations Dialog */}
      <Dialog open={regDialog} onOpenChange={setRegDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Danh sách đăng ký ({registrations.length} người)</DialogTitle>
          </DialogHeader>
          {registrations.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Chưa có người đăng ký</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Thông tin</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày đăng ký</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((reg, i) => (
                  <TableRow key={reg.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {Object.entries(reg.data || {}).map(([key, val]) => (
                          <p key={key} className="text-sm"><span className="text-muted-foreground">{key}:</span> <span className="font-medium">{String(val)}</span></p>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        reg.status === 'registered' ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' :
                        reg.status === 'confirmed' ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                        reg.status === 'cancelled' ? 'bg-red-500/10 text-red-600 border-red-500/30' : ''
                      }>
                        {reg.status === 'registered' ? 'Đã đăng ký' : reg.status === 'confirmed' ? 'Xác nhận' : reg.status === 'cancelled' ? 'Đã hủy' : reg.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{format(new Date(reg.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {reg.status === 'registered' && (
                          <Button size="sm" variant="ghost" className="text-green-600" onClick={() => updateRegStatus(reg.id, 'confirmed')}>
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {reg.status !== 'cancelled' && (
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateRegStatus(reg.id, 'cancelled')}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEvents;

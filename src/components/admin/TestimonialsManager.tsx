import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Plus, Edit, Trash2, Star, Save, Loader2, GripVertical, Eye, EyeOff, Sparkles, Home, Inbox, Check, X } from 'lucide-react';
import { DEFAULT_TESTIMONIALS_SETTINGS, type Testimonial, type TestimonialLayout, type TestimonialsSettings } from '@/hooks/useTestimonials';
import { useQueryClient } from '@tanstack/react-query';
import MediaUploader from '@/components/shared/MediaUploader';
import { ExternalLink, Link2 } from 'lucide-react';

const emptyT = (): Testimonial => ({
  id: crypto.randomUUID(),
  name: '',
  role: '',
  avatar_url: '',
  content: '',
  rating: 5,
  course: '',
  image_url: '',
  drive_url: '',
  video_url: '',
  layout: 'masonry',
  is_active: true,
  is_featured: false,
  order_index: 0,
  size: 'md',
  show_on_homepage: true,
});

interface PendingSubmission {
  id: string;
  created_at: string;
  status: string;
  data: {
    form_type?: string;
    name?: string;
    role?: string;
    email?: string;
    course?: string;
    rating?: number;
    content?: string;
  };
}

export default function TestimonialsManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [rowId, setRowId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);
  const [settingsRowId, setSettingsRowId] = useState<string | null>(null);
  const [settings, setSettings] = useState<TestimonialsSettings>(DEFAULT_TESTIMONIALS_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [pending, setPending] = useState<PendingSubmission[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  useEffect(() => {
    supabase
      .from('website_content')
      .select('id, content')
      .eq('section_key', 'testimonials')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setRowId(data.id);
          const list = (data.content as unknown as Testimonial[]) || [];
          setItems(Array.isArray(list) ? list : []);
        }
      });
    supabase
      .from('website_content')
      .select('id, content')
      .eq('section_key', 'testimonials_settings')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSettingsRowId(data.id);
          const raw = (data.content as Partial<TestimonialsSettings> | null) || null;
          setSettings({
            show_on_homepage: raw?.show_on_homepage ?? DEFAULT_TESTIMONIALS_SETTINGS.show_on_homepage,
            homepage_limit: raw?.homepage_limit ?? DEFAULT_TESTIMONIALS_SETTINGS.homepage_limit,
          });
        }
      });
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoadingPending(true);
    const { data } = await supabase
      .from('contact_submissions')
      .select('id, created_at, status, data')
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(50);
    const list = ((data as PendingSubmission[]) || []).filter(
      (r) => (r.data as any)?.form_type === 'feedback',
    );
    setPending(list);
    setLoadingPending(false);
  };

  const approvePending = async (sub: PendingSubmission) => {
    const t: Testimonial = {
      id: crypto.randomUUID(),
      name: sub.data.name || 'Học viên',
      role: sub.data.role || '',
      content: sub.data.content || '',
      rating: sub.data.rating ?? 5,
      course: sub.data.course || '',
      layout: 'masonry',
      is_active: true,
      is_featured: false,
      order_index: items.length + 1,
    };
    await persist([...items, t]);
    await supabase
      .from('contact_submissions')
      .update({ status: 'approved', admin_notes: 'Approved as testimonial' })
      .eq('id', sub.id);
    setPending((p) => p.filter((s) => s.id !== sub.id));
    toast({ title: 'Đã duyệt feedback ✓' });
  };

  const rejectPending = async (sub: PendingSubmission) => {
    if (!confirm('Từ chối feedback này?')) return;
    await supabase.from('contact_submissions').update({ status: 'rejected' }).eq('id', sub.id);
    setPending((p) => p.filter((s) => s.id !== sub.id));
    toast({ title: 'Đã từ chối' });
  };

  const persistSettings = async (next: TestimonialsSettings) => {
    setSavingSettings(true);
    const payload = {
      section_key: 'testimonials_settings',
      title: 'Cài đặt feedback trang chủ',
      content: next as any,
      is_active: true,
    };
    try {
      if (settingsRowId) {
        await supabase.from('website_content').update(payload).eq('id', settingsRowId);
      } else {
        const { data } = await supabase.from('website_content').insert(payload).select('id').single();
        if (data) setSettingsRowId(data.id);
      }
      setSettings(next);
      qc.invalidateQueries({ queryKey: ['testimonials-settings'] });
      toast({ title: 'Đã lưu cài đặt trang chủ ✓' });
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e?.message, variant: 'destructive' });
    }
    setSavingSettings(false);
  };

  const persist = async (next: Testimonial[]) => {
    setSaving(true);
    const ordered = next.map((t, i) => ({ ...t, order_index: i + 1 }));
    const payload = {
      section_key: 'testimonials',
      title: 'Học viên nói gì',
      content: ordered as any,
      is_active: true,
    };
    try {
      if (rowId) {
        await supabase.from('website_content').update(payload).eq('id', rowId);
      } else {
        const { data } = await supabase.from('website_content').insert(payload).select('id').single();
        if (data) setRowId(data.id);
      }
      setItems(ordered);
      qc.invalidateQueries({ queryKey: ['testimonials'] });
      toast({ title: 'Đã lưu ✓' });
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e?.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleSave = (t: Testimonial) => {
    const next = items.some((i) => i.id === t.id)
      ? items.map((i) => (i.id === t.id ? t : i))
      : [...items, t];
    persist(next);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Xoá feedback này?')) return;
    persist(items.filter((t) => t.id !== id));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[idx], next[j]] = [next[j], next[idx]];
    persist(next);
  };

  const toggle = (id: string, field: 'is_active' | 'is_featured') => {
    persist(items.map((t) => (t.id === id ? { ...t, [field]: !t[field] } : t)));
  };

  const toggleHomepage = (id: string) => {
    persist(items.map((t) => (t.id === id ? { ...t, show_on_homepage: !(t.show_on_homepage !== false) } : t)));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Feedback học viên</CardTitle>
              <CardDescription>
                Quản lý các feedback hiển thị ở trang /gioi-thieu. Chọn layout cho mỗi feedback (Masonry / Bento / Carousel / Video).
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => setEditing(emptyT())} variant="hero">
            <Plus className="w-4 h-4 mr-1" /> Thêm feedback
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Pending submissions */}
        <div className="mb-4 p-4 rounded-xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-500/5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-amber-600" />
              <p className="font-semibold text-sm">
                Feedback chờ duyệt {pending.length > 0 && <Badge className="ml-1 bg-amber-500 text-white">{pending.length}</Badge>}
              </p>
              {loadingPending && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
            </div>
            <Button size="sm" variant="ghost" onClick={loadPending}>Tải lại</Button>
          </div>
          {pending.length === 0 && !loadingPending && (
            <p className="text-xs text-muted-foreground">Không có feedback mới từ visitor.</p>
          )}
          {pending.map((sub) => (
            <div key={sub.id} className="p-3 rounded-lg bg-background border border-border/60 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{sub.data.name || '(Ẩn danh)'}</p>
                  {sub.data.role && <span className="text-xs text-muted-foreground">{sub.data.role}</span>}
                  {sub.data.course && <Badge variant="outline" className="text-[10px]">{sub.data.course}</Badge>}
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: sub.data.rating ?? 5 }).map((_, k) => (
                      <Star key={k} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-foreground/80 mt-1 whitespace-pre-wrap">{sub.data.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(sub.created_at).toLocaleString('vi-VN')}
                  {sub.data.email && ` • ${sub.data.email}`}
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button size="sm" variant="hero" onClick={() => approvePending(sub)}>
                  <Check className="w-3.5 h-3.5 mr-1" /> Duyệt
                </Button>
                <Button size="sm" variant="outline" onClick={() => rejectPending(sub)}>
                  <X className="w-3.5 h-3.5 mr-1" /> Từ chối
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Homepage settings */}
        <div className="mb-4 p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm">Hiển thị trên Trang chủ</p>
            {savingSettings && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.show_on_homepage}
                onCheckedChange={(v) => persistSettings({ ...settings, show_on_homepage: v })}
              />
              <span className="text-sm">{settings.show_on_homepage ? 'Đang hiển thị' : 'Đang ẩn'}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Số lượng hiển thị:</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={settings.homepage_limit}
                onChange={(e) =>
                  setSettings({ ...settings, homepage_limit: Math.max(1, Math.min(50, parseInt(e.target.value || '1', 10))) })
                }
                onBlur={() => persistSettings(settings)}
                className="w-20 h-9"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Khi bật, các feedback đang hiển thị sẽ xuất hiện ở trang chủ theo thứ tự sắp xếp bên dưới (giới hạn số lượng).
          </p>
        </div>

        {items.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">Chưa có feedback nào.</div>
        )}

        {items.map((t, i) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 p-3 border rounded-xl transition-all ${
              t.is_active === false ? 'opacity-50 bg-muted/30' : 'hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col">
              <button onClick={() => move(i, -1)} className="hover:text-primary" disabled={i === 0}>
                <GripVertical className="w-4 h-4 -mb-2 rotate-180" />
              </button>
              <span className="text-[10px] font-mono text-muted-foreground text-center">{i + 1}</span>
              <button onClick={() => move(i, 1)} className="hover:text-primary" disabled={i === items.length - 1}>
                <GripVertical className="w-4 h-4 -mt-2" />
              </button>
            </div>

            <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
              {t.image_url ? (
                <img src={t.image_url} alt="" className="w-full h-full object-cover" />
              ) : t.avatar_url ? (
                <img src={t.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">N/A</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm truncate">{t.name || '(Chưa đặt tên)'}</p>
                {t.role && <span className="text-xs text-muted-foreground">{t.role}</span>}
                <Badge variant="outline" className="text-[10px]">{t.layout}</Badge>
                <Badge variant="outline" className="text-[10px] uppercase">{t.size || 'md'}</Badge>
                {t.show_on_homepage !== false && (
                  <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                    <Home className="w-2.5 h-2.5 mr-1" /> Trang chủ
                  </Badge>
                )}
                {t.drive_url && (
                  <a href={t.drive_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/30 text-[10px] cursor-pointer">
                      <ExternalLink className="w-2.5 h-2.5 mr-1" /> Link Drive
                    </Badge>
                  </a>
                )}
                {t.is_featured && (
                  <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30 text-[10px]">
                    <Sparkles className="w-2.5 h-2.5 mr-1" /> Nổi bật
                  </Badge>
                )}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: t.rating ?? 5 }).map((_, k) => (
                    <Star key={k} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.content}</p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => toggleHomepage(t.id)}
                title={t.show_on_homepage !== false ? 'Đang hiển thị trang chủ' : 'Ẩn khỏi trang chủ'}
              >
                <Home className={`w-4 h-4 ${t.show_on_homepage !== false ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => toggle(t.id, 'is_featured')} title="Đánh dấu nổi bật">
                <Sparkles className={`w-4 h-4 ${t.is_featured ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => toggle(t.id, 'is_active')} title="Ẩn/Hiện">
                {t.is_active === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditing(t)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}

        {saving && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Đang lưu...
          </div>
        )}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing && items.some((i) => i.id === editing.id) ? 'Sửa feedback' : 'Thêm feedback'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Tên học viên *</label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Vai trò / Chức danh</label>
                  <Input
                    placeholder="VD: Học viên N3"
                    value={editing.role || ''}
                    onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">Nội dung feedback *</label>
                <Textarea
                  rows={4}
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Khoá học</label>
                  <Input
                    value={editing.course || ''}
                    onChange={(e) => setEditing({ ...editing, course: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Đánh giá (1-5 sao)</label>
                  <Select
                    value={String(editing.rating ?? 5)}
                    onValueChange={(v) => setEditing({ ...editing, rating: Number(v) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} sao</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Avatar (ảnh tròn)</label>
                  <MediaUploader
                    value={editing.avatar_url || ''}
                    onChange={(url) => setEditing({ ...editing, avatar_url: url })}
                    accept="image"
                    bucket="website-assets"
                    folder="testimonials/avatars"
                    aspectRatio="square"
                    placeholder="Upload avatar"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Ảnh chính / Nguồn ảnh (hiển thị trong card)</label>
                  <MediaUploader
                    value={editing.image_url || ''}
                    onChange={(url) => setEditing({ ...editing, image_url: url })}
                    accept="image"
                    bucket="website-assets"
                    folder="testimonials/images"
                    aspectRatio="video"
                    placeholder="Upload ảnh hoặc dán link Drive"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium flex items-center gap-1.5 mb-1">
                  <Link2 className="w-3.5 h-3.5 text-blue-500" /> Link Google Drive / Thư mục ảnh chứng thực (Để học viên nhấp vào xem trực tiếp)
                </label>
                <Input
                  placeholder="https://drive.google.com/drive/folders/1pgCZbEXwYxQcsm32HJJWYEmV2-gxqEoH..."
                  value={editing.drive_url || ''}
                  onChange={(e) => setEditing({ ...editing, drive_url: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Dán link thư mục Google Drive chứa ảnh chụp gốc, học viên ngoài trang chủ có thể click xem nguyên album chứng thực!
                </p>
              </div>

              <div>
                <label className="text-xs font-medium">Video URL (YouTube embed)</label>
                <Input
                  placeholder="https://www.youtube.com/embed/..."
                  value={editing.video_url || ''}
                  onChange={(e) => setEditing({ ...editing, video_url: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium">Layout hiển thị</label>
                  <Select
                    value={editing.layout}
                    onValueChange={(v) => setEditing({ ...editing, layout: v as TestimonialLayout })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masonry">Masonry (lưới)</SelectItem>
                      <SelectItem value="bento">Bento (ô lớn)</SelectItem>
                      <SelectItem value="carousel">Carousel (câu chuyện)</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium">Kích thước ảnh</label>
                  <Select
                    value={editing.size || 'md'}
                    onValueChange={(v) => setEditing({ ...editing, size: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Nhỏ (4:3)</SelectItem>
                      <SelectItem value="md">Vừa (1:1)</SelectItem>
                      <SelectItem value="lg">Lớn (4:5 / ô đôi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between border rounded-lg px-3">
                  <label className="text-xs font-medium">Nổi bật</label>
                  <Switch
                    checked={!!editing.is_featured}
                    onCheckedChange={(v) => setEditing({ ...editing, is_featured: v })}
                  />
                </div>
                <div className="flex items-center justify-between border rounded-lg px-3">
                  <label className="text-xs font-medium">Hiển thị</label>
                  <Switch
                    checked={editing.is_active !== false}
                    onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border rounded-lg px-3 py-2 bg-primary/5">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Hiển thị trên Trang chủ</p>
                    <p className="text-[11px] text-muted-foreground">Tắt để chỉ hiện ở trang /gioi-thieu, không xuất hiện ngoài Index.</p>
                  </div>
                </div>
                <Switch
                  checked={editing.show_on_homepage !== false}
                  onCheckedChange={(v) => setEditing({ ...editing, show_on_homepage: v })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Huỷ</Button>
                <Button
                  onClick={() => handleSave(editing)}
                  disabled={!editing.name || !editing.content}
                  variant="hero"
                >
                  <Save className="w-4 h-4 mr-1" /> Lưu feedback
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

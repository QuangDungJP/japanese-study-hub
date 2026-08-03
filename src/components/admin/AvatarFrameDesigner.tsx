import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import MediaLibraryDialog from '@/components/admin/MediaLibraryDialog';
import CustomAvatarFrame from '@/components/shared/CustomAvatarFrame';
import {
  CustomFrameConfig,
  DEFAULT_FRAME_CONFIG,
  invalidateCustomFrames,
  normalizeFrameConfig,
} from '@/lib/customAvatarFrames';
import { Sparkles, Upload, FolderOpen, Trash2, Edit, Plus, Wand2, Loader2, RefreshCw } from 'lucide-react';

interface FrameRow {
  id: string;
  code: string;
  title_vi: string;
  description_vi: string | null;
  cover_image: string | null;
  price_vnd: number;
  price_xp: number;
  req_streak: number;
  is_active: boolean;
  is_featured: boolean;
  content_data: any;
}

const PRESETS: { name: string; emoji: string; config: Partial<CustomFrameConfig> }[] = [
  { name: 'Hoàng Kim Rồng Thần', emoji: '🐉', config: { style: 'aura', ringFrom: '#f59e0b', ringVia: '#fde68a', ringTo: '#b45309', glow: 20, spin: true, spinSpeed: 7, emojiTop: '🐉', labelText: 'LEGEND', labelFrom: '#b45309', labelTo: '#f59e0b' } },
  { name: 'Sakura Mộng Mơ', emoji: '🌸', config: { style: 'ring', ringFrom: '#f472b6', ringVia: '#fbcfe8', ringTo: '#fb7185', glow: 14, spin: false, pulse: true, emojiTop: '🌸', emojiLeft: '🌸', emojiRight: '🌸' } },
  { name: 'Neon Tokyo', emoji: '🌃', config: { style: 'double', ringFrom: '#a855f7', ringVia: '#22d3ee', ringTo: '#6366f1', glow: 22, spin: true, spinSpeed: 5, emojiTop: '⚡', labelText: 'TOKYO', labelFrom: '#6366f1', labelTo: '#22d3ee' } },
  { name: 'Trà Đạo Matcha', emoji: '🍵', config: { style: 'dashed', ringFrom: '#16a34a', ringVia: '#86efac', ringTo: '#065f46', glow: 10, spin: true, spinSpeed: 14, emojiTop: '🍵' } },
  { name: 'Mèo May Mắn', emoji: '🐱', config: { style: 'ring', ringFrom: '#fb7185', ringVia: '#fecdd3', ringTo: '#f43f5e', glow: 10, spin: false, emojiLeft: '🐾', emojiRight: '🐾', emojiTop: '🐱' } },
  { name: 'Băng Giá Fuji', emoji: '❄️', config: { style: 'aura', ringFrom: '#38bdf8', ringVia: '#e0f2fe', ringTo: '#2563eb', glow: 18, spin: true, spinSpeed: 10, emojiTop: '❄️', labelText: 'FUJI' } },
];

const emptyForm = {
  id: '',
  code: '',
  title_vi: '',
  description_vi: '',
  cover_image: '',
  price_vnd: 0,
  price_xp: 0,
  req_streak: 0,
  is_active: true,
  is_featured: false,
};

export const AvatarFrameDesigner = () => {
  const { toast } = useToast();
  const [frames, setFrames] = useState<FrameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  const [form, setForm] = useState({ ...emptyForm });
  const [config, setConfig] = useState<CustomFrameConfig>({ ...DEFAULT_FRAME_CONFIG });
  const [sampleAvatar, setSampleAvatar] = useState<string>('');

  const fetchFrames = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('store_items')
        .select('*')
        .eq('category', 'avatar_frame')
        .order('created_at', { ascending: false });
      setFrames((data || []) as FrameRow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFrames(); }, [fetchFrames]);

  const set = (patch: Partial<CustomFrameConfig>) => setConfig(prev => ({ ...prev, ...patch }));

  const resetForm = () => {
    setForm({ ...emptyForm });
    setConfig({ ...DEFAULT_FRAME_CONFIG });
  };

  const editFrame = (row: FrameRow) => {
    setForm({
      id: row.id,
      code: row.code,
      title_vi: row.title_vi,
      description_vi: row.description_vi || '',
      cover_image: row.cover_image || '',
      price_vnd: row.price_vnd || 0,
      price_xp: row.price_xp || 0,
      req_streak: row.req_streak || 0,
      is_active: row.is_active,
      is_featured: row.is_featured,
    });
    setConfig(normalizeFrameConfig(row.content_data?.frame_config ?? row.content_data));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadFile = async (file: File, target: 'overlay' | 'cover' | 'sample') => {
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const path = `avatar-frames/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error } = await supabase.storage.from('lesson-assets').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('lesson-assets').getPublicUrl(path);
      if (target === 'overlay') set({ overlayImage: publicUrl });
      if (target === 'cover') setForm(f => ({ ...f, cover_image: publicUrl }));
      if (target === 'sample') setSampleAvatar(publicUrl);
      toast({ title: '✅ Đã tải ảnh lên' });
    } catch (err: any) {
      toast({ title: 'Lỗi tải ảnh', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const code = (form.code || '').trim();
    if (!code || !form.title_vi.trim()) {
      toast({ title: 'Thiếu thông tin', description: 'Cần Mã khung và Tên khung', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code,
        title_vi: form.title_vi,
        description_vi: form.description_vi,
        category: 'avatar_frame',
        cover_image: form.cover_image || null,
        price_vnd: Number(form.price_vnd) || 0,
        price_jpy: 0,
        price_xp: Number(form.price_xp) || 0,
        req_streak: Number(form.req_streak) || 0,
        is_active: form.is_active,
        is_featured: form.is_featured,
        content_data: { frame_config: config },
      };

      if (form.id) {
        const { error } = await (supabase as any).from('store_items').update(payload).eq('id', form.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('store_items').insert(payload);
        if (error) throw error;
      }

      invalidateCustomFrames();
      toast({ title: '✨ Đã lưu khung avatar', description: `${form.title_vi} đã sẵn sàng bán trong Cửa hàng.` });
      resetForm();
      fetchFrames();
    } catch (err: any) {
      toast({ title: 'Lỗi lưu khung', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: FrameRow) => {
    if (!confirm(`Xóa khung "${row.title_vi}"?`)) return;
    await (supabase as any).from('store_items').delete().eq('id', row.id);
    invalidateCustomFrames();
    toast({ title: 'Đã xóa khung avatar' });
    fetchFrames();
  };

  const Preview = ({ size, label }: { size: number; label: string }) => (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <CustomAvatarFrame config={config} scale={size / 128} />
        <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-background bg-muted flex items-center justify-center">
          {sampleAvatar ? (
            <img src={sampleAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-black text-primary" style={{ fontSize: size / 2.6 }}>A</span>
          )}
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground font-semibold">{label}</span>
    </div>
  );

  const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="space-y-1">
      <Label className="text-[11px]">{label}</Label>
      <div className="flex gap-1.5">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="h-9 w-11 rounded-md border bg-background cursor-pointer" />
        <Input value={value} onChange={e => onChange(e.target.value)} className="h-9 text-xs flex-1" />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <Card className="border-2 border-amber-500/25 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-500/10 via-fuchsia-500/10 to-indigo-500/10 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-black">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Xưởng Thiết Kế Khung Avatar
          </CardTitle>
          <CardDescription className="text-xs">
            Tự tạo khung avatar riêng (màu, hào quang, emoji, ảnh PNG, nhãn danh hiệu), đặt giá và bán ngay trong Cửa hàng.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 grid lg:grid-cols-[320px_1fr] gap-6">
          {/* LIVE PREVIEW */}
          <div className="space-y-4">
            <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex flex-col items-center gap-6 shadow-xl border border-white/10">
              <Preview size={128} label="Hồ sơ (3xl)" />
              <div className="flex items-end gap-6">
                <Preview size={64} label="Danh sách" />
                <Preview size={40} label="Bình luận" />
              </div>
            </div>

            <div className="flex gap-1.5">
              <input type="file" accept="image/*" className="hidden" id="frame-sample-upload"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'sample'); }} />
              <Button variant="outline" size="sm" className="flex-1 text-[11px] gap-1"
                onClick={() => document.getElementById('frame-sample-upload')?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Ảnh mẫu xem thử
              </Button>
              <Button variant="ghost" size="sm" className="text-[11px]" onClick={() => setSampleAvatar('')}>Xóa</Button>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold">Mẫu dựng sẵn (bấm để áp dụng)</Label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map(p => (
                  <button key={p.name} onClick={() => set(p.config)}
                    className="rounded-xl border-2 border-border hover:border-amber-400 hover:bg-amber-500/5 p-2 text-[11px] font-bold text-left transition-all">
                    <span className="mr-1">{p.emoji}</span>{p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Mã khung (code) *</Label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.replace(/\s+/g, '_').toLowerCase() })} placeholder="frame_rong_than_2026" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Tên hiển thị *</Label>
                <Input value={form.title_vi} onChange={e => setForm({ ...form, title_vi: e.target.value })} placeholder="Khung Rồng Thần 2026" className="h-9 text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">Mô tả bán hàng</Label>
              <Textarea value={form.description_vi} onChange={e => setForm({ ...form, description_vi: e.target.value })} rows={2} className="text-xs" placeholder="Khung giới hạn dành cho học viên xuất sắc..." />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Kiểu khung</Label>
                <Select value={config.style} onValueChange={(v: any) => set({ style: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ring">Vòng đơn</SelectItem>
                    <SelectItem value="double">Vòng đôi</SelectItem>
                    <SelectItem value="dashed">Nét đứt xoay</SelectItem>
                    <SelectItem value="aura">Hào quang (Aura)</SelectItem>
                    <SelectItem value="image">Chỉ dùng ảnh PNG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ColorField label="Màu 1" value={config.ringFrom} onChange={v => set({ ringFrom: v })} />
              <ColorField label="Màu 2" value={config.ringVia} onChange={v => set({ ringVia: v })} />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <ColorField label="Màu 3" value={config.ringTo} onChange={v => set({ ringTo: v })} />
              <div className="space-y-1">
                <Label className="text-[11px]">Độ dày viền: {config.thickness}px</Label>
                <Slider value={[config.thickness]} min={1} max={10} step={1} onValueChange={v => set({ thickness: v[0] })} />
                <Label className="text-[11px]">Khoảng cách: {config.gap}px</Label>
                <Slider value={[config.gap]} min={2} max={24} step={1} onValueChange={v => set({ gap: v[0] })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Độ phát sáng: {config.glow}px</Label>
                <Slider value={[config.glow]} min={0} max={40} step={1} onValueChange={v => set({ glow: v[0] })} />
                <Label className="text-[11px]">Tốc độ xoay: {config.spinSpeed}s</Label>
                <Slider value={[config.spinSpeed]} min={2} max={30} step={1} onValueChange={v => set({ spinSpeed: v[0] })} />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 rounded-xl bg-muted/50 p-3">
              <div className="flex items-center gap-2"><Switch checked={config.spin} onCheckedChange={v => set({ spin: v })} /><Label className="text-[11px]">Xoay vòng</Label></div>
              <div className="flex items-center gap-2"><Switch checked={config.pulse} onCheckedChange={v => set({ pulse: v })} /><Label className="text-[11px]">Nhấp nháy</Label></div>
              <div className="flex items-center gap-2"><Switch checked={config.bounceEmoji} onCheckedChange={v => set({ bounceEmoji: v })} /><Label className="text-[11px]">Emoji nhảy</Label></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1"><Label className="text-[11px]">Emoji trên</Label><Input value={config.emojiTop} onChange={e => set({ emojiTop: e.target.value })} className="h-9 text-center text-base" placeholder="👑" /></div>
              <div className="space-y-1"><Label className="text-[11px]">Emoji dưới</Label><Input value={config.emojiBottom} onChange={e => set({ emojiBottom: e.target.value })} className="h-9 text-center text-base" placeholder="🌸" /></div>
              <div className="space-y-1"><Label className="text-[11px]">Emoji trái</Label><Input value={config.emojiLeft} onChange={e => set({ emojiLeft: e.target.value })} className="h-9 text-center text-base" placeholder="✨" /></div>
              <div className="space-y-1"><Label className="text-[11px]">Emoji phải</Label><Input value={config.emojiRight} onChange={e => set({ emojiRight: e.target.value })} className="h-9 text-center text-base" placeholder="⭐" /></div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1"><Label className="text-[11px]">Nhãn danh hiệu</Label><Input value={config.labelText} onChange={e => set({ labelText: e.target.value })} className="h-9 text-xs" placeholder="VIP / SENSEI / N1" /></div>
              <ColorField label="Nhãn màu trái" value={config.labelFrom} onChange={v => set({ labelFrom: v })} />
              <ColorField label="Nhãn màu phải" value={config.labelTo} onChange={v => set({ labelTo: v })} />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold">Ảnh PNG khung (tùy chọn, nền trong suốt)</Label>
              <div className="flex gap-1.5">
                <Input value={config.overlayImage} onChange={e => set({ overlayImage: e.target.value })} placeholder="https://..." className="h-9 text-xs flex-1" />
                <input type="file" accept="image/png,image/webp" className="hidden" id="frame-overlay-upload"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'overlay'); }} />
                <Button variant="outline" size="sm" className="h-9 text-[11px] gap-1" onClick={() => document.getElementById('frame-overlay-upload')?.click()} disabled={uploading}>
                  <Upload className="w-3 h-3" /> Upload
                </Button>
                <Button variant="secondary" size="sm" className="h-9 text-[11px] gap-1" onClick={() => setMediaOpen(true)}>
                  <FolderOpen className="w-3 h-3 text-amber-500" /> Thư viện
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1"><Label className="text-[11px]">Giá bán (VNĐ)</Label><Input type="number" value={form.price_vnd} onChange={e => setForm({ ...form, price_vnd: Number(e.target.value) })} className="h-9 text-xs" /></div>
              <div className="space-y-1"><Label className="text-[11px]">Giá điểm học tập</Label><Input type="number" value={form.price_xp} onChange={e => setForm({ ...form, price_xp: Number(e.target.value) })} className="h-9 text-xs" /></div>
              <div className="space-y-1"><Label className="text-[11px]">Yêu cầu chuỗi ngày học</Label><Input type="number" value={form.req_streak} onChange={e => setForm({ ...form, req_streak: Number(e.target.value) })} className="h-9 text-xs" /></div>
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-muted/50 p-3">
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /><Label className="text-[11px]">Đang bán</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={v => setForm({ ...form, is_featured: v })} /><Label className="text-[11px]">Nổi bật</Label></div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2 font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {form.id ? 'Cập nhật khung' : 'Tạo & đăng bán khung'}
              </Button>
              <Button variant="outline" onClick={resetForm} className="gap-1.5"><Plus className="w-4 h-4" /> Khung mới</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EXISTING FRAMES */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-bold">Khung đã tạo ({frames.length})</CardTitle>
            <CardDescription className="text-xs">Các khung này hiển thị trong Cửa hàng và trang Hồ sơ học viên</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchFrames}><RefreshCw className="w-3.5 h-3.5" /> Tải lại</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Đang tải...</p>
          ) : frames.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Chưa có khung nào. Hãy thiết kế khung đầu tiên!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {frames.map(row => {
                const cfg = normalizeFrameConfig(row.content_data?.frame_config ?? row.content_data);
                return (
                  <div key={row.id} className="rounded-2xl border-2 p-4 flex flex-col items-center gap-3 hover:border-amber-400/60 transition-all">
                    <div className="relative inline-flex items-center justify-center w-16 h-16">
                      <CustomAvatarFrame config={cfg} scale={0.85} />
                      <div className="relative w-full h-full rounded-full overflow-hidden bg-muted border-2 border-background flex items-center justify-center">
                        <span className="font-black text-primary text-xl">A</span>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-center line-clamp-1">{row.title_vi}</p>
                    <div className="flex flex-wrap justify-center gap-1">
                      {row.price_vnd > 0 && <Badge variant="outline" className="text-[9px]">{row.price_vnd.toLocaleString('vi-VN')}đ</Badge>}
                      {row.price_xp > 0 && <Badge variant="outline" className="text-[9px]">{row.price_xp} điểm</Badge>}
                      {!row.is_active && <Badge variant="destructive" className="text-[9px]">Ẩn</Badge>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => editFrame(row)}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => handleDelete(row)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <MediaLibraryDialog
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        onSelectUrl={(url: string) => set({ overlayImage: url })}
        fileType="image"
      />
    </div>
  );
};

export default AvatarFrameDesigner;

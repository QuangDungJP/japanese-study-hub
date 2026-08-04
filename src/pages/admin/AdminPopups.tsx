import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  ExternalLink, 
  Monitor, 
  Smartphone, 
  Clock, 
  Sparkles,
  Calendar,
  Layers,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import MediaLibraryDialog from '@/components/admin/MediaLibraryDialog';

export interface MarketingPopup {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  target_link: string | null;
  pc_width_px: number;
  pc_height_px: number;
  mobile_width_px: number;
  mobile_height_px: number;
  display_frequency: 'first_visit' | 'session' | 'once_a_day' | 'always';
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
  order_index: number;
  created_at?: string;
}

const defaultForm: Partial<MarketingPopup> = {
  title: '',
  description: '',
  image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000',
  target_link: '/store',
  pc_width_px: 520,
  pc_height_px: 620,
  mobile_width_px: 340,
  mobile_height_px: 450,
  display_frequency: 'first_visit',
  start_at: new Date().toISOString().slice(0, 16),
  end_at: '',
  is_active: true,
  order_index: 0,
};

const AdminPopups = () => {
  const [popups, setPopups] = useState<MarketingPopup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'pc' | 'mobile'>('pc');
  const [editingPopup, setEditingPopup] = useState<MarketingPopup | null>(null);
  const [form, setForm] = useState<Partial<MarketingPopup>>(defaultForm);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketing_popups' as any)
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPopups((data as any[]) || []);
    } catch (e: any) {
      console.error('Error fetching popups:', e);
      toast.error('Lỗi khi tải danh sách Popup: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPopup(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (popup: MarketingPopup) => {
    setEditingPopup(popup);
    setForm({
      ...popup,
      start_at: popup.start_at ? new Date(popup.start_at).toISOString().slice(0, 16) : '',
      end_at: popup.end_at ? new Date(popup.end_at).toISOString().slice(0, 16) : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.image_url) {
      return toast.error('Vui lòng nhập tiêu đề và link ảnh popup');
    }

    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description || null,
        image_url: form.image_url,
        target_link: form.target_link || null,
        pc_width_px: Number(form.pc_width_px) || 520,
        pc_height_px: Number(form.pc_height_px) || 620,
        mobile_width_px: Number(form.mobile_width_px) || 340,
        mobile_height_px: Number(form.mobile_height_px) || 450,
        display_frequency: form.display_frequency || 'first_visit',
        start_at: form.start_at ? new Date(form.start_at).toISOString() : new Date().toISOString(),
        end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
        is_active: form.is_active ?? true,
        order_index: Number(form.order_index) || 0,
        updated_at: new Date().toISOString(),
      };

      if (editingPopup) {
        const { error } = await supabase
          .from('marketing_popups' as any)
          .update(payload)
          .eq('id', editingPopup.id);
        if (error) throw error;
        toast.success('Đã cập nhật Popup thành công!');
      } else {
        const { error } = await supabase
          .from('marketing_popups' as any)
          .insert(payload);
        if (error) throw error;
        toast.success('Đã tạo Popup quảng cáo mới!');
      }

      setDialogOpen(false);
      fetchPopups();
    } catch (e: any) {
      console.error('Error saving popup:', e);
      toast.error('Lỗi khi lưu Popup: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (popup: MarketingPopup) => {
    try {
      const { error } = await supabase
        .from('marketing_popups' as any)
        .update({ is_active: !popup.is_active, updated_at: new Date().toISOString() })
        .eq('id', popup.id);
      if (error) throw error;
      toast.success(`Đã ${!popup.is_active ? 'bật' : 'tắt'} hiển thị Popup!`);
      setPopups(prev => prev.map(p => p.id === popup.id ? { ...p, is_active: !p.is_active } : p));
    } catch (e: any) {
      toast.error('Lỗi: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa Popup quảng cáo này?')) return;
    try {
      const { error } = await supabase
        .from('marketing_popups' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Đã xóa Popup thành công!');
      fetchPopups();
    } catch (e: any) {
      toast.error('Lỗi xóa Popup: ' + e.message);
    }
  };

  const frequencyLabels: Record<string, string> = {
    first_visit: '🔥 Lần đầu vào Website',
    session: '🌐 Mỗi phiên làm việc',
    once_a_day: '📅 1 lần / Ngày',
    always: '⚡ Luôn luôn xuất hiện',
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-primary/10 via-accent/10 to-transparent p-6 rounded-3xl border border-primary/20">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-primary animate-pulse" />
            <h1 className="text-2xl font-extrabold tracking-tight">Quản lý Popup Quảng cáo & Siêu Banner</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Tùy chỉnh Popup hiển thị khuyến mãi, carousel nhiều ảnh, kích thước PC/Mobile, lịch hẹn giờ và số lần xuất hiện.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2 shadow-lg hover:shadow-xl font-bold">
          <Plus className="w-4 h-4" /> Thêm Popup Quảng cáo Mới
        </Button>
      </div>

      {/* Popups Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse h-64 bg-muted/40" />
          ))}
        </div>
      ) : popups.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardContent className="space-y-3">
            <Sparkles className="w-12 h-12 text-primary mx-auto opacity-50" />
            <h3 className="text-lg font-bold">Chưa có Popup Quảng cáo nào</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Tạo Popup mới để hiển thị các chương trình khuyến mãi, khóa học hot hoặc thông báo quan trọng cho học viên.
            </p>
            <Button onClick={handleOpenCreate} variant="outline" className="gap-2 mt-2">
              <Plus className="w-4 h-4" /> Tạo Popup Đầu Tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popups.map(popup => (
            <Card key={popup.id} className="overflow-hidden group hover:border-primary/50 transition-all shadow-sm hover:shadow-md relative flex flex-col">
              {/* Image Preview Banner */}
              <div className="relative h-48 bg-muted/80 overflow-hidden flex items-center justify-center">
                <img 
                  src={popup.image_url} 
                  alt={popup.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <Badge variant={popup.is_active ? 'default' : 'secondary'} className="font-bold shadow-md">
                    {popup.is_active ? '🟢 Đang chạy' : '⚪ Đã tắt'}
                  </Badge>
                  <Badge className="bg-black/60 text-white backdrop-blur-sm border-white/20 text-[10px]">
                    Thứ tự: #{popup.order_index}
                  </Badge>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-bold text-base line-clamp-1">{popup.title}</h3>
                  {popup.target_link && (
                    <p className="text-xs text-white/80 flex items-center gap-1 line-clamp-1 font-mono">
                      <ExternalLink className="w-3 h-3" /> {popup.target_link}
                    </p>
                  )}
                </div>
              </div>

              {/* Popup Details */}
              <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" /> Tần suất:
                    </span>
                    <Badge variant="outline" className="font-medium">
                      {frequencyLabels[popup.display_frequency] || popup.display_frequency}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5 text-blue-500" /> Kích thước PC:
                    </span>
                    <span className="font-mono">{popup.pc_width_px} x {popup.pc_height_px} px</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-purple-500" /> Kích thước Mobile:
                    </span>
                    <span className="font-mono">{popup.mobile_width_px} x {popup.mobile_height_px} px</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={popup.is_active}
                      onCheckedChange={() => handleToggleActive(popup)}
                    />
                    <span className="text-xs font-semibold">{popup.is_active ? 'Bật' : 'Tắt'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => { setForm(popup); setPreviewDevice('pc'); setPreviewOpen(true); }}
                      title="Xem trước Popup"
                    >
                      <Eye className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleOpenEdit(popup)}
                      title="Chỉnh sửa Popup"
                    >
                      <Edit3 className="w-4 h-4 text-amber-500" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDelete(popup.id)}
                      title="Xóa Popup"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit / Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              {editingPopup ? 'Chỉnh sửa Popup Quảng cáo' : 'Tạo Popup Quảng cáo Mới'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Tiêu đề Popup (*)</Label>
              <Input
                placeholder="VD: Siêu Sale Khóa học N3 JLPT - Giảm tới 65%"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Mô tả phụ (Tùy chọn)</Label>
              <Textarea
                rows={2}
                placeholder="Mô tả ngắn gọn thu hút học viên click..."
                value={form.description || ''}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Image URL & Picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Ảnh Banner Popup (*)</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="https://..."
                  value={form.image_url}
                  onChange={e => setForm({ ...form, image_url: e.target.value })}
                />
                <Button variant="outline" onClick={() => setMediaLibraryOpen(true)} className="shrink-0 gap-1.5">
                  <ImageIcon className="w-4 h-4" /> Thư viện ảnh
                </Button>
              </div>

              {form.image_url && (
                <div className="mt-2 relative h-32 w-full max-w-sm rounded-xl overflow-hidden border bg-muted">
                  <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Target Link */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Link Trỏ Tới khi Click Banner</Label>
              <Input
                placeholder="VD: /store hoặc https://riki.edu.vn/khoa-hoc-n5"
                value={form.target_link || ''}
                onChange={e => setForm({ ...form, target_link: e.target.value })}
              />
            </div>

            {/* Dimensions PC & Mobile */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/30 border">
              <div className="space-y-2">
                <Label className="text-xs font-bold flex items-center gap-1.5 text-blue-600">
                  <Monitor className="w-4 h-4" /> Kích thước trên PC (Desktop)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Rộng (px):</span>
                    <Input
                      type="number"
                      value={form.pc_width_px}
                      onChange={e => setForm({ ...form, pc_width_px: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Cao (px):</span>
                    <Input
                      type="number"
                      value={form.pc_height_px}
                      onChange={e => setForm({ ...form, pc_height_px: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold flex items-center gap-1.5 text-purple-600">
                  <Smartphone className="w-4 h-4" /> Kích thước trên Mobile
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Rộng (px):</span>
                    <Input
                      type="number"
                      value={form.mobile_width_px}
                      onChange={e => setForm({ ...form, mobile_width_px: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Cao (px):</span>
                    <Input
                      type="number"
                      value={form.mobile_height_px}
                      onChange={e => setForm({ ...form, mobile_height_px: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Frequency & Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Tần suất xuất hiện</Label>
                <Select
                  value={form.display_frequency}
                  onValueChange={(val: any) => setForm({ ...form, display_frequency: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first_visit">🔥 Chỉ lần đầu vào Website (Session)</SelectItem>
                    <SelectItem value="session">🌐 Mỗi phiên trình duyệt</SelectItem>
                    <SelectItem value="once_a_day">📅 1 lần / Ngày</SelectItem>
                    <SelectItem value="always">⚡ Mỗi lần load trang (Luôn luôn)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Thứ tự ưu tiên Carousel</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.order_index}
                  onChange={e => setForm({ ...form, order_index: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Thời gian bắt đầu hiển thị</Label>
                <Input
                  type="datetime-local"
                  value={form.start_at || ''}
                  onChange={e => setForm({ ...form, start_at: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Thời gian kết thúc (Tùy chọn)</Label>
                <Input
                  type="datetime-local"
                  value={form.end_at || ''}
                  onChange={e => setForm({ ...form, end_at: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={val => setForm({ ...form, is_active: val })}
              />
              <Label className="font-bold cursor-pointer">Bật trạng thái hoạt động của Popup này</Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button variant="secondary" onClick={() => { setPreviewDevice('pc'); setPreviewOpen(true); }} className="gap-1.5">
              <Eye className="w-4 h-4" /> Xem trước Live
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu Popup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Library */}
      <MediaLibraryDialog
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        onSelectMedia={(url) => {
          setForm({ ...form, image_url: url });
          setMediaLibraryOpen(false);
        }}
      />

      {/* Live Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl p-6 bg-black/90 text-white border-white/20">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" /> Preview Popup Live - {form.title}
              </DialogTitle>

              <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl">
                <Button 
                  size="sm" 
                  variant={previewDevice === 'pc' ? 'default' : 'ghost'} 
                  onClick={() => setPreviewDevice('pc')}
                  className="h-7 text-xs gap-1"
                >
                  <Monitor className="w-3.5 h-3.5" /> PC Desktop
                </Button>
                <Button 
                  size="sm" 
                  variant={previewDevice === 'mobile' ? 'default' : 'ghost'} 
                  onClick={() => setPreviewDevice('mobile')}
                  className="h-7 text-xs gap-1"
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Simulated Screen */}
          <div className="flex justify-center items-center py-8 min-h-[500px]">
            <div 
              style={{
                width: previewDevice === 'pc' ? `${form.pc_width_px || 520}px` : `${form.mobile_width_px || 340}px`,
                maxHeight: previewDevice === 'pc' ? `${form.pc_height_px || 620}px` : `${form.mobile_height_px || 450}px`,
              }}
              className="relative bg-gradient-to-b from-amber-400 via-orange-500 to-red-500 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 flex flex-col justify-between p-4 transition-all duration-300 group cursor-pointer"
            >
              <img 
                src={form.image_url} 
                alt={form.title}
                className="absolute inset-0 w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white border border-white/30 flex items-center justify-center font-bold z-20 hover:bg-black">
                ✕
              </button>

              <div className="relative z-10 text-white mt-auto space-y-2">
                <h3 className="text-xl font-extrabold text-shadow-md">{form.title}</h3>
                {form.description && <p className="text-xs text-white/90">{form.description}</p>}
                
                <div className="pt-2">
                  <a
                    href={form.target_link || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-extrabold text-xs shadow-xl uppercase tracking-wider hover:scale-105 transition-transform"
                  >
                    Đăng Ký Ngay 👉
                  </a>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPopups;

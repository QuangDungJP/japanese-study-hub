import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import MediaLibraryDialog from '@/components/admin/MediaLibraryDialog';
import { 
  ShoppingBag, Music, Disc, Star, Flame, Zap, Plus, Edit, Trash2, 
  Search, CheckCircle2, RefreshCw, Loader2, Image, Upload, Shield, FolderOpen, Gift
} from 'lucide-react';

export interface StoreItemAdmin {
  id: string;
  code: string;
  title_vi: string;
  description_vi?: string | null;
  category: 'music' | 'theme' | 'avatar_frame' | 'study_boost' | 'badge' | 'physical_gift';
  price_vnd: number;
  price_jpy: number;
  price_xp: number;
  req_streak: number;
  cover_image?: string | null;
  audio_url?: string | null;
  is_active: boolean;
  is_featured: boolean;
}

export interface MusicTrackAdmin {
  id: string;
  title: string;
  artist: string;
  cover_image?: string | null;
  audio_url: string;
  duration_seconds: number;
  is_free: boolean;
  price_xp: number;
  is_active: boolean;
}

const emptyItem: Partial<StoreItemAdmin> = {
  code: '', title_vi: '', description_vi: '', category: 'music',
  price_vnd: 0, price_jpy: 0, price_xp: 100, req_streak: 0,
  cover_image: '', audio_url: '', is_active: true, is_featured: false,
};

const emptyTrack: Partial<MusicTrackAdmin> = {
  title: '', artist: 'TNQDO Sound', cover_image: '', audio_url: '',
  duration_seconds: 180, is_free: true, price_xp: 0, is_active: true,
};

export default function AdminStore() {
  const { toast } = useToast();
  const [items, setItems] = useState<StoreItemAdmin[]>([]);
  const [tracks, setTracks] = useState<MusicTrackAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Store System Settings State (Show / Hide Store)
  const [isStoreEnabled, setIsStoreEnabled] = useState(false);
  const [storeSettingsSaving, setStoreSettingsSaving] = useState(false);

  // Item Modal State
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<StoreItemAdmin>>(emptyItem);

  // Track Modal State
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Partial<MusicTrackAdmin>>(emptyTrack);

  // Media Library Dialog State
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'item_cover' | 'item_audio' | 'track_cover' | 'track_audio'>('item_cover');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Gift Item State
  const [giftItemCode, setGiftItemCode] = useState('');
  const [giftUserEmail, setGiftUserEmail] = useState('');
  const [giftSending, setGiftSending] = useState(false);

  const handleSendGift = async () => {
    if (!giftItemCode || !giftUserEmail) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng chọn vật phẩm và nhập Email học viên', variant: 'destructive' });
      return;
    }

    setGiftSending(true);
    try {
      // Find user by email from profiles / auth
      const { data: prof } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', giftUserEmail.trim())
        .maybeSingle();

      if (!prof) {
        toast({ title: 'Không tìm thấy học viên', description: `Không tìm thấy tài khoản với email ${giftUserEmail}`, variant: 'destructive' });
        return;
      }

      // Find item_id from store_items
      const itemObj = items.find(i => i.code === giftItemCode);

      // Insert into user_inventory
      const { error } = await (supabase as any).from('user_inventory').insert({
        user_id: prof.id,
        item_id: itemObj?.id,
        item_code: giftItemCode,
        purchased_with: 'system_gift',
        amount_paid: 0,
      });

      if (error) throw error;

      toast({
        title: '🎁 Gửi tặng quà thành công!',
        description: `Đã tặng ${itemObj?.title_vi || giftItemCode} cho học viên ${prof.full_name || giftUserEmail}`,
      });
      setGiftUserEmail('');
    } catch (err: any) {
      toast({ title: 'Lỗi tặng quà', description: err.message, variant: 'destructive' });
    } finally {
      setGiftSending(false);
    }
  };

  const handleDirectFileUpload = async (file: File, target: 'item_cover' | 'item_audio' | 'track_cover' | 'track_audio') => {
    setUploadingFile(true);
    try {
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      const path = `store/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('lesson-assets').upload(path, file);
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('lesson-assets').getPublicUrl(path);

      if (target === 'item_cover') setEditingItem(prev => ({ ...prev, cover_image: publicUrl }));
      if (target === 'item_audio') setEditingItem(prev => ({ ...prev, audio_url: publicUrl }));
      if (target === 'track_cover') setEditingTrack(prev => ({ ...prev, cover_image: publicUrl }));
      if (target === 'track_audio') setEditingTrack(prev => ({ ...prev, audio_url: publicUrl }));

      toast({ title: '✅ Đã tải file lên thành công' });
    } catch (err: any) {
      toast({ title: 'Lỗi tải file', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSelectMediaUrl = (url: string) => {
    if (mediaPickerTarget === 'item_cover') setEditingItem(prev => ({ ...prev, cover_image: url }));
    if (mediaPickerTarget === 'item_audio') setEditingItem(prev => ({ ...prev, audio_url: url }));
    if (mediaPickerTarget === 'track_cover') setEditingTrack(prev => ({ ...prev, cover_image: url }));
    if (mediaPickerTarget === 'track_audio') setEditingTrack(prev => ({ ...prev, audio_url: url }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch store items
      const { data: itemData } = await (supabase as any).from('store_items').select('*').order('created_at', { ascending: false });
      setItems((itemData || []) as StoreItemAdmin[]);

      // 2. Fetch music tracks
      const { data: trackData } = await (supabase as any).from('music_tracks').select('*').order('created_at', { ascending: false });
      setTracks((trackData || []) as MusicTrackAdmin[]);

      // 3. Fetch store system settings (is_store_enabled)
      const { data: sett } = await supabase
        .from('website_content')
        .select('content')
        .eq('section_key', 'store_system_settings')
        .maybeSingle();

      if (sett?.content) {
        setIsStoreEnabled(Boolean((sett.content as any).is_store_enabled));
      }
    } catch (err) {
      console.error('Error fetching admin store data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveStoreSettings = async (enabledState: boolean) => {
    setStoreSettingsSaving(true);
    try {
      const { data: existing } = await supabase
        .from('website_content')
        .select('id')
        .eq('section_key', 'store_system_settings')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('website_content')
          .update({ content: { is_store_enabled: enabledState } as any, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('website_content').insert({
          section_key: 'store_system_settings',
          title: 'Store System Settings',
          content: { is_store_enabled: enabledState } as any,
          is_active: true,
        });
      }
      setIsStoreEnabled(enabledState);
      toast({ title: enabledState ? '✅ Đã BẬT Cửa Hàng Hệ Thống' : '🔒 Đã TẮT Cửa Hàng (Ẩn trên giao diện)' });
    } catch (err: any) {
      toast({ title: 'Lỗi cập nhật cấu hình cửa hàng', description: err.message, variant: 'destructive' });
    } finally {
      setStoreSettingsSaving(false);
    }
  };

  const handleSaveItem = async () => {
    if (!editingItem.code || !editingItem.title_vi) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng nhập Mã vật phẩm và Tên vật phẩm', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (editingItem.id) {
        await (supabase as any).from('store_items').update(editingItem).eq('id', editingItem.id);
      } else {
        await (supabase as any).from('store_items').insert(editingItem);
      }
      toast({ title: '✅ Đã lưu thông tin vật phẩm' });
      setItemDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Lỗi lưu vật phẩm', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vật phẩm này không?')) return;
    await (supabase as any).from('store_items').delete().eq('id', id);
    toast({ title: 'Đã xóa vật phẩm' });
    fetchData();
  };

  const handleSaveTrack = async () => {
    if (!editingTrack.title || !editingTrack.audio_url) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng nhập Tên bài nhạc và URL Audio MP3', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (editingTrack.id) {
        await (supabase as any).from('music_tracks').update(editingTrack).eq('id', editingTrack.id);
      } else {
        await (supabase as any).from('music_tracks').insert(editingTrack);
      }
      toast({ title: '✅ Đã lưu bài nhạc học tập' });
      setTrackDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Lỗi lưu bài nhạc', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài nhạc này không?')) return;
    await (supabase as any).from('music_tracks').delete().eq('id', id);
    toast({ title: 'Đã xóa bài nhạc' });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />
          <span>Quản Lý Cửa Hàng &amp; Nhạc</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Cấu hình bật/tắt Cửa hàng, quản lý vật phẩm bán bằng VNĐ/XP/Streak &amp; nhạc nền học tập
        </p>
      </div>

      <Button variant="outline" onClick={fetchData} size="sm" className="gap-2 self-end sm:self-auto">
        <RefreshCw className="w-4 h-4" /> Làm mới
      </Button>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full justify-start">
          <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm font-bold flex-1 sm:flex-none">
            <Shield className="w-3.5 h-3.5 text-primary" /> <span className="hidden sm:inline">Bật/Tắt</span> Cửa Hàng
          </TabsTrigger>
          <TabsTrigger value="items" className="gap-1.5 text-xs sm:text-sm flex-1 sm:flex-none">
            <ShoppingBag className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Vật phẩm</span> ({items.length})
          </TabsTrigger>
          <TabsTrigger value="music" className="gap-1.5 text-xs sm:text-sm flex-1 sm:flex-none">
            <Music className="w-3.5 h-3.5 text-amber-500" /> <span className="hidden xs:inline">Kho Nhạc</span> ({tracks.length})
          </TabsTrigger>
          <TabsTrigger value="gift" className="gap-1.5 text-xs sm:text-sm font-bold flex-1 sm:flex-none">
            <Gift className="w-3.5 h-3.5 text-purple-500" /> <span className="hidden sm:inline">🎁 Tặng Vật Phẩm</span><span className="sm:hidden">🎁</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Show/Hide Settings */}
        <TabsContent value="settings">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" /> Cấu hình Trạng thái Cửa Hàng Hệ Thống
              </CardTitle>
              <CardDescription>
                Bật hoặc Tắt Cửa hàng trên giao diện của Học viên & Giáo viên. Khi TẮT, icon 🛒 Cửa hàng sẽ tự động ẩn hoàn toàn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl border bg-card">
                <div className="space-y-1">
                  <div className="font-bold text-sm flex items-center gap-2">
                    Trạng thái Cửa Hàng (/store):
                    <Badge variant={isStoreEnabled ? 'default' : 'secondary'} className={isStoreEnabled ? 'bg-emerald-500 text-white' : ''}>
                      {isStoreEnabled ? '🟢 ĐANG BẬT (Hiển thị)' : '🔴 ĐANG TẮT (Đã ẩn)'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Giao diện Cửa hàng bán các vật phẩm khung avatar, nhạc Lo-Fi, bài học boost đổi bằng XP & VNĐ.
                  </p>
                </div>

                <Switch
                  checked={isStoreEnabled}
                  disabled={storeSettingsSaving}
                  onCheckedChange={(val) => saveStoreSettings(val)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Store Items */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">Danh mục vật phẩm cửa hàng</h3>
            <Button onClick={() => { setEditingItem(emptyItem); setItemDialogOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Thêm vật phẩm mới
            </Button>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vật phẩm</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Giá XP / VNĐ</TableHead>
                    <TableHead>Yêu cầu Streak</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-bold">
                        <div className="flex items-center gap-2">
                          {it.cover_image && <img src={it.cover_image} className="w-8 h-8 rounded object-cover" />}
                          <div>
                            <p>{it.title_vi}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{it.code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{it.category}</Badge></TableCell>
                      <TableCell>
                        <span className="text-amber-500 font-bold font-mono">{it.price_xp} XP</span>
                        {it.price_vnd > 0 && <span className="text-xs text-emerald-600 block">{it.price_vnd.toLocaleString()} đ</span>}
                      </TableCell>
                      <TableCell>{it.req_streak > 0 ? `${it.req_streak} ngày` : 'Không'}</TableCell>
                      <TableCell>
                        <Badge className={it.is_active ? 'bg-emerald-500' : 'bg-muted'}>{it.is_active ? 'Bật' : 'Ẩn'}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingItem(it); setItemDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-rose-500" onClick={() => handleDeleteItem(it.id)}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Music Tracks */}
        <TabsContent value="music" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">Kho nhạc học tập phát ngầm (Spotify Style)</h3>
            <Button onClick={() => { setEditingTrack(emptyTrack); setTrackDialogOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Thêm bài nhạc mới
            </Button>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên bài nhạc</TableHead>
                    <TableHead>Nghệ sĩ / Thể loại</TableHead>
                    <TableHead>Quyền truy cập</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tracks.map((tr) => (
                    <TableRow key={tr.id}>
                      <TableCell className="font-bold flex items-center gap-2">
                        <Disc className="w-4 h-4 text-amber-500" /> {tr.title}
                      </TableCell>
                      <TableCell>{tr.artist}</TableCell>
                      <TableCell>
                        {tr.is_free ? (
                          <Badge className="bg-emerald-500 text-white">Miễn phí</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">{tr.price_xp} XP</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingTrack(tr); setTrackDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-rose-500" onClick={() => handleDeleteTrack(tr.id)}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Gift Item to Student */}
        <TabsContent value="gift" className="space-y-4">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-500" /> Tặng Vật Phẩm Trực Tiếp Cho Học Viên / Sự Kiện
              </CardTitle>
              <CardDescription>
                Gửi tặng sách giáo trình, khung avatar 3D hoặc thẻ boost XP trực tiếp vào Kho đồ cá nhân của học viên.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div className="space-y-1 text-xs">
                <Label className="font-bold">Chọn vật phẩm tặng *</Label>
                <Select value={giftItemCode} onValueChange={setGiftItemCode}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="-- Chọn vật phẩm --" /></SelectTrigger>
                  <SelectContent>
                    {items.map(it => (
                      <SelectItem key={it.id} value={it.code}>
                        {it.title_vi} ({it.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 text-xs">
                <Label className="font-bold">Email Học viên nhận quà *</Label>
                <Input
                  value={giftUserEmail}
                  onChange={(e) => setGiftUserEmail(e.target.value)}
                  placeholder="VD: hocvien@gmail.com"
                  className="h-10"
                />
              </div>

              <Button onClick={handleSendGift} disabled={giftSending} className="w-full font-bold gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                {giftSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                {giftSending ? 'Đang gửi tặng...' : 'Gửi Tặng Quà Ngay'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* EDIT ITEM DIALOG */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingItem.id ? 'Sửa vật phẩm' : 'Tạo vật phẩm mới'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>Mã vật phẩm (Code duy nhất)</Label>
              <Input value={editingItem.code || ''} onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })} placeholder="VD: book_mimikara_n5" />
            </div>
            <div className="space-y-1">
              <Label>Tên vật phẩm (Tiếng Việt)</Label>
              <Input value={editingItem.title_vi || ''} onChange={(e) => setEditingItem({ ...editingItem, title_vi: e.target.value })} placeholder="VD: Bộ Sách Giáo Trình JLPT N5" />
            </div>
            <div className="space-y-1">
              <Label>Danh mục (Chọn hoặc Tự nhập mới)</Label>
              <Input
                value={editingItem.category || ''}
                onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as any })}
                placeholder="VD: Sách Giáo Trình, Thẻ Flashcards, Khung Avatar..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Giá XP</Label>
                <Input type="number" value={editingItem.price_xp} onChange={(e) => setEditingItem({ ...editingItem, price_xp: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Giá VNĐ</Label>
                <Input type="number" value={editingItem.price_vnd} onChange={(e) => setEditingItem({ ...editingItem, price_vnd: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="font-semibold flex items-center justify-between">
                <span>Ảnh Bìa Vật Phẩm</span>
                <span className="text-[10px] text-muted-foreground">URL / Upload / Thư viện</span>
              </Label>
              <div className="flex gap-1.5">
                <Input value={editingItem.cover_image || ''} onChange={(e) => setEditingItem({ ...editingItem, cover_image: e.target.value })} placeholder="https://..." className="flex-1" />
                <input
                  type="file" accept="image/*" className="hidden" id="item-cover-upload"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDirectFileUpload(f, 'item_cover'); }}
                />
                <Button type="button" variant="outline" size="sm" className="h-9 text-[11px] gap-1 shrink-0" onClick={() => document.getElementById('item-cover-upload')?.click()} disabled={uploadingFile}>
                  <Upload className="w-3 h-3" /> Upload
                </Button>
                <Button type="button" variant="secondary" size="sm" className="h-9 text-[11px] gap-1 shrink-0" onClick={() => { setMediaPickerTarget('item_cover'); setMediaPickerOpen(true); }}>
                  <FolderOpen className="w-3 h-3 text-amber-500" /> Thư viện
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="font-semibold flex items-center justify-between">
                <span>URL Audio MP3 (nếu bán nhạc)</span>
              </Label>
              <div className="flex gap-1.5">
                <Input value={editingItem.audio_url || ''} onChange={(e) => setEditingItem({ ...editingItem, audio_url: e.target.value })} placeholder="https://..." className="flex-1" />
                <input
                  type="file" accept="audio/*" className="hidden" id="item-audio-upload"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDirectFileUpload(f, 'item_audio'); }}
                />
                <Button type="button" variant="outline" size="sm" className="h-9 text-[11px] gap-1 shrink-0" onClick={() => document.getElementById('item-audio-upload')?.click()} disabled={uploadingFile}>
                  <Upload className="w-3 h-3" /> Upload MP3
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveItem} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu vật phẩm'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT TRACK DIALOG */}
      <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingTrack.id ? 'Sửa bài nhạc' : 'Thêm bài nhạc mới'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>Tên bài nhạc *</Label>
              <Input value={editingTrack.title || ''} onChange={(e) => setEditingTrack({ ...editingTrack, title: e.target.value })} placeholder="VD: Sakura Rain Lo-Fi" />
            </div>
            <div className="space-y-1">
              <Label>Nghệ sĩ / Thể loại</Label>
              <Input value={editingTrack.artist || ''} onChange={(e) => setEditingTrack({ ...editingTrack, artist: e.target.value })} placeholder="VD: TNQDO Relaxing Chill" />
            </div>
            <div className="space-y-1">
              <Label className="font-semibold">URL Audio MP3 *</Label>
              <div className="flex gap-1.5">
                <Input value={editingTrack.audio_url || ''} onChange={(e) => setEditingTrack({ ...editingTrack, audio_url: e.target.value })} placeholder="https://..." className="flex-1" />
                <input
                  type="file" accept="audio/*" className="hidden" id="track-audio-upload"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDirectFileUpload(f, 'track_audio'); }}
                />
                <Button type="button" variant="outline" size="sm" className="h-9 text-[11px] gap-1 shrink-0" onClick={() => document.getElementById('track-audio-upload')?.click()} disabled={uploadingFile}>
                  <Upload className="w-3 h-3" /> Upload MP3
                </Button>
                <Button type="button" variant="secondary" size="sm" className="h-9 text-[11px] gap-1 shrink-0" onClick={() => { setMediaPickerTarget('track_audio'); setMediaPickerOpen(true); }}>
                  <FolderOpen className="w-3 h-3 text-amber-500" /> Thư viện
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="font-semibold">URL Ảnh Bìa Album</Label>
              <div className="flex gap-1.5">
                <Input value={editingTrack.cover_image || ''} onChange={(e) => setEditingTrack({ ...editingTrack, cover_image: e.target.value })} placeholder="https://..." className="flex-1" />
                <input
                  type="file" accept="image/*" className="hidden" id="track-cover-upload"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDirectFileUpload(f, 'track_cover'); }}
                />
                <Button type="button" variant="outline" size="sm" className="h-9 text-[11px] gap-1 shrink-0" onClick={() => document.getElementById('track-cover-upload')?.click()} disabled={uploadingFile}>
                  <Upload className="w-3 h-3" /> Upload
                </Button>
                <Button type="button" variant="secondary" size="sm" className="h-9 text-[11px] gap-1 shrink-0" onClick={() => { setMediaPickerTarget('track_cover'); setMediaPickerOpen(true); }}>
                  <FolderOpen className="w-3 h-3 text-amber-500" /> Thư viện
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label>Miễn phí phát ngầm cho tất cả học viên?</Label>
              <Switch checked={editingTrack.is_free} onCheckedChange={(val) => setEditingTrack({ ...editingTrack, is_free: val })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveTrack} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu bài nhạc'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Centralized Media Asset Library Dialog */}
      <MediaLibraryDialog
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelectUrl={handleSelectMediaUrl}
        fileType={mediaPickerTarget.includes('audio') ? 'audio' : 'image'}
      />
    </div>
  );
}

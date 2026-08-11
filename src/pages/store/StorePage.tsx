import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  ShoppingBag, Star, Flame, CheckCircle2,
  Music, Frame, Palette, Gift, Zap, Search, ChevronDown, SlidersHorizontal,
} from 'lucide-react';
import BackgroundMusicPlayer from '@/components/shared/BackgroundMusicPlayer';
import UserInventoryShowcase from '@/components/shared/UserInventoryShowcase';

export interface StoreItem {
  id: string;
  code: string;
  title_vi: string;
  description_vi?: string | null;
  category: string;
  price_vnd: number;
  price_jpy: number;
  price_xp: number;
  req_streak: number;
  cover_image?: string | null;
  audio_url?: string | null;
  is_active: boolean;
  is_featured: boolean;
}

const CATEGORY_META: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  all:            { label: 'Tất cả',           emoji: '🌐', color: 'text-primary',      bg: 'bg-primary/10' },
  music:          { label: 'Nhạc Học Tập',     emoji: '🎵', color: 'text-amber-600',    bg: 'bg-amber-500/10' },
  avatar_frame:   { label: 'Khung Avatar',     emoji: '🖼️', color: 'text-purple-600',   bg: 'bg-purple-500/10' },
  profile_banner: { label: 'Ảnh Bìa Cá Nhân',  emoji: '🎨', color: 'text-blue-600',     bg: 'bg-blue-500/10' },
  study_boost:    { label: 'Học Tập Boost',    emoji: '⚡', color: 'text-emerald-600',  bg: 'bg-emerald-500/10' },
};

function getCatMeta(key: string) {
  return CATEGORY_META[key] ?? { label: key, emoji: '📦', color: 'text-muted-foreground', bg: 'bg-muted' };
}

// ─── StoreContent — thuần nội dung, dùng trong mọi layout ───────────────────
export function StoreContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [ownedItemCodes, setOwnedItemCodes] = useState<Set<string>>(new Set());
  const [userXp, setUserXp] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [purchasingItem, setPurchasingItem] = useState<StoreItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => { fetchStoreData(); }, [user]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const { data: storeData } = await (supabase as any)
        .from('store_items')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      setItems((storeData || []) as StoreItem[]);

      if (user) {
        const { data: invData } = await (supabase as any)
          .from('user_inventory')
          .select('item_code')
          .eq('user_id', user.id);

        if (invData) setOwnedItemCodes(new Set((invData as any[]).map((i: any) => i.item_code)));

        const { data: prog } = await (supabase as any)
          .from('user_progress')
          .select('total_xp, streak')
          .eq('user_id', user.id)
          .maybeSingle();

        if (prog) { setUserXp((prog as any).total_xp || 0); setUserStreak((prog as any).streak || 0); }
      }
    } catch (err) {
      console.error('Error fetching store data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyXp = async (item: StoreItem) => {
    if (!user) { toast({ title: 'Vui lòng đăng nhập', variant: 'destructive' }); return; }
    if (ownedItemCodes.has(item.code)) { toast({ title: 'Đã sở hữu' }); return; }
    if (userXp < item.price_xp) {
      toast({ title: 'Không đủ XP', description: `Cần thêm ${item.price_xp - userXp} XP`, variant: 'destructive' });
      return;
    }
    if (userStreak < item.req_streak) {
      toast({ title: 'Chưa đủ Streak', description: `Yêu cầu ${item.req_streak} ngày Streak`, variant: 'destructive' });
      return;
    }

    setPurchasing(true);
    try {
      const newXp = userXp - item.price_xp;
      await (supabase as any).from('user_progress')
        .update({ total_xp: newXp, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      await (supabase as any).from('user_inventory').insert({
        user_id: user.id,
        item_id: item.id,
        item_code: item.code,
        purchased_with: 'xp',
        amount_paid: item.price_xp,
      });

      if (item.category === 'music' && item.audio_url) {
        await (supabase as any).from('music_tracks').insert({
          title: item.title_vi,
          artist: 'Cửa hàng TNQDO',
          cover_image: item.cover_image,
          audio_url: item.audio_url,
          is_free: false,
          price_xp: item.price_xp,
          associated_item_code: item.code,
        });
      }

      setUserXp(newXp);
      setOwnedItemCodes(prev => new Set(prev).add(item.code));
      setPurchasingItem(null);
      toast({ title: '🎉 Mua thành công!', description: `Đã mở khóa ${item.title_vi}` });
    } catch (err: any) {
      toast({ title: 'Lỗi mua hàng', description: err.message, variant: 'destructive' });
    } finally {
      setPurchasing(false);
    }
  };

  // Unique categories from actual data
  const uniqueCategories = ['all', ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))];

  const filteredItems = items.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchTerm.toLowerCase();
    const matchesSearch = item.title_vi.toLowerCase().includes(q) || (item.description_vi || '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const activeMeta = getCatMeta(selectedCategory);
  const filteredCount = filteredItems.length;

  return (
    <div className="pb-10 space-y-6">

      {/* ── Hero Banner ── */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 text-white p-7 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 w-40 h-40 bg-orange-600/30 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 text-xs font-bold backdrop-blur-md border border-white/20">
              <ShoppingBag className="w-3.5 h-3.5 text-yellow-200" />
              Cửa Hàng Vật Phẩm & Nhạc Học Tập
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow">
              Cửa Hàng TNQDO<br className="hidden md:block" /> Japanese Hub
            </h1>
            <p className="text-white/85 text-sm max-w-md leading-relaxed">
              Đổi điểm XP, chuỗi Streak hoặc VNĐ/Yên để mở khóa nhạc Lo-Fi, khung avatar và vật phẩm độc quyền.
            </p>
          </div>

          {user && (
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              {/* XP wallet */}
              <div className="flex items-center gap-3 bg-black/25 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
                <div className="w-9 h-9 rounded-xl bg-amber-400/30 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">Số dư XP</p>
                  <p className="text-xl font-black text-white leading-none">{userXp.toLocaleString()}</p>
                </div>
              </div>
              {/* Streak */}
              <div className="flex items-center gap-3 bg-black/25 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
                <div className="w-9 h-9 rounded-xl bg-orange-500/30 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-300 fill-orange-300" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold">Streak</p>
                  <p className="text-xl font-black text-white leading-none">{userStreak} ngày</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Inventory Showcase ── */}
      {user && <UserInventoryShowcase userId={user.id} />}

      {/* ── Compact Filter + Search Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card/80 backdrop-blur-sm border rounded-2xl px-4 py-3 shadow-sm">

        {/* Category Dropdown — gọn thay cho row button dài */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 font-bold text-sm rounded-xl border-dashed min-w-[180px] justify-between"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <span>{activeMeta.emoji} {activeMeta.label}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 rounded-2xl p-2 shadow-xl">
            <DropdownMenuRadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
              {uniqueCategories.map(catKey => {
                const meta = getCatMeta(catKey);
                return (
                  <DropdownMenuRadioItem
                    key={catKey}
                    value={catKey}
                    className="rounded-xl cursor-pointer font-medium text-sm gap-2 px-3 py-2"
                  >
                    <span>{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick pill shortcuts (top 4 only) */}
        <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
          {uniqueCategories.slice(0, 5).map(catKey => {
            const meta = getCatMeta(catKey);
            const active = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Result count badge */}
        <Badge variant="secondary" className="hidden sm:flex text-xs font-bold px-3 py-1.5 rounded-xl shrink-0">
          {filteredCount} vật phẩm
        </Badge>

        {/* Search */}
        <div className="relative w-full sm:w-56">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm vật phẩm..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* ── Items Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-muted animate-pulse aspect-[4/5]" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-bold text-base text-foreground">Không có vật phẩm nào</p>
            <p className="text-xs text-muted-foreground mt-1">Thử đổi danh mục hoặc từ khóa tìm kiếm</p>
          </div>
          {selectedCategory !== 'all' && (
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setSelectedCategory('all')}>
              Xem tất cả vật phẩm
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredItems.map(item => {
            const isOwned = ownedItemCodes.has(item.code);
            const meta = getCatMeta(item.category);
            const canAfford = userXp >= item.price_xp;

            return (
              <Card
                key={item.id}
                className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden flex flex-col group cursor-default ${
                  isOwned
                    ? 'border-emerald-400/50 bg-emerald-50/40 dark:bg-emerald-900/10'
                    : 'border-border hover:border-primary/40 hover:shadow-xl hover:-translate-y-1'
                }`}
              >
                {/* Cover */}
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  {item.cover_image ? (
                    <img
                      src={item.cover_image}
                      alt={item.title_vi}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400/20 via-primary/10 to-purple-500/20 flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-primary/40" />
                    </div>
                  )}

                  {/* Badges overlay */}
                  <div className="absolute inset-x-2 top-2 flex items-start justify-between">
                    {item.is_featured && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-bold text-[10px] shadow-md">
                        🔥 Nổi bật
                      </Badge>
                    )}
                    {isOwned && (
                      <Badge className="ml-auto bg-emerald-500 text-white font-bold text-[10px] gap-1 shadow-md">
                        <CheckCircle2 className="w-3 h-3" /> Đã sở hữu
                      </Badge>
                    )}
                  </div>

                  {/* Gradient fade bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Content */}
                <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${meta.bg} ${meta.color}`}>
                      {meta.emoji} {meta.label}
                    </span>
                    <h3 className="font-extrabold text-sm leading-snug line-clamp-2 text-foreground">{item.title_vi}</h3>
                    <p className="text-muted-foreground text-[11px] line-clamp-2 leading-relaxed">
                      {item.description_vi || 'Vật phẩm độc quyền trên TNQDO Japanese Hub'}
                    </p>
                  </div>

                  {/* Price row */}
                  <div className="space-y-2.5 pt-2 border-t border-dashed">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {item.price_xp > 0 && (
                        <span className={`flex items-center gap-1 font-mono text-sm font-black ${canAfford || isOwned ? 'text-amber-500' : 'text-rose-500'}`}>
                          <Star className="w-3.5 h-3.5 fill-current" /> {item.price_xp.toLocaleString()}
                        </span>
                      )}
                      {item.price_vnd > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                          {item.price_vnd.toLocaleString()}đ
                        </span>
                      )}
                      {item.price_jpy > 0 && (
                        <span className="text-rose-500 font-mono text-[11px] font-bold">¥{item.price_jpy}</span>
                      )}
                    </div>

                    {item.req_streak > 0 && (
                      <p className="text-[10px] text-orange-500 font-semibold flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Yêu cầu Streak {item.req_streak} ngày
                      </p>
                    )}

                    {isOwned ? (
                      <Button disabled size="sm" variant="outline"
                        className="w-full text-xs font-bold gap-1.5 text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã Mở Khóa
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setPurchasingItem(item)}
                        className="w-full text-xs font-bold gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-md transition-transform active:scale-95"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Mua Ngay
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Purchase Dialog ── */}
      <Dialog open={!!purchasingItem} onOpenChange={() => setPurchasingItem(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          {purchasingItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-bold">
                  <ShoppingBag className="w-5 h-5 text-amber-500" /> Xác nhận mở khóa
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Dùng XP để mở khóa vật phẩm này không thể hoàn tác.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="flex items-center gap-3 p-3 rounded-2xl border bg-muted/40">
                  <img
                    src={purchasingItem.cover_image || ''}
                    alt={purchasingItem.title_vi}
                    className="w-14 h-14 rounded-xl object-cover border shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-sm">{purchasingItem.title_vi}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{purchasingItem.description_vi}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/30 border p-3 space-y-2 text-xs">
                  {purchasingItem.price_xp > 0 && (
                    <div className="flex justify-between font-bold">
                      <span className="text-muted-foreground">Giá XP</span>
                      <span className="text-amber-500 font-mono">{purchasingItem.price_xp.toLocaleString()} XP</span>
                    </div>
                  )}
                  {purchasingItem.price_vnd > 0 && (
                    <div className="flex justify-between font-bold">
                      <span className="text-muted-foreground">Giá VNĐ</span>
                      <span className="text-emerald-600 font-mono">{purchasingItem.price_vnd.toLocaleString()} đ</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 text-muted-foreground">
                    <span>Số dư hiện tại</span>
                    <span className="font-mono font-semibold">{userXp.toLocaleString()} XP</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Còn lại sau mua</span>
                    <span className={`font-mono font-bold ${userXp - purchasingItem.price_xp >= 0 ? 'text-primary' : 'text-rose-500'}`}>
                      {Math.max(0, userXp - purchasingItem.price_xp).toLocaleString()} XP
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setPurchasingItem(null)}>Hủy</Button>
                <Button
                  onClick={() => handleBuyXp(purchasingItem)}
                  disabled={purchasing || userXp < purchasingItem.price_xp}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                >
                  {purchasing ? 'Đang mở khóa...' : '🔓 Xác nhận mở khóa'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── StorePage — standalone với Navbar + Footer ───────────────────────────────
export default function StorePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 container mx-auto px-4">
        <StoreContent />
      </div>
      <BackgroundMusicPlayer />
      <Footer />
    </main>
  );
}

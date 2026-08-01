import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingBag, Sparkles, Star, Flame, Zap, CheckCircle2, Lock, 
  Music, Music2, Frame, Palette, Gift, Search, ArrowRight, Shield, Disc, Play, Package
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

const categoryLabels: Record<string, { label: string; icon: any; color: string }> = {
  all: { label: '🌐 Tất cả', icon: ShoppingBag, color: 'bg-primary/10 text-primary' },
  music: { label: '🎵 Nhạc Học Tập', icon: Music, color: 'bg-amber-500/10 text-amber-600' },
  avatar_frame: { label: '🖼️ Khung Avatar', icon: Frame, color: 'bg-purple-500/10 text-purple-600' },
  theme: { label: '🎨 Theme Giao diện', icon: Palette, color: 'bg-rose-500/10 text-rose-600' },
  study_boost: { label: '⚡ Thẻ Học Tập Boost', icon: Zap, color: 'bg-emerald-500/10 text-emerald-600' },
  physical_gift: { label: '🎁 Quà Tặng Vật Lý', icon: Gift, color: 'bg-blue-500/10 text-blue-600' },
};

export default function StorePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [ownedItemCodes, setOwnedItemCodes] = useState<Set<string>>(new Set());
  const [userXp, setUserXp] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Purchase Modal State
  const [purchasingItem, setPurchasingItem] = useState<StoreItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchStoreData();
  }, [user]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      // Fetch active store items
      const { data: storeData } = await supabase
        .from('store_items')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      setItems((storeData || []) as StoreItem[]);

      if (user) {
        // Fetch user inventory
        const { data: invData } = await supabase
          .from('user_inventory')
          .select('item_code')
          .eq('user_id', user.id);

        if (invData) {
          setOwnedItemCodes(new Set(invData.map(i => i.item_code)));
        }

        // Fetch user progress for XP and Streak
        const { data: prog } = await supabase
          .from('user_progress')
          .select('total_xp, streak')
          .eq('user_id', user.id)
          .maybeSingle();

        if (prog) {
          setUserXp(prog.total_xp || 0);
          setUserStreak(prog.streak || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching store data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyXp = async (item: StoreItem) => {
    if (!user) {
      toast({ title: 'Vui lòng đăng nhập', description: 'Bạn cần đăng nhập để mua vật phẩm', variant: 'destructive' });
      return;
    }

    if (ownedItemCodes.has(item.code)) {
      toast({ title: 'Đã sở hữu', description: 'Bạn đã mở khóa vật phẩm này rồi' });
      return;
    }

    if (userXp < item.price_xp) {
      toast({ title: 'Không đủ XP', description: `Bạn cần thêm ${item.price_xp - userXp} XP nữa để mua`, variant: 'destructive' });
      return;
    }

    if (userStreak < item.req_streak) {
      toast({ title: 'Chưa đủ Streak', description: `Vật phẩm yêu cầu chuỗi Streak ${item.req_streak} ngày`, variant: 'destructive' });
      return;
    }

    setPurchasing(true);
    try {
      // Deduct XP from user_progress
      const newXp = userXp - item.price_xp;
      await supabase
        .from('user_progress')
        .update({ total_xp: newXp, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      // Insert into inventory
      await supabase.from('user_inventory').insert({
        user_id: user.id,
        item_id: item.id,
        item_code: item.code,
        purchased_with: 'xp',
        amount_paid: item.price_xp,
      });

      // If item is a music track, also associate it with music_tracks table
      if (item.category === 'music' && item.audio_url) {
        await supabase.from('music_tracks').insert({
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

      toast({
        title: '🎉 Mua vật phẩm thành công!',
        description: `Đã mở khóa ${item.title_vi}. Đã trừ ${item.price_xp} XP.`,
      });
    } catch (err: any) {
      toast({ title: 'Lỗi mua hàng', description: err.message, variant: 'destructive' });
    } finally {
      setPurchasing(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title_vi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.description_vi || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-20 container mx-auto px-4 space-y-8">
        {/* Header Hero Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-md">
                <ShoppingBag className="w-4 h-4 text-yellow-200" /> Cửa Hàng Vật Phẩm & Nhạc Học Tập
              </div>
              <h1 className="text-3xl md:text-5xl font-black">Cửa Hàng TNQDO Japanese Hub</h1>
              <p className="text-white/90 text-sm md:text-base max-w-xl">
                Đổi điểm XP tích lũy, chuỗi Streak hoặc VNĐ/Yên để mở khóa nhạc Lo-Fi học tập, khung avatar và vật phẩm độc quyền!
              </p>
            </div>

            {/* Wallet Balance Display */}
            {user && (
              <div className="flex flex-col sm:flex-row gap-3 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/30 border border-amber-300/30">
                  <Star className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
                  <div>
                    <p className="text-[10px] uppercase text-white/70 font-semibold">Số dư XP</p>
                    <p className="text-lg font-black text-white leading-none">{userXp.toLocaleString()} XP</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/30 border border-orange-300/30">
                  <Flame className="w-5 h-5 text-orange-400 fill-orange-400" />
                  <div>
                    <p className="text-[10px] uppercase text-white/70 font-semibold">Chuỗi Streak</p>
                    <p className="text-lg font-black text-white leading-none">{userStreak} ngày</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Backpack / Inventory Showcase */}
        {user && (
          <UserInventoryShowcase userId={user.id} />
        )}

        {/* Filter Categories Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl border">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {(() => {
              const uniqueCategories = Array.from(new Set(items.map(i => i.category).filter(Boolean)));
              const allCategories = ['all', ...uniqueCategories];

              return allCategories.map((catKey) => {
                const isSelected = selectedCategory === catKey;
                const label = catKey === 'all' ? '🌐 Tất cả vật phẩm' : catKey;
                return (
                  <Button
                    key={catKey}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(catKey)}
                    className={`rounded-xl font-bold gap-1.5 shrink-0 text-xs ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {label}
                  </Button>
                );
              });
            })()}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Tìm vật phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">Đang tải vật phẩm cửa hàng...</div>
        ) : filteredItems.length === 0 ? (
          <Card className="py-16 text-center text-muted-foreground space-y-3">
            <CardContent>
              <ShoppingBag className="w-12 h-12 mx-auto opacity-30 mb-2" />
              <p className="font-bold text-base">Chưa có vật phẩm nào trong mục này.</p>
              <p className="text-xs">Vui lòng chọn danh mục khác hoặc quay lại sau.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredItems.map((item) => {
              const isOwned = ownedItemCodes.has(item.code);
              const catInfo = categoryLabels[item.category] || categoryLabels.all;
              const canAffordXp = userXp >= item.price_xp;
              const canAffordStreak = userStreak >= item.req_streak;

              return (
                <Card
                  key={item.id}
                  className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden flex flex-col justify-between group hover:-translate-y-1 ${
                    isOwned ? 'border-emerald-500/40 bg-emerald-500/5' : 'hover:border-primary/50 hover:shadow-lg'
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    {item.cover_image ? (
                      <img
                        src={item.cover_image}
                        alt={item.title_vi}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-500/20 via-primary/10 to-purple-500/20 flex items-center justify-center">
                        <ShoppingBag className="w-10 h-10 text-primary opacity-60" />
                      </div>
                    )}

                    {item.is_featured && (
                      <Badge className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-bold text-[10px]">
                        🔥 Nổi bật
                      </Badge>
                    )}

                    {isOwned && (
                      <Badge className="absolute top-2 right-2 bg-emerald-500 text-white font-bold text-[10px] gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã sở hữu
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
                    <div className="space-y-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${catInfo.color}`}>
                        {catInfo.label}
                      </span>
                      <h3 className="font-extrabold text-sm line-clamp-1 text-foreground">{item.title_vi}</h3>
                      <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.description_vi || 'Vật phẩm độc quyền trên TNQDO Japanese Hub'}
                      </p>
                    </div>

                    {/* Price Info */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex flex-wrap items-center justify-between gap-1 font-bold">
                        {item.price_xp > 0 && (
                          <span className="text-amber-500 font-mono text-sm flex items-center gap-1">
                            <Star className="w-4 h-4 fill-amber-500" /> {item.price_xp} XP
                          </span>
                        )}
                        {item.price_vnd > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                            {item.price_vnd.toLocaleString()} VNĐ
                          </span>
                        )}
                        {item.price_jpy > 0 && (
                          <span className="text-rose-500 font-mono text-xs">
                            ¥{item.price_jpy.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {item.req_streak > 0 && (
                        <p className="text-[10px] text-orange-500 font-semibold flex items-center gap-1">
                          <Flame className="w-3 h-3" /> Yêu cầu Streak {item.req_streak} ngày
                        </p>
                      )}

                      {/* Action Button */}
                      {isOwned ? (
                        <Button disabled size="sm" variant="outline" className="w-full text-xs font-bold gap-1 text-emerald-600 bg-emerald-50 border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã Mở Khóa
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setPurchasingItem(item)}
                          className="w-full text-xs font-bold gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-md"
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
      </div>

      {/* Confirm Purchase Modal */}
      {purchasingItem && (
        <Dialog open={!!purchasingItem} onOpenChange={() => setPurchasingItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                Xác nhận mở khóa vật phẩm
              </DialogTitle>
              <DialogDescription className="text-xs">
                Bạn có chắc chắn muốn dùng XP / tài khoản để mở khóa vật phẩm này không?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl border bg-muted/30">
                <img src={purchasingItem.cover_image || ''} alt={purchasingItem.title_vi} className="w-14 h-14 rounded-xl object-cover border shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-foreground">{purchasingItem.title_vi}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">{purchasingItem.description_vi}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t pt-3">
                {purchasingItem.price_xp > 0 && (
                  <div className="flex justify-between items-center font-bold">
                    <span>Giá điểm XP:</span>
                    <span className="text-amber-500 font-mono text-sm">{purchasingItem.price_xp} XP</span>
                  </div>
                )}
                {purchasingItem.price_vnd > 0 && (
                  <div className="flex justify-between items-center font-bold">
                    <span>Giá tiền VNĐ:</span>
                    <span className="text-emerald-600 font-mono text-sm">{purchasingItem.price_vnd.toLocaleString()} VNĐ</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Số dư XP hiện tại:</span>
                  <span className="font-mono font-semibold">{userXp} XP</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Số dư XP còn lại sau khi mua:</span>
                  <span className="font-mono font-bold text-primary">{Math.max(0, userXp - purchasingItem.price_xp)} XP</span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPurchasingItem(null)}>Hủy</Button>
              <Button
                onClick={() => handleBuyXp(purchasingItem)}
                disabled={purchasing || userXp < purchasingItem.price_xp}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
              >
                {purchasing ? 'Đang mở khóa...' : 'Xác nhận mở khóa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Floating Background Music Player */}
      <BackgroundMusicPlayer />

      <Footer />
    </main>
  );
}

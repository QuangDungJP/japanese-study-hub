import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, CheckCircle2, Crown, Sparkles, Shirt, BookOpen, Music, Frame, ShieldCheck, Loader2
} from 'lucide-react';
import AvatarWithDecoration from './AvatarWithDecoration';

export interface InventoryItem {
  id: string;
  item_code: string;
  purchased_with: string;
  amount_paid: number;
  purchased_at: string;
  store_items?: {
    title_vi: string;
    description_vi?: string | null;
    category: string;
    cover_image?: string | null;
    audio_url?: string | null;
  } | null;
}

export const UserInventoryShowcase = ({ userId }: { userId?: string }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const targetUserId = userId || user?.id;

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [equippedFrame, setEquippedFrame] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [equippingCode, setEquippingCode] = useState<string | null>(null);

  useEffect(() => {
    if (!targetUserId) return;

    const fetchInventoryAndFrame = async () => {
      setLoading(true);
      try {
        // Fetch user inventory
        const { data: invData } = await supabase
          .from('user_inventory')
          .select('*, store_items(title_vi, description_vi, category, cover_image, audio_url)')
          .eq('user_id', targetUserId)
          .order('purchased_at', { ascending: false });

        setInventory((invData || []) as InventoryItem[]);

        // Fetch profile equipped frame
        const { data: prof } = await supabase
          .from('profiles')
          .select('equipped_frame_code')
          .eq('id', targetUserId)
          .maybeSingle();

        if (prof?.equipped_frame_code) {
          setEquippedFrame(prof.equipped_frame_code);
        }
      } catch (err) {
        console.error('Error fetching inventory:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryAndFrame();
  }, [targetUserId]);

  const handleEquipFrame = async (itemCode: string) => {
    if (!targetUserId) return;

    setEquippingCode(itemCode);
    try {
      const newFrame = equippedFrame === itemCode ? null : itemCode;
      await supabase
        .from('profiles')
        .update({ equipped_frame_code: newFrame, updated_at: new Date().toISOString() })
        .eq('id', targetUserId);

      setEquippedFrame(newFrame);
      toast({
        title: newFrame ? '✨ Đã trang bị vật phẩm!' : 'Đã tháo trang bị',
        description: newFrame ? `Khung avatar ${itemCode} đã được kích hoạt` : 'Đã trở về avatar mặc định',
      });
    } catch (err: any) {
      toast({ title: 'Lỗi trang bị', description: err.message, variant: 'destructive' });
    } finally {
      setEquippingCode(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-xs text-muted-foreground">Đang tải kho đồ cá nhân...</div>;
  }

  if (inventory.length === 0) {
    return (
      <Card className="border-dashed bg-card/60">
        <CardContent className="py-12 text-center text-muted-foreground space-y-3">
          <Package className="w-12 h-12 mx-auto opacity-30 text-primary" />
          <p className="font-bold text-sm text-foreground">Kho đồ cá nhân chưa có vật phẩm nào.</p>
          <p className="text-xs max-w-sm mx-auto">Ghé thăm Cửa Hàng (/store) để đổi XP lấy sách giáo trình, nhạc Lo-Fi và khung avatar độc quyền!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 shadow-md overflow-hidden bg-card/90 backdrop-blur-md">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/5 border-b pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Package className="w-5 h-5 text-amber-500" />
              Kho Đồ Cá Nhân & Trang Bị ({inventory.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Tất cả sách giáo trình, thẻ boost, khung avatar 3D và bài nhạc bạn đang sở hữu
            </CardDescription>
          </div>

          {/* Current Equipped Avatar Preview */}
          <div className="flex items-center gap-3 bg-background/80 p-2 px-3 rounded-2xl border shadow-xs shrink-0">
            <AvatarWithDecoration userId={targetUserId} size="md" />
            <div className="text-xs">
              <p className="font-bold text-foreground">Avatar Hiện Tại</p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {equippedFrame ? `Trang bị: ${equippedFrame}` : 'Mặc định'}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((inv) => {
            const item = inv.store_items;
            const isAvatarFrame = item?.category.toLowerCase().includes('avatar') || inv.item_code.startsWith('frame_');
            const isEquipped = equippedFrame === inv.item_code;

            return (
              <div
                key={inv.id}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 group shadow-xs ${
                  isEquipped ? 'border-amber-500 bg-amber-500/10' : 'bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden shrink-0 border relative flex items-center justify-center">
                    {item?.cover_image ? (
                      <img src={item.cover_image} alt={item.title_vi || inv.item_code} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <Package className="w-6 h-6 text-primary" />
                    )}
                    <span className="absolute top-1 left-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                        {item?.category || 'Vật phẩm'}
                      </Badge>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Đã sở hữu
                      </span>
                    </div>

                    <h4 className="font-bold text-sm truncate text-foreground">{item?.title_vi || inv.item_code}</h4>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{item?.description_vi || 'Sở hữu vĩnh viễn'}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t flex justify-end gap-1.5">
                  {isAvatarFrame ? (
                    <Button
                      size="sm"
                      variant={isEquipped ? 'default' : 'outline'}
                      disabled={equippingCode === inv.item_code}
                      onClick={() => handleEquipFrame(inv.item_code)}
                      className={`w-full text-xs font-bold gap-1 rounded-xl ${
                        isEquipped ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''
                      }`}
                    >
                      {equippingCode === inv.item_code ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isEquipped ? (
                        <>
                          <Crown className="w-3.5 h-3.5 fill-current" /> Đang trang bị
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Trang bị lên Avatar
                        </>
                      )}
                    </Button>
                  ) : item?.audio_url ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('play_bg_track', {
                          detail: {
                            id: inv.id,
                            title: item.title_vi,
                            artist: 'TNQDO Music',
                            cover_image: item.cover_image,
                            audio_url: item.audio_url,
                            duration_seconds: 180,
                            is_free: true,
                            price_xp: 0,
                          }
                        }));
                        toast({ title: '🎵 Đang phát nhạc Lo-Fi Spotify Style!' });
                      }}
                      className="w-full text-xs font-bold gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl shadow-xs"
                    >
                      <Music className="w-3.5 h-3.5" /> ▶️ Phát Nhạc Ngay (Spotify)
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" disabled className="w-full text-[11px] font-semibold gap-1 rounded-xl">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Đã mở khóa vĩnh viễn
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserInventoryShowcase;

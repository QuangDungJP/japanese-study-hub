import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, CheckCircle2, ShoppingBag, ShieldCheck, Crown } from 'lucide-react';
import AvatarWithDecoration, { AVATAR_FRAMES_CATALOG, AvatarFrameInfo } from './AvatarWithDecoration';
import { Link } from 'react-router-dom';

export const AvatarFrameCustomizer = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [equippedFrame, setEquippedFrame] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchFrameData = async () => {
      try {
        setLoading(true);
        const { data } = await (supabase as any)
          .from('profiles')
          .select('equipped_frame_code, avatar_url, full_name')
          .or(`user_id.eq.${user.id},id.eq.${user.id}`)
          .maybeSingle();

        if (data) {
          setEquippedFrame(data.equipped_frame_code || null);
          setSelectedFrame(data.equipped_frame_code || null);
          setUserProfile({ full_name: data.full_name, avatar_url: data.avatar_url });
        }
      } catch (err) {
        console.error('Error fetching equipped frame:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFrameData();
  }, [user]);

  const handleEquip = async (frameCode: string | null) => {
    if (!user) return;
    setSaving(true);
    try {
      let { error } = await (supabase as any)
        .from('profiles')
        .update({ equipped_frame_code: frameCode, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        await (supabase as any)
          .from('profiles')
          .update({ equipped_frame_code: frameCode, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      setEquippedFrame(frameCode);
      setSelectedFrame(frameCode);

      const detail = { userId: user.id, frameCode };
      window.dispatchEvent(new CustomEvent('frame_updated', { detail }));
      window.dispatchEvent(new CustomEvent('avatar_updated', { detail }));

      toast({
        title: frameCode ? '✨ Đã kích hoạt khung avatar!' : 'Đã tháo trang bị',
        description: frameCode ? 'Khung avatar mới đã được áp dụng toàn bộ hệ thống.' : 'Đã trở về avatar mặc định.',
      });
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Đang tải bộ trang trí avatar...</div>;
  }

  const activeFrameInfo = AVATAR_FRAMES_CATALOG.find(f => f.code === (selectedFrame || equippedFrame));

  return (
    <Card className="border-2 border-primary/20 shadow-soft overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-pink-500/10 pb-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <Sparkles className="w-6 h-6 text-amber-500" />
              Khung Avatar & Trang Trí Profile
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Chọn khung avatar siêu đỉnh bên dưới để tỏa sáng trên Bảng xếp hạng, Phòng học và Hồ sơ cá nhân
            </CardDescription>
          </div>
          <Link to="/store">
            <Button size="sm" variant="outline" className="font-bold gap-1.5 rounded-xl border-amber-400/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
              <ShoppingBag className="w-4 h-4" /> Mở khóa thêm ở Cửa hàng
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {/* Preview Container */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left z-10">
            {/* Live Avatar Preview */}
            <div className="relative p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              <AvatarWithDecoration
                userId={user?.id}
                avatarUrl={userProfile?.avatar_url}
                name={userProfile?.full_name}
                frameCode={selectedFrame}
                size="3xl"
              />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-yellow-300 border border-amber-300/30 text-xs font-bold">
                <Crown className="w-3.5 h-3.5" /> Demo Xem Trước Trực Tiếp
              </div>
              <h3 className="text-2xl font-black">{activeFrameInfo ? activeFrameInfo.name : 'Mặc định (Không dùng khung)'}</h3>
              <p className="text-xs text-white/80 max-w-sm">
                {activeFrameInfo ? activeFrameInfo.description : 'Avatar nguyên bản chưa được trang bị khung trang trí'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 z-10 w-full sm:w-auto">
            {selectedFrame !== equippedFrame ? (
              <Button
                onClick={() => handleEquip(selectedFrame)}
                disabled={saving}
                className="w-full font-extrabold gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? 'Đang áp dụng...' : 'Kích hoạt khung này'}
              </Button>
            ) : equippedFrame ? (
              <Button
                onClick={() => handleEquip(null)}
                disabled={saving}
                variant="destructive"
                className="w-full font-bold gap-2 rounded-xl"
              >
                Tháo trang bị khung
              </Button>
            ) : (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 font-bold px-4 py-2 justify-center rounded-xl">
                ✓ Đang dùng Avatar nguyên bản
              </Badge>
            )}
          </div>
        </div>

        {/* Frames Catalog Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Bộ Sưu Tập Khung Avatar Độc Quyền ({AVATAR_FRAMES_CATALOG.length})
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Default Option (No Frame) */}
            <div
              onClick={() => setSelectedFrame(null)}
              className={`rounded-2xl border-2 p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                selectedFrame === null
                  ? 'border-primary bg-primary/10 shadow-md scale-105'
                  : 'border-border hover:border-primary/40 hover:bg-muted/50'
              }`}
            >
              <AvatarWithDecoration
                avatarUrl={userProfile?.avatar_url}
                name={userProfile?.full_name}
                frameCode={null}
                size="lg"
              />
              <span className="text-xs font-bold text-center">Mặc định</span>
              {equippedFrame === null && (
                <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-300 font-bold">
                  Đang trang bị
                </Badge>
              )}
            </div>

            {/* Catalog Items */}
            {AVATAR_FRAMES_CATALOG.map((f) => {
              const isSelected = selectedFrame === f.code;
              const isEquipped = equippedFrame === f.code;

              return (
                <div
                  key={f.code}
                  onClick={() => setSelectedFrame(f.code)}
                  className={`rounded-2xl border-2 p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all relative group ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/10 shadow-lg scale-105 ring-2 ring-amber-400/30'
                      : 'border-border hover:border-amber-400/50 hover:bg-muted/50'
                  }`}
                >
                  <AvatarWithDecoration
                    avatarUrl={userProfile?.avatar_url}
                    name={userProfile?.full_name}
                    frameCode={f.code}
                    size="lg"
                  />
                  <span className="text-xs font-bold text-center line-clamp-1">{f.name}</span>
                  {isEquipped ? (
                    <Badge variant="default" className="text-[9px] bg-amber-500 text-white font-bold">
                      Đang dùng
                    </Badge>
                  ) : isSelected ? (
                    <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-400 font-bold">
                      Đang xem
                    </Badge>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvatarFrameCustomizer;

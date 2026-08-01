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
import {
  Award, Trophy, Star, Sparkles, Plus, Edit, Trash2, Search, Users,
  CheckCircle2, Flame, ShieldAlert, Zap, GraduationCap, Gift, RefreshCw, Loader2
} from 'lucide-react';

export interface BadgeItem {
  id: string;
  code: string;
  title: string;
  title_vi: string;
  description?: string | null;
  description_vi?: string | null;
  icon_url?: string | null;
  badge_type: 'achievement' | 'milestone' | 'streak' | 'role_badge' | 'special';
  target_role: 'all' | 'student' | 'teacher';
  req_type: 'total_xp' | 'streak_days' | 'exams_completed' | 'lessons_completed' | 'exercises_completed' | 'custom';
  req_value: number;
  bonus_xp: number;
  is_active: boolean;
  created_at?: string;
}

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role?: string;
}

const reqTypeLabels: Record<string, string> = {
  total_xp: '⭐ Tổng XP tích lũy',
  streak_days: '🔥 Chuỗi ngày liên tục',
  exams_completed: '🏆 Bài thi hoàn thành',
  lessons_completed: '📚 Bài học hoàn thành',
  exercises_completed: '✏️ Bài tập hoàn thành',
  custom: '🎯 Thủ công / Sự kiện đặc biệt',
};

const badgeTypeLabels: Record<string, { label: string; color: string }> = {
  achievement: { label: 'Thành tích', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  milestone: { label: 'Cột mốc', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  streak: { label: 'Chuỗi học tập', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  role_badge: { label: 'Vai trò', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
  special: { label: 'Đặc biệt', color: 'bg-rose-500/10 text-rose-600 border-rose-200' },
};

const defaultIcons = ['🥇', '🥈', '🥉', '⭐', '🌟', '👑', '🏆', '🔥', '⚡', '🎓', '🎙️', '📚', '🚀', '💎', '🛡️', '🎯'];

const AdminBadges = () => {
  const { toast } = useToast();
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher'>('all');

  // Edit / Create Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    title_vi: '',
    description_vi: '',
    icon_url: '⭐',
    badge_type: 'achievement' as BadgeItem['badge_type'],
    target_role: 'all' as BadgeItem['target_role'],
    req_type: 'total_xp' as BadgeItem['req_type'],
    req_value: 100,
    bonus_xp: 50,
    is_active: true,
  });

  // Award Dialog State
  const [awardDialogOpen, setAwardDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [awarding, setAwarding] = useState(false);

  // System XP Settings state
  const [systemXpSettings, setSystemXpSettings] = useState({
    daily_login_xp: 10,
    streak_7_xp: 50,
    streak_30_xp: 200,
    exam_default_xp: 50,
    exercise_default_xp: 20,
    lesson_default_xp: 25,
  });
  const [systemXpSaving, setSystemXpSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const fetchSystemXpSettings = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('website_content')
        .select('content')
        .eq('section_key', 'xp_system_settings')
        .maybeSingle();

      if (data?.content) {
        setSystemXpSettings(prev => ({ ...prev, ...(data.content as any) }));
      }
    } catch (err) {
      console.error('Error fetching system XP settings:', err);
    }
  }, []);

  const saveSystemXpSettings = async () => {
    setSystemXpSaving(true);
    try {
      const { data: existing } = await supabase
        .from('website_content')
        .select('id')
        .eq('section_key', 'xp_system_settings')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('website_content')
          .update({ content: systemXpSettings as any, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('website_content').insert({
          section_key: 'xp_system_settings',
          title_vi: 'Cấu hình XP Hệ thống',
          is_active: true,
          content: systemXpSettings as any,
        });
      }
      toast({ title: '✅ Đã lưu Cấu hình Quy tắc XP' });
    } catch (err: any) {
      toast({ title: 'Lỗi lưu quy tắc XP', description: err.message, variant: 'destructive' });
    } finally {
      setSystemXpSaving(false);
    }
  };

  const handleUploadBadgeImage = async (file: File) => {
    setImageUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const path = `badges/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('lesson-assets').upload(path, file);
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('lesson-assets').getPublicUrl(path);
      setFormData(prev => ({ ...prev, icon_url: publicUrl }));
      toast({ title: '✅ Đã tải lên ảnh huy hiệu' });
    } catch (err: any) {
      toast({ title: 'Lỗi upload ảnh huy hiệu', description: err.message, variant: 'destructive' });
    } finally {
      setImageUploading(false);
    }
  };

  const fetchBadges = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBadges((data || []) as BadgeItem[]);
    } catch (err: any) {
      console.error('Error fetching badges:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const { data: profs } = await supabase.from('profiles').select('user_id, full_name, avatar_url');
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');

      const mapped: UserProfile[] = (profs || []).map((p) => {
        const r = roles?.find((r) => r.user_id === p.user_id)?.role || 'user';
        return { ...p, role: r };
      });
      setProfiles(mapped);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchBadges(), fetchUsers(), fetchSystemXpSettings()]);
      setLoading(false);
    };
    init();
  }, [fetchBadges, fetchUsers, fetchSystemXpSettings]);

  const handleOpenCreate = () => {
    setEditingBadge(null);
    setFormData({
      code: `badge_${Date.now().toString(36)}`,
      title_vi: '',
      description_vi: '',
      icon_url: '⭐',
      badge_type: 'achievement',
      target_role: 'all',
      req_type: 'total_xp',
      req_value: 100,
      bonus_xp: 50,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (b: BadgeItem) => {
    setEditingBadge(b);
    setFormData({
      code: b.code,
      title_vi: b.title_vi || b.title,
      description_vi: b.description_vi || b.description || '',
      icon_url: b.icon_url || '⭐',
      badge_type: b.badge_type,
      target_role: b.target_role,
      req_type: b.req_type,
      req_value: b.req_value,
      bonus_xp: b.bonus_xp,
      is_active: b.is_active,
    });
    setDialogOpen(true);
  };

  const handleSaveBadge = async () => {
    if (!formData.title_vi.trim()) {
      toast({ title: 'Vui lòng nhập tên danh hiệu', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: formData.code.trim().toLowerCase().replace(/\s+/g, '_'),
        title: formData.title_vi.trim(),
        title_vi: formData.title_vi.trim(),
        description: formData.description_vi.trim(),
        description_vi: formData.description_vi.trim(),
        icon_url: formData.icon_url,
        badge_type: formData.badge_type,
        target_role: formData.target_role,
        req_type: formData.req_type,
        req_value: formData.req_value,
        bonus_xp: formData.bonus_xp,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingBadge) {
        const { error } = await supabase.from('badges').update(payload).eq('id', editingBadge.id);
        if (error) throw error;
        toast({ title: '✅ Đã cập nhật danh hiệu' });
      } else {
        const { error } = await supabase.from('badges').insert(payload);
        if (error) throw error;
        toast({ title: '✅ Đã tạo danh hiệu mới' });
      }

      setDialogOpen(false);
      fetchBadges();
    } catch (err: any) {
      toast({ title: 'Lỗi lưu danh hiệu', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBadge = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh hiệu này?')) return;
    try {
      const { error } = await supabase.from('badges').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Đã xóa danh hiệu' });
      fetchBadges();
    } catch (err: any) {
      toast({ title: 'Không thể xóa danh hiệu', description: err.message, variant: 'destructive' });
    }
  };

  const handleAwardBadge = async () => {
    if (!selectedUserId || !selectedBadgeId) {
      toast({ title: 'Vui lòng chọn người dùng và danh hiệu', variant: 'destructive' });
      return;
    }

    setAwarding(true);
    try {
      // Insert user badge
      const { error } = await supabase.from('user_badges').insert({
        user_id: selectedUserId,
        badge_id: selectedBadgeId,
        unlocked_by: 'admin',
      });
      if (error) throw error;

      // Add bonus XP to user_progress if badge has bonus_xp
      const targetBadge = badges.find((b) => b.id === selectedBadgeId);
      if (targetBadge && targetBadge.bonus_xp > 0) {
        const { data: prog } = await supabase
          .from('user_progress')
          .select('total_xp')
          .eq('user_id', selectedUserId)
          .maybeSingle();

        const currentXp = prog?.total_xp || 0;
        await supabase
          .from('user_progress')
          .upsert({ user_id: selectedUserId, total_xp: currentXp + targetBadge.bonus_xp, updated_at: new Date().toISOString() });
      }

      toast({ title: '🎉 Đã trao danh hiệu thành công!' });
      setAwardDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Lỗi trao danh hiệu', description: err.message, variant: 'destructive' });
    } finally {
      setAwarding(false);
    }
  };

  const filteredBadges = badges.filter((b) => {
    const matchSearch =
      (b.title_vi || b.title).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.description_vi || b.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'all' || b.target_role === 'all' || b.target_role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            Hệ thống XP & Quản lý Danh hiệu
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Thiết lập danh hiệu, huy hiệu, mốc XP thưởng cho Học viên & Giáo viên
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAwardDialogOpen(true)} className="gap-2">
            <Gift className="w-4 h-4 text-purple-500" /> Trao danh hiệu
          </Button>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Tạo danh hiệu mới
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="badges" className="space-y-4">
        <TabsList>
          <TabsTrigger value="badges" className="gap-2">
            <Award className="w-4 h-4" /> Danh mục Huy hiệu ({badges.length})
          </TabsTrigger>
          <TabsTrigger value="xp_rules" className="gap-2">
            <Zap className="w-4 h-4" /> Cấu hình Quy tắc XP & Level
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Badges List */}
        <TabsContent value="badges" className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl border">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm danh hiệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground">Đối tượng:</span>
              <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌐 Tất cả</SelectItem>
                  <SelectItem value="student">🎓 Học viên</SelectItem>
                  <SelectItem value="teacher">👨‍🏫 Giáo viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Badges Grid */}
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              Đang tải danh hiệu...
            </div>
          ) : filteredBadges.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground space-y-3">
                <Trophy className="w-12 h-12 mx-auto opacity-30" />
                <p className="font-semibold">Chưa có danh hiệu nào phù hợp.</p>
                <Button size="sm" onClick={handleOpenCreate}>Tạo danh hiệu đầu tiên</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBadges.map((b) => {
                const bmeta = badgeTypeLabels[b.badge_type] || { label: b.badge_type, color: 'bg-muted text-foreground' };
                return (
                  <Card key={b.id} className={`border-2 transition-all hover:shadow-md ${!b.is_active ? 'opacity-50 bg-muted/20' : 'hover:border-primary/40'}`}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl shrink-0 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            {b.icon_url || '⭐'}
                          </span>
                          <div>
                            <CardTitle className="text-base font-bold flex items-center gap-1.5">
                              {b.title_vi || b.title}
                            </CardTitle>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <Badge className={`text-[10px] px-1.5 py-0 ${bmeta.color}`}>
                                {bmeta.label}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {b.target_role === 'teacher' ? '👨‍🏫 Giáo viên' : b.target_role === 'student' ? '🎓 Học viên' : '🌐 Tất cả'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleOpenEdit(b)}>
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteBadge(b.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-3 text-xs">
                      <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                        {b.description_vi || b.description || 'Chưa có mô tả'}
                      </p>
                      <div className="space-y-1.5 pt-2 border-t">
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Điều kiện:</span>
                          <span className="font-semibold text-foreground">{reqTypeLabels[b.req_type] || b.req_type} ≥ {b.req_value}</span>
                        </div>
                        {b.bonus_xp > 0 && (
                          <div className="flex justify-between items-center text-emerald-600 font-semibold">
                            <span>Thưởng XP:</span>
                            <span>+{b.bonus_xp} XP</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: XP Rules */}
        <TabsContent value="xp_rules" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" /> Cấu hình Thưởng XP & Điểm danh Hệ thống
                </CardTitle>
                <CardDescription>Admin tùy chỉnh số XP nhận được khi đăng nhập hàng ngày, làm bài thi, nộp bài tập</CardDescription>
              </div>
              <Button onClick={saveSystemXpSettings} disabled={systemXpSaving} className="gap-2">
                {systemXpSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Lưu Cấu Hình XP Hệ Thống
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-card space-y-2">
                  <Label className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">📅 XP Đăng nhập mỗi ngày</Label>
                  <Input
                    type="number" min={1}
                    value={systemXpSettings.daily_login_xp}
                    onChange={(e) => setSystemXpSettings({ ...systemXpSettings, daily_login_xp: parseInt(e.target.value) || 10 })}
                    className="font-bold text-lg text-amber-600"
                  />
                  <p className="text-[11px] text-muted-foreground">Tự động cộng khi người dùng đăng nhập mỗi ngày.</p>
                </div>
                <div className="p-4 rounded-xl border bg-card space-y-2">
                  <Label className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">🔥 XP Thưởng Streak 7 ngày</Label>
                  <Input
                    type="number" min={1}
                    value={systemXpSettings.streak_7_xp}
                    onChange={(e) => setSystemXpSettings({ ...systemXpSettings, streak_7_xp: parseInt(e.target.value) || 50 })}
                    className="font-bold text-lg text-orange-600"
                  />
                  <p className="text-[11px] text-muted-foreground">Thưởng thêm khi duy trì chuỗi học 7 ngày.</p>
                </div>
                <div className="p-4 rounded-xl border bg-card space-y-2">
                  <Label className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">⚡ XP Thưởng Streak 30 ngày</Label>
                  <Input
                    type="number" min={1}
                    value={systemXpSettings.streak_30_xp}
                    onChange={(e) => setSystemXpSettings({ ...systemXpSettings, streak_30_xp: parseInt(e.target.value) || 200 })}
                    className="font-bold text-lg text-red-600"
                  />
                  <p className="text-[11px] text-muted-foreground">Thưởng thêm khi duy trì chuỗi học 30 ngày.</p>
                </div>
                <div className="p-4 rounded-xl border bg-card space-y-2">
                  <Label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">🏆 XP Mặc định Bài kiểm tra</Label>
                  <Input
                    type="number" min={1}
                    value={systemXpSettings.exam_default_xp}
                    onChange={(e) => setSystemXpSettings({ ...systemXpSettings, exam_default_xp: parseInt(e.target.value) || 50 })}
                    className="font-bold text-lg text-indigo-600"
                  />
                  <p className="text-[11px] text-muted-foreground">Giáo viên có thể chỉnh riêng ở ExamBuilder.</p>
                </div>
                <div className="p-4 rounded-xl border bg-card space-y-2">
                  <Label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">✏️ XP Mặc định Nộp bài tập</Label>
                  <Input
                    type="number" min={1}
                    value={systemXpSettings.exercise_default_xp}
                    onChange={(e) => setSystemXpSettings({ ...systemXpSettings, exercise_default_xp: parseInt(e.target.value) || 20 })}
                    className="font-bold text-lg text-blue-600"
                  />
                  <p className="text-[11px] text-muted-foreground">Cộng khi học viên nộp bài tập buổi học.</p>
                </div>
                <div className="p-4 rounded-xl border bg-card space-y-2">
                  <Label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">📚 XP Mặc định Học bài giảng</Label>
                  <Input
                    type="number" min={1}
                    value={systemXpSettings.lesson_default_xp}
                    onChange={(e) => setSystemXpSettings({ ...systemXpSettings, lesson_default_xp: parseInt(e.target.value) || 25 })}
                    className="font-bold text-lg text-emerald-600"
                  />
                  <p className="text-[11px] text-muted-foreground">Cộng khi hoàn thành học bài giảng mẫu.</p>
                </div>
              </div>

              {/* Level calculation info */}
              <div className="rounded-xl border p-4 bg-primary/5 space-y-2">
                <p className="font-bold text-sm text-primary flex items-center gap-1.5">
                  <Star className="w-4 h-4" /> Công thức tính Cấp độ (Level 1 - 50):
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cấp độ Level được tính tự động dựa trên tổng XP tích lũy: <code className="bg-background px-2 py-0.5 rounded border font-mono">Level = Math.floor(Math.sqrt(Total_XP / 20)) + 1</code>.
                  Mỗi khi lên Cấp độ mới, học viên và giáo viên sẽ tự động mở khóa các khung Avatar và huy hiệu tương ứng.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              {editingBadge ? 'Chỉnh sửa Danh hiệu' : 'Tạo Danh hiệu mới'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tên danh hiệu (Tiếng Việt) *</Label>
                <Input
                  value={formData.title_vi}
                  onChange={(e) => setFormData({ ...formData, title_vi: e.target.value })}
                  placeholder="VD: Cao Thủ JLPT N3"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Icon / Ảnh Huy hiệu HD</Label>
                <div className="flex gap-2">
                  {formData.icon_url?.startsWith('http') ? (
                    <img src={formData.icon_url} alt="Badge" className="w-10 h-10 rounded-lg object-contain border p-1 shrink-0" />
                  ) : (
                    <Input
                      value={formData.icon_url}
                      onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                      className="text-center font-bold text-lg w-20 shrink-0"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    id="badge-img-upload"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadBadgeImage(f); }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 text-xs gap-1 flex-1"
                    disabled={imageUploading}
                    onClick={() => document.getElementById('badge-img-upload')?.click()}
                  >
                    {imageUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '📷 Upload ảnh'}
                  </Button>
                </div>
                <div className="flex gap-1 overflow-x-auto flex-1 items-center p-1 border rounded-md mt-1">
                  {defaultIcons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      className="text-base p-1 hover:bg-muted rounded"
                      onClick={() => setFormData({ ...formData, icon_url: ic })}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Mô tả ngắn</Label>
              <Textarea
                value={formData.description_vi}
                onChange={(e) => setFormData({ ...formData, description_vi: e.target.value })}
                placeholder="VD: Đạt mốc 500 điểm XP kinh nghiệm trên hệ thống..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Loại danh hiệu</Label>
                <Select value={formData.badge_type} onValueChange={(v: any) => setFormData({ ...formData, badge_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="achievement">Thành tích</SelectItem>
                    <SelectItem value="milestone">Cột mốc XP</SelectItem>
                    <SelectItem value="streak">Chuỗi ngày (Streak)</SelectItem>
                    <SelectItem value="role_badge">Vai trò</SelectItem>
                    <SelectItem value="special">Đặc biệt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Đối tượng áp dụng</Label>
                <Select value={formData.target_role} onValueChange={(v: any) => setFormData({ ...formData, target_role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌐 Tất cả người dùng</SelectItem>
                    <SelectItem value="student">🎓 Học viên</SelectItem>
                    <SelectItem value="teacher">👨‍🏫 Giáo viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tiêu chí mở khóa</Label>
                <Select value={formData.req_type} onValueChange={(v: any) => setFormData({ ...formData, req_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_xp">⭐ Tổng XP tích lũy</SelectItem>
                    <SelectItem value="streak_days">🔥 Chuỗi ngày liên tục</SelectItem>
                    <SelectItem value="exams_completed">🏆 Bài thi hoàn thành</SelectItem>
                    <SelectItem value="lessons_completed">📚 Bài học hoàn thành</SelectItem>
                    <SelectItem value="exercises_completed">✏️ Bài tập hoàn thành</SelectItem>
                    <SelectItem value="custom">🎯 Thủ công / Sự kiện</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Giá trị yêu cầu</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.req_value}
                  onChange={(e) => setFormData({ ...formData, req_value: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Thưởng thêm XP khi mở khóa</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.bonus_xp}
                  onChange={(e) => setFormData({ ...formData, bonus_xp: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-semibold text-xs">Kích hoạt danh hiệu</p>
                  <p className="text-[11px] text-muted-foreground">Hiện trên hệ thống</p>
                </div>
                <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveBadge} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
              Lưu danh hiệu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MANUAL AWARD DIALOG */}
      <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" /> Trao Danh hiệu Thủ công
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Chọn Người nhận (Học viên / Giáo viên)</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger><SelectValue placeholder="Chọn người dùng..." /></SelectTrigger>
                <SelectContent className="max-h-56">
                  {profiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.role === 'teacher' ? '👨‍🏫' : '🎓'} {p.full_name || 'Người dùng'} ({p.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Chọn Danh hiệu để trao</Label>
              <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                <SelectTrigger><SelectValue placeholder="Chọn danh hiệu..." /></SelectTrigger>
                <SelectContent className="max-h-56">
                  {badges.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.icon_url || '⭐'} {b.title_vi || b.title} (+{b.bonus_xp} XP)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAwardDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleAwardBadge} disabled={awarding || !selectedUserId || !selectedBadgeId}>
              {awarding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Gift className="w-4 h-4 mr-1" />}
              Trao danh hiệu ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBadges;

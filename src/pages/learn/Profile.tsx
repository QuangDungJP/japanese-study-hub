import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, Star, Award, Clock, Save, Plus, X, Camera, Loader2, Shield, 
  GraduationCap, BookOpen, Palette, Sparkles, Flame, Zap, Target, 
  Phone, CheckCircle2, Building, ArrowRight, Heart
} from 'lucide-react';
import { THEME_OPTIONS, applyTheme, getSavedTheme, ThemeOption } from '@/lib/themeUtils';
import { useLearning } from '@/contexts/LearningContext';

import BadgeShowcase from '@/components/shared/BadgeShowcase';

interface ProfileData {
  full_name: string;
  avatar_url: string | null;
  phone_number?: string;
  bio?: string;
  target_level?: string;
  preferred_time?: string;
  theme?: string;
}

interface TeacherProfileData {
  bio: string;
  bio_vi: string;
  specializations: string[];
  experience_years: number;
  certifications: string[];
  hourly_rate: number;
  is_available: boolean;
  rating: number;
  total_reviews: number;
}

const ProfilePage = () => {
  const { user, roles, isTeacherOrAbove, isAdmin } = useAuth();
  const { userProgress } = useLearning();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // Profile States
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    avatar_url: null,
    phone_number: '',
    bio: '',
    target_level: 'N3',
    preferred_time: 'Tối (18h-22h)',
    theme: 'sakura'
  });

  const [currentTheme, setCurrentTheme] = useState<string>(getSavedTheme());

  const [teacherProfile, setTeacherProfile] = useState<TeacherProfileData>({
    bio: '', bio_vi: '', specializations: [], experience_years: 0,
    certifications: [], hourly_rate: 0, is_available: true, rating: 0, total_reviews: 0
  });

  const [newSpec, setNewSpec] = useState('');
  const [newCert, setNewCert] = useState('');
  const [userClassesCount, setUserClassesCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch main profile
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (userData) {
        setProfile({
          full_name: userData.full_name || '',
          avatar_url: userData.avatar_url || null,
          phone_number: (userData as any).phone_number || '',
          bio: (userData as any).bio || '',
          target_level: (userData as any).target_level || 'N3',
          preferred_time: (userData as any).preferred_time || 'Tối (18h-22h)',
          theme: (userData as any).theme || getSavedTheme()
        });
        if ((userData as any).theme) {
          setCurrentTheme((userData as any).theme);
          applyTheme((userData as any).theme);
        }
      }

      // Fetch enrolled classes count
      const { count } = await supabase
        .from('class_students')
        .select('id', { count: 'exact' })
        .eq('student_id', user!.id);
      setUserClassesCount(count || 0);

      // Fetch teacher profile if applicable
      if (isTeacherOrAbove) {
        const { data: tData } = await supabase
          .from('teacher_profiles')
          .select('*')
          .eq('user_id', user!.id)
          .maybeSingle();

        if (tData) {
          setTeacherProfile({
            bio: tData.bio || '', 
            bio_vi: tData.bio_vi || '',
            specializations: (tData.specializations as string[]) || [],
            experience_years: tData.experience_years || 0,
            certifications: (tData.certifications as string[]) || [],
            hourly_rate: tData.hourly_rate || 0,
            is_available: tData.is_available ?? true,
            rating: tData.rating || 0, 
            total_reviews: tData.total_reviews || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Lỗi', description: 'Ảnh không được vượt quá 5MB', variant: 'destructive' });
      return;
    }

    try {
      setUploading(true);
      let finalUrl = '';

      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const filePath = `${user.id}/avatar_${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          finalUrl = `${publicUrl}?t=${Date.now()}`;
        }
      } catch (e) {
        console.warn('Storage upload fallback:', e);
      }

      // Base64 fallback if storage bucket is restricted
      if (!finalUrl) {
        finalUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      // Update profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: finalUrl })
        .eq('user_id', user.id);

      if (updateError) {
        await supabase
          .from('profiles')
          .update({ avatar_url: finalUrl })
          .eq('id', user.id);
      }

      setProfile(prev => ({ ...prev, avatar_url: finalUrl }));
      toast({ title: 'Thành công', description: 'Đã cập nhật ảnh đại diện mới!' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Lỗi', description: 'Không thể tải ảnh lên', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSelectTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    setProfile(prev => ({ ...prev, theme: themeId }));
    applyTheme(themeId);
    toast({
      title: 'Đã đổi giao diện',
      description: `Đã áp dụng chủ đề ${THEME_OPTIONS.find(t => t.id === themeId)?.name}`,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updatePayload: any = {
        full_name: profile.full_name
      };

      // Safe check for extended fields
      if (profile.phone_number !== undefined) updatePayload.phone_number = profile.phone_number;
      if (profile.bio !== undefined) updatePayload.bio = profile.bio;
      if (profile.target_level !== undefined) updatePayload.target_level = profile.target_level;
      if (profile.preferred_time !== undefined) updatePayload.preferred_time = profile.preferred_time;
      if (profile.theme !== undefined) updatePayload.theme = profile.theme;

      let { error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('user_id', user!.id);

      if (updateError) {
        // Fallback with base columns if schema doesn't have extended fields
        const safePayload = { full_name: profile.full_name };
        const retryResult = await supabase
          .from('profiles')
          .update(safePayload)
          .eq('user_id', user!.id);
        updateError = retryResult.error;
      }

      if (updateError) throw updateError;

      // Save teacher profile if teacher
      if (isTeacherOrAbove) {
        const { error } = await supabase
          .from('teacher_profiles')
          .upsert({
            user_id: user!.id,
            bio: teacherProfile.bio, 
            bio_vi: teacherProfile.bio_vi,
            specializations: teacherProfile.specializations,
            experience_years: teacherProfile.experience_years,
            certifications: teacherProfile.certifications,
            hourly_rate: teacherProfile.hourly_rate,
            is_available: teacherProfile.is_available
          }, { onConflict: 'user_id' });
        if (error) throw error;
      }

      toast({ title: 'Thành công', description: 'Đã lưu thay đổi hồ sơ cá nhân!' });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({ title: 'Lỗi', description: error.message || 'Không thể lưu hồ sơ', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addItem = (type: 'spec' | 'cert') => {
    if (type === 'spec' && newSpec.trim()) {
      if (!teacherProfile.specializations.includes(newSpec.trim())) {
        setTeacherProfile(p => ({ ...p, specializations: [...p.specializations, newSpec.trim()] }));
      }
      setNewSpec('');
    } else if (type === 'cert' && newCert.trim()) {
      if (!teacherProfile.certifications.includes(newCert.trim())) {
        setTeacherProfile(p => ({ ...p, certifications: [...p.certifications, newCert.trim()] }));
      }
      setNewCert('');
    }
  };

  const removeItem = (type: 'spec' | 'cert', item: string) => {
    if (type === 'spec') {
      setTeacherProfile(p => ({ ...p, specializations: p.specializations.filter(s => s !== item) }));
    } else {
      setTeacherProfile(p => ({ ...p, certifications: p.certifications.filter(c => c !== item) }));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-3.5 h-3.5 text-red-500" />;
      case 'teacher': case 'senior_teacher': return <GraduationCap className="w-3.5 h-3.5 text-blue-500" />;
      case 'moderator': return <Shield className="w-3.5 h-3.5 text-purple-500" />;
      default: return <BookOpen className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị viên (Admin)';
      case 'teacher': return 'Giáo viên';
      case 'senior_teacher': return 'Giảng viên Cao cấp';
      case 'moderator': return 'Điều hành viên';
      case 'user': return 'Học viên chính thức';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner & Profile Overview */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary via-indigo-600 to-accent text-white shadow-2xl overflow-hidden border border-white/20">
        <div className="h-32 md:h-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative px-6 pb-6 md:px-8 md:pb-8 -mt-16 flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
            <div className="relative group">
              <Avatar className="w-28 h-28 md:w-32 md:h-32 border-4 border-background shadow-2xl">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-extrabold">
                  {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer backdrop-blur-xs"
                title="Thay đổi ảnh đại diện"
              >
                {uploading ? (
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                ) : (
                  <Camera className="w-7 h-7 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={uploadAvatar}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{profile.full_name || 'Chưa đặt tên'}</h1>
                <Badge variant="hero" className="text-xs px-2.5 py-0.5 font-bold">
                  {profile.target_level || 'N3'} Level
                </Badge>
              </div>
              <p className="text-sm text-white/80 font-medium">{user?.email}</p>
              
              <div className="flex flex-wrap gap-2 pt-1 justify-center md:justify-start">
                {roles.map(role => (
                  <Badge key={role} className="bg-white/20 text-white hover:bg-white/30 border-white/30 gap-1.5 text-xs font-semibold backdrop-blur-md">
                    {getRoleIcon(role)}
                    {getRoleLabel(role)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button onClick={handleSave} disabled={saving} variant="secondary" className="font-bold gap-2 shadow-lg hover:scale-105 transition-transform">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-primary" />}
              {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </Button>
          </div>
        </div>

        {/* Live Real Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/15 bg-black/10 backdrop-blur-md divide-x divide-white/10 text-center">
          <div className="p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-current" /> Streak
            </p>
            <p className="text-xl font-extrabold text-white mt-0.5">{userProgress.streak} <span className="text-xs font-normal text-white/70">ngày</span></p>
          </div>

          <div className="p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold flex items-center justify-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-300 fill-current" /> Tích lũy XP
            </p>
            <p className="text-xl font-extrabold text-white mt-0.5">{userProgress.totalXp.toLocaleString()} <span className="text-xs font-normal text-white/70">XP</span></p>
          </div>

          <div className="p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold flex items-center justify-center gap-1">
              <Building className="w-3.5 h-3.5 text-emerald-300" /> Lớp tham gia
            </p>
            <p className="text-xl font-extrabold text-white mt-0.5">{userClassesCount} <span className="text-xs font-normal text-white/70">lớp</span></p>
          </div>

          <div className="p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold flex items-center justify-center gap-1">
              <Target className="w-3.5 h-3.5 text-purple-300" /> Bài hoàn thành
            </p>
            <p className="text-xl font-extrabold text-white mt-0.5">{userProgress.lessonsCompleted} <span className="text-xs font-normal text-white/70">bài</span></p>
          </div>
        </div>
      </div>

        {/* Main Tabs Container */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted p-1.5 rounded-2xl border border-border flex flex-wrap h-auto gap-1">
            <TabsTrigger value="personal" className="rounded-xl font-bold gap-2 text-xs md:text-sm py-2 px-4">
              <User className="w-4 h-4 text-primary" /> Thông tin cá nhân
            </TabsTrigger>
            <TabsTrigger value="badges" className="rounded-xl font-bold gap-2 text-xs md:text-sm py-2 px-4">
              <Award className="w-4 h-4 text-amber-500" /> Danh hiệu & XP
            </TabsTrigger>
            <TabsTrigger value="theme" className="rounded-xl font-bold gap-2 text-xs md:text-sm py-2 px-4">
              <Palette className="w-4 h-4 text-rose-500" /> Giao diện & Chủ đề
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-xl font-bold gap-2 text-xs md:text-sm py-2 px-4">
              <Sparkles className="w-4 h-4 text-amber-500" /> Tiến độ học tập
            </TabsTrigger>
            {isTeacherOrAbove && (
              <TabsTrigger value="teacher" className="rounded-xl font-bold gap-2 text-xs md:text-sm py-2 px-4">
                <GraduationCap className="w-4 h-4 text-blue-500" /> Hồ sơ Giảng viên
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab: Badges */}
          <TabsContent value="badges">
            <BadgeShowcase userId={user?.id || ''} role={roles[0] || 'student'} />
          </TabsContent>

        {/* Tab 1: Personal Info */}
        <TabsContent value="personal">
          <Card className="border-border shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-extrabold">
                <User className="w-5 h-5 text-primary" /> Chi tiết tài khoản cá nhân
              </CardTitle>
              <CardDescription>Cập nhật họ tên, thông tin liên hệ và mục tiêu Tiếng Nhật của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-1.5">
                    <User className="w-4 h-4 text-muted-foreground" /> Họ và tên đầy đủ
                  </Label>
                  <Input
                    value={profile.full_name}
                    onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-muted-foreground" /> Số điện thoại liên hệ
                  </Label>
                  <Input
                    value={profile.phone_number || ''}
                    onChange={(e) => setProfile(p => ({ ...p, phone_number: e.target.value }))}
                    placeholder="Ví dụ: 0987654321"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-muted-foreground" /> Mục tiêu JLPT
                  </Label>
                  <Select 
                    value={profile.target_level || 'N3'} 
                    onValueChange={(val) => setProfile(p => ({ ...p, target_level: val }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Chọn cấp độ JLPT mục tiêu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N5">JLPT N5 (Sơ cấp 1)</SelectItem>
                      <SelectItem value="N4">JLPT N4 (Sơ cấp 2)</SelectItem>
                      <SelectItem value="N3">JLPT N3 (Trung cấp)</SelectItem>
                      <SelectItem value="N2">JLPT N2 (Cao cấp)</SelectItem>
                      <SelectItem value="N1">JLPT N1 (Chuyên gia)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-muted-foreground" /> Khung giờ học yêu thích
                  </Label>
                  <Select 
                    value={profile.preferred_time || 'Tối (18h-22h)'} 
                    onValueChange={(val) => setProfile(p => ({ ...p, preferred_time: val }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Chọn khung giờ học" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sáng (6h-12h)">Sáng (6h - 12h)</SelectItem>
                      <SelectItem value="Chiều (12h-18h)">Chiều (12h - 18h)</SelectItem>
                      <SelectItem value="Tối (18h-22h)">Tối (18h - 22h)</SelectItem>
                      <SelectItem value="Đêm (22h-2h)">Đêm (22h - 2h)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Mục tiêu & Giới thiệu bản thân</Label>
                <Textarea
                  value={profile.bio || ''}
                  onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Chia sẻ ngắn gọn mục tiêu học tập Tiếng Nhật hoặc châm ngôn sống của bạn..."
                  rows={4}
                />
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="lg" className="font-bold gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Theme Customization */}
        <TabsContent value="theme">
          <Card className="border-border shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-extrabold">
                <Palette className="w-5 h-5 text-rose-500" /> Tùy chỉnh Giao diện & Chủ đề Nhật Bản
              </CardTitle>
              <CardDescription>Chọn màu sắc và không gian học tập theo phong cách ưa thích của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {THEME_OPTIONS.map((theme: ThemeOption) => {
                  const isSelected = currentTheme === theme.id;
                  return (
                    <Card
                      key={theme.id}
                      className={`cursor-pointer transition-all duration-300 border-2 overflow-hidden relative group hover:shadow-lg ${
                        isSelected ? 'border-primary ring-2 ring-primary/30 shadow-md' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleSelectTheme(theme.id)}
                    >
                      <div className={`h-24 bg-gradient-to-r ${theme.gradient} p-4 flex justify-between items-start text-white relative`}>
                        <div>
                          <p className="font-extrabold text-base">{theme.name}</p>
                          <p className="text-xs text-white/80 font-mono font-bold">{theme.name_ja}</p>
                        </div>
                        {isSelected && (
                          <Badge className="bg-white text-primary font-bold gap-1 shadow-md">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Đang dùng
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                          {theme.description}
                        </p>
                        <div className="flex items-center gap-2 pt-2 border-t text-xs font-bold text-foreground">
                          <span className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: theme.color }} />
                          {isSelected ? 'Đã kích hoạt' : 'Click để áp dụng'}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Theme Live Preview Box */}
              <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-card to-accent/10 border border-primary/20 space-y-3">
                <h4 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> XEM TRƯỚC PHONG CÁCH GIAO DIỆN HỆ THỐNG
                </h4>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button variant="default" className="font-bold shadow-md">Nút bấm chính (Primary)</Button>
                  <Button variant="secondary" className="font-bold">Nút phụ (Secondary)</Button>
                  <Badge variant="hero" className="font-bold px-3 py-1">Huy hiệu Nổi bật</Badge>
                  <Badge variant="outline" className="font-bold">Huy hiệu Viền</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Progress & Achievements */}
        <TabsContent value="stats">
          <Card className="border-border shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-extrabold">
                <Sparkles className="w-5 h-5 text-amber-500" /> Bảng tiến độ học tập thực tế
              </CardTitle>
              <CardDescription>Theo dõi thành tích XP, Streak và bài học hoàn thành của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-orange-500/10 to-card border-orange-200">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-orange-500/20 text-orange-600 border border-orange-300">
                      <Flame className="w-8 h-8 fill-current animate-bounce" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-orange-600">Chuỗi Streak Hiện Tại</p>
                      <p className="text-3xl font-extrabold text-foreground mt-0.5">{userProgress.streak} Ngày</p>
                      <p className="text-xs text-muted-foreground mt-1">Học liên tục mỗi ngày để nhận quà Streak!</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-card border-amber-200">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-amber-500/20 text-amber-600 border border-amber-300">
                      <Zap className="w-8 h-8 fill-current text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-amber-600">Điểm Thưởng XP</p>
                      <p className="text-3xl font-extrabold text-foreground mt-0.5">{userProgress.totalXp.toLocaleString()} XP</p>
                      <p className="text-xs text-muted-foreground mt-1">Tích lũy từ bài học, bài tập & kiểm tra.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Teacher Profile (If teacher) */}
        {isTeacherOrAbove && (
          <TabsContent value="teacher">
            <Card className="border-border shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-extrabold">
                  <GraduationCap className="w-5 h-5 text-blue-500" /> Thông tin Giảng viên Chuyên nghiệp
                </CardTitle>
                <CardDescription>Cập nhật chuyên môn, chứng chỉ và hồ sơ giảng dạy công khai</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Giới thiệu bản thân (Tiếng Việt)</Label>
                    <Textarea
                      value={teacherProfile.bio_vi}
                      onChange={(e) => setTeacherProfile(p => ({ ...p, bio_vi: e.target.value }))}
                      placeholder="Mô tả phong cách giảng dạy và thế mạnh của bạn..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Giới thiệu (English Bio)</Label>
                    <Textarea
                      value={teacherProfile.bio}
                      onChange={(e) => setTeacherProfile(p => ({ ...p, bio: e.target.value }))}
                      placeholder="Introduce your teaching background in English..."
                      rows={4}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Số năm kinh nghiệm giảng dạy</Label>
                    <Input
                      type="number"
                      value={teacherProfile.experience_years}
                      onChange={(e) => setTeacherProfile(p => ({ ...p, experience_years: parseInt(e.target.value) || 0 }))}
                      min={0}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Mức phí/giờ dạy 1-1 (VND)</Label>
                    <Input
                      type="number"
                      value={teacherProfile.hourly_rate}
                      onChange={(e) => setTeacherProfile(p => ({ ...p, hourly_rate: parseInt(e.target.value) || 0 }))}
                      min={0} step={50000}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Specializations Tag Editor */}
                <div className="space-y-2">
                  <Label className="font-bold">Chuyên môn giảng dạy (Specializations)</Label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {teacherProfile.specializations.map(item => (
                      <Badge key={item} variant="secondary" className="gap-1.5 text-xs py-1 px-2.5 font-bold">
                        {item}
                        <X className="w-3.5 h-3.5 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => removeItem('spec', item)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newSpec}
                      onChange={(e) => setNewSpec(e.target.value)}
                      placeholder="VD: Luyện thi JLPT N2, Tiếng Nhật Thương Mại..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('spec'))}
                    />
                    <Button variant="outline" onClick={() => addItem('spec')}>
                      <Plus className="w-4 h-4 mr-1" /> Thêm
                    </Button>
                  </div>
                </div>

                {/* Certifications Tag Editor */}
                <div className="space-y-2">
                  <Label className="font-bold">Bằng cấp & Chứng chỉ (Certifications)</Label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {teacherProfile.certifications.map(item => (
                      <Badge key={item} variant="outline" className="gap-1.5 text-xs py-1 px-2.5 font-bold border-primary/30 text-primary">
                        <Award className="w-3.5 h-3.5 text-primary" />
                        {item}
                        <X className="w-3.5 h-3.5 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => removeItem('cert', item)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newCert}
                      onChange={(e) => setNewCert(e.target.value)}
                      placeholder="VD: Bằng JLPT N1 (175/180), Chứng chỉ Sư phạm..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('cert'))}
                    />
                    <Button variant="outline" onClick={() => addItem('cert')}>
                      <Plus className="w-4 h-4 mr-1" /> Thêm
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <Button onClick={handleSave} disabled={saving} size="lg" className="font-bold gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Đang lưu...' : 'Lưu hồ sơ giảng viên'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ProfilePage;

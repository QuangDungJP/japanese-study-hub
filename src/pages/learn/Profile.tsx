import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Star, Award, Clock, Save, Plus, X, Camera, Loader2, Shield, GraduationCap, BookOpen } from 'lucide-react';

interface ProfileData {
  full_name: string;
  avatar_url: string | null;
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
  const { user, roles, isTeacherOrAbove, isAdmin, isModerator } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({ full_name: '', avatar_url: null });
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfileData>({
    bio: '', bio_vi: '', specializations: [], experience_years: 0,
    certifications: [], hourly_rate: 0, is_available: true, rating: 0, total_reviews: 0
  });
  const [newSpec, setNewSpec] = useState('');
  const [newCert, setNewCert] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user!.id)
        .single();

      if (userData) setProfile(userData);

      if (isTeacherOrAbove) {
        const { data: tData } = await supabase
          .from('teacher_profiles')
          .select('*')
          .eq('user_id', user!.id)
          .maybeSingle();

        if (tData) {
          setTeacherProfile({
            bio: tData.bio || '', bio_vi: tData.bio_vi || '',
            specializations: (tData.specializations as string[]) || [],
            experience_years: tData.experience_years || 0,
            certifications: (tData.certifications as string[]) || [],
            hourly_rate: tData.hourly_rate || 0,
            is_available: tData.is_available ?? true,
            rating: tData.rating || 0, total_reviews: tData.total_reviews || 0
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

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Lỗi', description: 'Ảnh không được vượt quá 2MB', variant: 'destructive' });
      return;
    }

    try {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);

      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      toast({ title: 'Thành công', description: 'Đã cập nhật ảnh đại diện' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Lỗi', description: 'Không thể tải ảnh lên', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await supabase
        .from('profiles')
        .update({ full_name: profile.full_name })
        .eq('user_id', user!.id);

      if (isTeacherOrAbove) {
        const { error } = await supabase
          .from('teacher_profiles')
          .upsert({
            user_id: user!.id,
            bio: teacherProfile.bio, bio_vi: teacherProfile.bio_vi,
            specializations: teacherProfile.specializations,
            experience_years: teacherProfile.experience_years,
            certifications: teacherProfile.certifications,
            hourly_rate: teacherProfile.hourly_rate,
            is_available: teacherProfile.is_available
          }, { onConflict: 'user_id' });
        if (error) throw error;
      }

      toast({ title: 'Thành công', description: 'Đã cập nhật hồ sơ' });
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Lỗi', description: 'Không thể lưu hồ sơ', variant: 'destructive' });
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
      case 'admin': return <Shield className="w-3 h-3" />;
      case 'teacher': case 'senior_teacher': return <GraduationCap className="w-3 h-3" />;
      case 'moderator': return <Shield className="w-3 h-3" />;
      default: return <BookOpen className="w-3 h-3" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'teacher': return 'Giảng viên';
      case 'senior_teacher': return 'GV Cao cấp';
      case 'moderator': return 'Moderator';
      case 'user': return 'Học viên';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          Hồ sơ cá nhân
        </h1>
        <p className="text-muted-foreground mt-1">Cập nhật thông tin và ảnh đại diện</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar & Info Card */}
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-primary/30 via-primary/10 to-accent/20" />
          <CardContent className="pt-0 -mt-12">
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
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

              <h2 className="text-xl font-bold mt-3">{profile.full_name || 'Chưa đặt tên'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>

              <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                {roles.map(role => (
                  <Badge key={role} variant={role === 'admin' ? 'destructive' : role === 'senior_teacher' ? 'default' : 'secondary'} className="gap-1 text-xs">
                    {getRoleIcon(role)}
                    {getRoleLabel(role)}
                  </Badge>
                ))}
                {roles.length === 0 && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <BookOpen className="w-3 h-3" /> Học viên
                  </Badge>
                )}
              </div>

              {isTeacherOrAbove && (
                <div className="w-full mt-6 space-y-3">
                  <div className="flex items-center gap-2 justify-center">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{teacherProfile.rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({teacherProfile.total_reviews} đánh giá)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-lg font-bold">{teacherProfile.experience_years}</p>
                      <p className="text-[10px] text-muted-foreground">Năm KN</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Award className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-lg font-bold">{teacherProfile.certifications.length}</p>
                      <p className="text-[10px] text-muted-foreground">Chứng chỉ</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" /> Thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Họ và tên</Label>
              <Input
                value={profile.full_name || ''}
                onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Nhập họ tên đầy đủ"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled className="opacity-60" />
            </div>

            {/* Teacher-specific fields */}
            {isTeacherOrAbove && (
              <>
                <div className="border-t border-border pt-5">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Thông tin giảng viên
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Giới thiệu (Tiếng Anh)</Label>
                    <Textarea
                      value={teacherProfile.bio}
                      onChange={(e) => setTeacherProfile(p => ({ ...p, bio: e.target.value }))}
                      placeholder="Your bio in English"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Giới thiệu (Tiếng Việt)</Label>
                    <Textarea
                      value={teacherProfile.bio_vi}
                      onChange={(e) => setTeacherProfile(p => ({ ...p, bio_vi: e.target.value }))}
                      placeholder="Giới thiệu bản thân"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Số năm kinh nghiệm</Label>
                    <Input
                      type="number"
                      value={teacherProfile.experience_years}
                      onChange={(e) => setTeacherProfile(p => ({ ...p, experience_years: parseInt(e.target.value) || 0 }))}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mức phí/giờ (VND)</Label>
                    <Input
                      type="number"
                      value={teacherProfile.hourly_rate}
                      onChange={(e) => setTeacherProfile(p => ({ ...p, hourly_rate: parseInt(e.target.value) || 0 }))}
                      min={0} step={50000}
                    />
                  </div>
                </div>

                {/* Specializations */}
                <div className="space-y-2">
                  <Label>Chuyên môn</Label>
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {teacherProfile.specializations.map(item => (
                      <Badge key={item} variant="secondary" className="gap-1">
                        {item}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('spec', item)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newSpec}
                      onChange={(e) => setNewSpec(e.target.value)}
                      placeholder="VD: JLPT N1, Business Japanese..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('spec'))}
                    />
                    <Button variant="outline" size="icon" onClick={() => addItem('spec')}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Certifications */}
                <div className="space-y-2">
                  <Label>Chứng chỉ</Label>
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {teacherProfile.certifications.map(item => (
                      <Badge key={item} variant="outline" className="gap-1">
                        {item}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeItem('cert', item)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newCert}
                      onChange={(e) => setNewCert(e.target.value)}
                      placeholder="VD: JLPT N1, JPT 900+..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('cert'))}
                    />
                    <Button variant="outline" size="icon" onClick={() => addItem('cert')}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;

import { useState, useEffect } from 'react';
import { Save, Globe, BookOpen, Layers, Volume2, Settings2, Loader2, Eye, Layout, Monitor, Home, Lock, FileEdit } from 'lucide-react';
import HomepageSectionOrder from '@/components/admin/HomepageSectionOrder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePageVisibility, PageVisibilitySettings } from '@/hooks/usePageVisibility';
import { supabase } from '@/integrations/supabase/client';

const supportedLanguages = [
  { code: 'english', name: 'English', flag: '🇬🇧', levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
  { code: 'chinese', name: 'Chinese', flag: '🇨🇳', levels: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] },
  { code: 'korean', name: 'Korean', flag: '🇰🇷', levels: ['TOPIK I-1', 'TOPIK I-2', 'TOPIK II-3', 'TOPIK II-4', 'TOPIK II-5', 'TOPIK II-6'] },
  { code: 'japanese', name: 'Japanese', flag: '🇯🇵', levels: ['N5', 'N4', 'N3', 'N2', 'N1'] },
];

const exerciseTypes = [
  { id: 'reading', name: 'Bài đọc hiểu', icon: BookOpen, description: 'Đọc văn bản và trả lời câu hỏi' },
  { id: 'listening', name: 'Nghe hiểu', icon: Volume2, description: 'Nghe audio và trả lời câu hỏi' },
  { id: 'writing', name: 'Luyện viết', icon: Settings2, description: 'Viết essay, email, báo cáo' },
  { id: 'vocabulary', name: 'Từ vựng Flashcard', icon: Layers, description: 'Học từ vựng với flashcard' },
  { id: 'multiple_choice', name: 'Trắc nghiệm', icon: Settings2, description: 'Quiz nhiều lựa chọn' },
  { id: 'fill_blank', name: 'Điền vào chỗ trống', icon: Settings2, description: 'Điền từ còn thiếu' },
  { id: 'matching', name: 'Nối cặp', icon: Settings2, description: 'Ghép từ với nghĩa' },
  { id: 'sentence_order', name: 'Sắp xếp câu', icon: Settings2, description: 'Sắp xếp từ thành câu hoàn chỉnh' },
];

const publicPageLabels: Record<string, string> = {
  about: 'Giới thiệu (/gioi-thieu)',
  courses: 'Khóa học (/khoa-hoc)',
  teachers: 'Giáo viên (/giao-vien)',
  zoom: 'Zoom (/zoom)',
  blog: 'Blog (/blog)',
  faq: 'Hỏi đáp (/faq)',
  contact: 'Liên hệ (/lien-he)',
};

const navbarItemLabels: Record<string, string> = {
  about: 'Giới thiệu',
  courses: 'Khóa học',
  teachers: 'Giáo viên',
  zoom: 'Zoom',
  blog: 'Blog',
  faq: 'Hỏi đáp',
  contact: 'Liên hệ',
};

const sidebarItemLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  lessons: 'Bài học',
  exercises: 'Bài tập',
  zoom: 'Zoom Class',
  calendar: 'Lịch học',
  achievements: 'Thành tích',
  settings: 'Cài đặt',
};

interface AuthCmsSettings {
  welcome_text: string;
  login_title: string;
  signup_title: string;
  quote: string;
  vertical_text: string;
  image_url: string;
}

const defaultAuthCms: AuthCmsSettings = {
  welcome_text: 'Chào mừng bạn đến với mạng lưới đào tạo Nhật ngữ trực tuyến hàng đầu Việt Nam',
  login_title: 'Đăng nhập',
  signup_title: 'Đăng ký',
  quote: '“Bạn đã có những ngày tháng làm việc mệt mỏi, bạn đã sợ rằng ngoài 30, 40 tuổi thì không theo kịp nữa, nhưng hãy nhớ rằng nếu hôm nay bạn không đầu tư cho bản thân, năm 50, 60 bạn sẽ rơi vào vòng lặp hối tiếc”',
  vertical_text: 'Tiếng Nhật Quang Dũng Online',
  image_url: '/teachers/quang-dung.png',
};

const AdminSettings = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const { settings: pageVisibility, saveSettings: savePageVisibility } = usePageVisibility();
  const [localVisibility, setLocalVisibility] = useState<PageVisibilitySettings | null>(null);
  const [authCms, setAuthCms] = useState<AuthCmsSettings>(defaultAuthCms);
  const [authCmsId, setAuthCmsId] = useState<string | null>(null);

  const visibility = localVisibility || pageVisibility;

  const [settings, setSettings] = useState({
    enabledLanguages: ['english', 'chinese', 'korean', 'japanese'],
    enabledExerciseTypes: exerciseTypes.map(t => t.id),
    autoConfirmSubmissions: false,
    maxDailyLessons: 10,
    xpPerLesson: 25,
    streakBonus: 5,
  });

  useEffect(() => {
    supabase
      .from('website_content')
      .select('id, content, image_url')
      .eq('section_key', 'auth_settings')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAuthCmsId(data.id);
          if (data.content && typeof data.content === 'object') {
            const c = data.content as Record<string, string>;
            setAuthCms({
              welcome_text: c.welcome_text || defaultAuthCms.welcome_text,
              login_title: c.login_title || defaultAuthCms.login_title,
              signup_title: c.signup_title || defaultAuthCms.signup_title,
              quote: c.quote || defaultAuthCms.quote,
              vertical_text: c.vertical_text || defaultAuthCms.vertical_text,
              image_url: data.image_url || c.image_url || defaultAuthCms.image_url,
            });
          }
        }
      });
  }, []);

  const toggleLanguage = (code: string) => {
    setSettings(prev => ({
      ...prev,
      enabledLanguages: prev.enabledLanguages.includes(code) ? prev.enabledLanguages.filter(l => l !== code) : [...prev.enabledLanguages, code]
    }));
  };

  const toggleExerciseType = (id: string) => {
    setSettings(prev => ({
      ...prev,
      enabledExerciseTypes: prev.enabledExerciseTypes.includes(id) ? prev.enabledExerciseTypes.filter(e => e !== id) : [...prev.enabledExerciseTypes, id]
    }));
  };

  const toggleVisibility = (category: keyof PageVisibilitySettings, key: string) => {
    const current = localVisibility || pageVisibility;
    setLocalVisibility({
      ...current,
      [category]: { ...current[category], [key]: !current[category][key] }
    });
  };

  const saveAuthCms = async () => {
    const payload = {
      section_key: 'auth_settings',
      content: {
        welcome_text: authCms.welcome_text,
        login_title: authCms.login_title,
        signup_title: authCms.signup_title,
        quote: authCms.quote,
        vertical_text: authCms.vertical_text,
        image_url: authCms.image_url,
      },
      image_url: authCms.image_url,
      is_active: true,
    };

    if (authCmsId) {
      await supabase.from('website_content').update(payload).eq('id', authCmsId);
    } else {
      const { data } = await supabase.from('website_content').insert(payload).select('id').single();
      if (data) setAuthCmsId(data.id);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (localVisibility) {
        await savePageVisibility(localVisibility);
      }
      await saveAuthCms();
      toast({ title: 'Thành công', description: 'Đã lưu cài đặt' });
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể lưu cài đặt', variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground">Quản lý ngôn ngữ, bài tập, trang và cấu hình chung</p>
        </div>
        <Button onClick={handleSave} disabled={saving} variant="hero">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu cài đặt
        </Button>
      </div>

      <Tabs defaultValue="homepage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="homepage" className="flex items-center gap-2">
            <Home className="w-4 h-4" />Trang chủ
          </TabsTrigger>
          <TabsTrigger value="auth" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />Trang Auth
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />Quản lý trang
          </TabsTrigger>
          <TabsTrigger value="languages" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />Ngôn ngữ
          </TabsTrigger>
          <TabsTrigger value="exercises" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />Bài tập
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />Chung
          </TabsTrigger>
        </TabsList>

        <TabsContent value="homepage" className="space-y-4">
          <HomepageSectionOrder />
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nội dung trang Đăng nhập / Đăng ký</CardTitle>
              <CardDescription>Tùy chỉnh tiêu đề, câu trích dẫn, hình ảnh và văn bản trên trang Auth</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Dòng chào mừng (header)</label>
                <Input
                  value={authCms.welcome_text}
                  onChange={(e) => setAuthCms(prev => ({ ...prev, welcome_text: e.target.value }))}
                  placeholder="Chào mừng bạn đến với..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tiêu đề Đăng nhập</label>
                  <Input
                    value={authCms.login_title}
                    onChange={(e) => setAuthCms(prev => ({ ...prev, login_title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tiêu đề Đăng ký</label>
                  <Input
                    value={authCms.signup_title}
                    onChange={(e) => setAuthCms(prev => ({ ...prev, signup_title: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Câu trích dẫn (quote)</label>
                <Textarea
                  value={authCms.quote}
                  onChange={(e) => setAuthCms(prev => ({ ...prev, quote: e.target.value }))}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">Dùng xuống dòng (Enter) để chia thành nhiều hàng</p>
              </div>
              <div>
                <label className="text-sm font-medium">Chữ dọc bên phải ảnh</label>
                <Input
                  value={authCms.vertical_text}
                  onChange={(e) => setAuthCms(prev => ({ ...prev, vertical_text: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">URL hình ảnh giáo viên</label>
                <Input
                  value={authCms.image_url}
                  onChange={(e) => setAuthCms(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="/teachers/quang-dung.png"
                />
                {authCms.image_url && (
                  <div className="mt-2">
                    <img src={authCms.image_url} alt="Preview" className="w-32 h-32 object-contain rounded-lg border" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          {/* Public pages */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle>Trang công khai</CardTitle>
                  <CardDescription>Ẩn/hiện các trang công khai trên website</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(publicPageLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
                  <div>
                    <h4 className="font-medium">{label}</h4>
                    <p className="text-xs text-muted-foreground">{visibility.public_pages[key] ? 'Đang hiển thị' : 'Đang ẩn'}</p>
                  </div>
                  <Switch checked={visibility.public_pages[key] !== false} onCheckedChange={() => toggleVisibility('public_pages', key)} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Navbar items */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle>Menu Navbar</CardTitle>
                  <CardDescription>Ẩn/hiện các mục trong thanh điều hướng</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(navbarItemLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
                  <h4 className="font-medium">{label}</h4>
                  <Switch checked={visibility.navbar_items[key] !== false} onCheckedChange={() => toggleVisibility('navbar_items', key)} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Learn sidebar */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle>Sidebar học viên</CardTitle>
                  <CardDescription>Ẩn/hiện các mục trong sidebar trang học</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(sidebarItemLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
                  <h4 className="font-medium">{label}</h4>
                  <Switch checked={visibility.learn_sidebar[key] !== false} onCheckedChange={() => toggleVisibility('learn_sidebar', key)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages">
          <Card>
            <CardHeader>
              <CardTitle>Ngôn ngữ được hỗ trợ</CardTitle>
              <CardDescription>Chọn các ngôn ngữ muốn kích hoạt trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {supportedLanguages.map(lang => (
                <div key={lang.code} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{lang.flag}</span>
                    <div>
                      <h4 className="font-semibold">{lang.name}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {lang.levels.map(level => <Badge key={level} variant="secondary" className="text-xs">{level}</Badge>)}
                      </div>
                    </div>
                  </div>
                  <Switch checked={settings.enabledLanguages.includes(lang.code)} onCheckedChange={() => toggleLanguage(lang.code)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercises">
          <Card>
            <CardHeader>
              <CardTitle>Loại bài tập</CardTitle>
              <CardDescription>Kích hoạt/vô hiệu hóa các loại bài tập</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {exerciseTypes.map(type => (
                <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <type.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{type.name}</h4>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                  <Switch checked={settings.enabledExerciseTypes.includes(type.id)} onCheckedChange={() => toggleExerciseType(type.id)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <div className="grid gap-4">
            <Card>
              <CardHeader><CardTitle>Cấu hình học tập</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Số bài học tối đa/ngày</label>
                    <Input type="number" value={settings.maxDailyLessons} onChange={(e) => setSettings({ ...settings, maxDailyLessons: parseInt(e.target.value) })} min={1} max={50} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">XP mỗi bài học</label>
                    <Input type="number" value={settings.xpPerLesson} onChange={(e) => setSettings({ ...settings, xpPerLesson: parseInt(e.target.value) })} min={5} max={100} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Bonus XP streak</label>
                  <Input type="number" value={settings.streakBonus} onChange={(e) => setSettings({ ...settings, streakBonus: parseInt(e.target.value) })} min={1} max={50} />
                  <p className="text-xs text-muted-foreground mt-1">XP bonus cho mỗi ngày streak liên tiếp</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Chấm bài tự động</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Tự động xác nhận bài nộp</h4>
                    <p className="text-sm text-muted-foreground">Bài nộp sẽ được xác nhận tự động sau khi học viên hoàn thành</p>
                  </div>
                  <Switch checked={settings.autoConfirmSubmissions} onCheckedChange={(checked) => setSettings({ ...settings, autoConfirmSubmissions: checked })} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;

import { useState } from 'react';
import { Save, Globe, BookOpen, Layers, Volume2, Settings2, Loader2, Eye, Layout, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePageVisibility, PageVisibilitySettings } from '@/hooks/usePageVisibility';

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

const AdminSettings = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const { settings: pageVisibility, saveSettings: savePageVisibility } = usePageVisibility();
  const [localVisibility, setLocalVisibility] = useState<PageVisibilitySettings | null>(null);

  const visibility = localVisibility || pageVisibility;
  
  const [settings, setSettings] = useState({
    enabledLanguages: ['english', 'chinese', 'korean', 'japanese'],
    enabledExerciseTypes: exerciseTypes.map(t => t.id),
    autoConfirmSubmissions: false,
    maxDailyLessons: 10,
    xpPerLesson: 25,
    streakBonus: 5,
  });

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

  const handleSave = async () => {
    setSaving(true);
    try {
      if (localVisibility) {
        await savePageVisibility(localVisibility);
      }
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

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
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

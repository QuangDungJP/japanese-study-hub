import { useState, useEffect } from 'react';
import { 
  BookOpen, Clock, Award, Languages, BarChart3, Eye, EyeOff,
  Save, X, Image, Film, FileText, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MediaUploader from '@/components/shared/MediaUploader';
import { cn } from '@/lib/utils';

interface LessonFormData {
  title: string;
  title_vi: string;
  description: string;
  description_vi: string;
  skill: string;
  level: string;
  duration_minutes: number;
  xp_reward: number;
  thumbnail_url?: string;
  video_url?: string;
  content_html?: string;
}

interface LessonEditorProps {
  initialData?: LessonFormData;
  onSubmit: (data: LessonFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const skillOptions = [
  { value: 'reading', label: 'Đọc hiểu', icon: '📖', color: 'bg-blue-500/10 text-blue-600' },
  { value: 'listening', label: 'Nghe', icon: '🎧', color: 'bg-purple-500/10 text-purple-600' },
  { value: 'speaking', label: 'Nói', icon: '🗣️', color: 'bg-green-500/10 text-green-600' },
  { value: 'writing', label: 'Viết', icon: '✍️', color: 'bg-orange-500/10 text-orange-600' },
  { value: 'vocabulary', label: 'Từ vựng', icon: '📚', color: 'bg-pink-500/10 text-pink-600' },
  { value: 'grammar', label: 'Ngữ pháp', icon: '📝', color: 'bg-cyan-500/10 text-cyan-600' },
];

const levelOptions = [
  { value: 'N5', label: 'N5 - Sơ cấp', description: 'Mới bắt đầu' },
  { value: 'N4', label: 'N4 - Sơ trung cấp', description: 'Cơ bản' },
  { value: 'N3', label: 'N3 - Trung cấp', description: 'Trung bình' },
  { value: 'N2', label: 'N2 - Trung cao cấp', description: 'Nâng cao' },
  { value: 'N1', label: 'N1 - Cao cấp', description: 'Thành thạo' },
];

const LessonEditor = ({ initialData, onSubmit, onCancel, isEditing }: LessonEditorProps) => {
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    title_vi: '',
    description: '',
    description_vi: '',
    skill: 'reading',
    level: 'N5',
    duration_minutes: 15,
    xp_reward: 25,
    thumbnail_url: '',
    video_url: '',
    content_html: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(formData);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof LessonFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedSkill = skillOptions.find(s => s.value === formData.skill);
  const selectedLevel = levelOptions.find(l => l.value === formData.level);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {isEditing ? 'Chỉnh sửa bài học' : 'Tạo bài học mới'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Điền thông tin chi tiết cho bài học của bạn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={showPreview}
              onCheckedChange={setShowPreview}
            />
            <span className="text-sm text-muted-foreground">
              {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </span>
          </div>
          <Button variant="ghost" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Tạo bài học')}
          </Button>
        </div>
      </div>

      <div className={cn(
        'grid gap-6',
        showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'
      )}>
        {/* Form */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="gap-2">
                <FileText className="w-4 h-4" />
                Thông tin
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-2">
                <Image className="w-4 h-4" />
                Media
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Nội dung
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Titles */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Tiêu đề bài học
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Tiếng Anh / Tiếng Nhật</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="Lesson title"
                        className="font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Tiếng Việt</Label>
                      <Input
                        value={formData.title_vi}
                        onChange={(e) => updateField('title_vi', e.target.value)}
                        placeholder="Tên bài học"
                        className="font-medium"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Descriptions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Mô tả
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Tiếng Anh / Tiếng Nhật</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Brief lesson description..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Tiếng Việt</Label>
                      <Textarea
                        value={formData.description_vi}
                        onChange={(e) => updateField('description_vi', e.target.value)}
                        placeholder="Mô tả ngắn gọn về bài học..."
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Cài đặt bài học
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Skill Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Kỹ năng</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {skillOptions.map((skill) => (
                        <button
                          key={skill.value}
                          type="button"
                          onClick={() => updateField('skill', skill.value)}
                          className={cn(
                            'flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left',
                            formData.skill === skill.value
                              ? 'border-primary bg-primary/5'
                              : 'border-transparent bg-muted/50 hover:bg-muted'
                          )}
                        >
                          <span className="text-xl">{skill.icon}</span>
                          <span className="text-sm font-medium">{skill.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Level Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Trình độ JLPT</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => updateField('level', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {levelOptions.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {level.value}
                              </Badge>
                              <span>{level.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration & XP */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Thời lượng (phút)
                      </Label>
                      <Input
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => updateField('duration_minutes', parseInt(e.target.value) || 15)}
                        min={5}
                        max={120}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Điểm XP thưởng
                      </Label>
                      <Input
                        type="number"
                        value={formData.xp_reward}
                        onChange={(e) => updateField('xp_reward', parseInt(e.target.value) || 25)}
                        min={10}
                        max={500}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              {/* Thumbnail */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Ảnh thumbnail
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MediaUploader
                    value={formData.thumbnail_url}
                    onChange={(url) => updateField('thumbnail_url', url)}
                    accept="image"
                    folder="lesson-thumbnails"
                    placeholder="Upload ảnh đại diện cho bài học"
                    aspectRatio="video"
                  />
                </CardContent>
              </Card>

              {/* Video */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    Video bài giảng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MediaUploader
                    value={formData.video_url}
                    onChange={(url) => updateField('video_url', url)}
                    accept="video"
                    folder="lesson-videos"
                    maxSizeMB={100}
                    placeholder="Upload video bài giảng (tùy chọn)"
                    aspectRatio="video"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Nội dung bài học
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.content_html}
                    onChange={(e) => updateField('content_html', e.target.value)}
                    placeholder="Nội dung chi tiết bài học (có thể dùng HTML/Markdown)..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Tip: Sau khi tạo bài học, bạn có thể thêm các bài tập (flashcard, trắc nghiệm, điền từ...) từ trang quản lý bài học.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="sticky top-4">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 px-4 py-2 border-b">
                <span className="text-xs font-medium text-muted-foreground">Xem trước bài học</span>
              </div>
              <CardContent className="p-0">
                {/* Thumbnail preview */}
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {formData.thumbnail_url ? (
                    <img
                      src={formData.thumbnail_url}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : formData.video_url ? (
                    <video
                      src={formData.video_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Image className="w-12 h-12 opacity-30" />
                    </div>
                  )}
                  
                  {/* Badges overlay */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {selectedSkill && (
                      <Badge className={selectedSkill.color}>
                        {selectedSkill.icon} {selectedSkill.label}
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                      {formData.level}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-lg">
                    {formData.title_vi || 'Tên bài học'}
                  </h3>
                  {formData.title && formData.title !== formData.title_vi && (
                    <p className="text-sm text-muted-foreground">
                      {formData.title}
                    </p>
                  )}
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {formData.description_vi || formData.description || 'Mô tả bài học...'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formData.duration_minutes} phút
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-yellow-500" />
                      +{formData.xp_reward} XP
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonEditor;

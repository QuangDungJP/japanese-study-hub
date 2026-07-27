import { useState, useEffect } from 'react';
import { 
  BookOpen, Clock, Award, Save, X, Image, Film, FileText, 
  Link as LinkIcon, Paperclip, ChevronDown, ChevronUp, Sparkles, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  slide_url?: string;
  document_url?: string;
  content_html?: string;
}

interface LessonEditorProps {
  initialData?: LessonFormData;
  onSubmit: (data: LessonFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const skillOptions = [
  { value: 'reading', label: '📖 Đọc hiểu' },
  { value: 'listening', label: '🎧 Nghe' },
  { value: 'speaking', label: '🗣️ Nói' },
  { value: 'writing', label: '✍️ Viết' },
  { value: 'vocabulary', label: '📚 Từ vựng' },
  { value: 'grammar', label: '📝 Ngữ pháp' },
];

const levelOptions = [
  { value: 'N5', label: 'N5 - Mới bắt đầu' },
  { value: 'N4', label: 'N4 - Cơ bản' },
  { value: 'N3', label: 'N3 - Trung cấp' },
  { value: 'N2', label: 'N2 - Nâng cao' },
  { value: 'N1', label: 'N1 - Cao cấp' },
];

const LessonEditor = ({ initialData, onSubmit, onCancel, isEditing }: LessonEditorProps) => {
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
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
    slide_url: '',
    document_url: '',
    content_html: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleSubmit = async () => {
    if (!formData.title_vi.trim()) {
      alert('Vui lòng nhập Tên bài học / Tài liệu!');
      return;
    }

    setSaving(true);
    try {
      const payload: LessonFormData = {
        ...formData,
        title: formData.title || formData.title_vi,
        description: formData.description || formData.description_vi,
      };
      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof LessonFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
            📖
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isEditing ? 'Chỉnh sửa Bài học / Tài liệu' : 'Tạo Bài học / Tài liệu mới'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Đăng tài liệu PDF, slide bài giảng hoặc video cho lớp học
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onCancel} size="sm">
            <X className="w-4 h-4 mr-1" />
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={saving} size="sm" className="font-bold gap-1.5 shadow-md">
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Đăng bài học')}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Main Title Input (Google Classroom Style) */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-foreground flex items-center gap-1">
            Tên bài học / Tài liệu <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.title_vi}
            onChange={(e) => updateField('title_vi', e.target.value)}
            placeholder="Ví dụ: Slide Bài 1 Minna no Nihongo / Bài đọc JLPT N3..."
            className="h-12 text-base font-semibold border-border/80 bg-card rounded-xl"
            autoFocus
          />
        </div>

        {/* Description / Instructions (Optional) */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground">
            Mô tả / Hướng dẫn học tập (Không bắt buộc)
          </Label>
          <Textarea
            value={formData.description_vi}
            onChange={(e) => updateField('description_vi', e.target.value)}
            placeholder="Nhập hướng dẫn dành cho học viên..."
            rows={3}
            className="text-sm bg-card rounded-xl"
          />
        </div>

        {/* Attachments Section (Google Classroom Style - Complete File & Slide Link Options) */}
        <Card className="border-border/80 shadow-soft">
          <CardContent className="p-4 space-y-4">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-primary" />
              Đính kèm Tài liệu PDF, DOCX, Slide hoặc Video (Tùy chọn)
            </Label>

            {/* Slide Link / External Drive Link */}
            <div className="space-y-1.5 bg-muted/30 p-3 rounded-xl border border-border/60">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-primary" />
                Đường dẫn Slide trình chiếu (Google Slides / Canva / Google Drive link)
              </Label>
              <Input
                value={formData.slide_url || ''}
                onChange={(e) => updateField('slide_url', e.target.value)}
                placeholder="Dán link https://docs.google.com/presentation... hoặc link Canva tại đây"
                className="bg-card text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Document File Upload */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                  <FileText className="w-3.5 h-3.5 text-primary" /> Tải tệp PDF / Word / PPTX
                </Label>
                <MediaUploader
                  value={formData.document_url || ''}
                  onChange={(url) => updateField('document_url', url)}
                  accept="document"
                  folder="lesson-documents"
                  placeholder="Upload PDF, DOCX, PPTX..."
                  maxSizeMB={50}
                />
              </div>

              {/* Cover Image / Thumbnail Upload */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                  <Image className="w-3.5 h-3.5 text-blue-500" /> Ảnh bìa bài học (Thumbnail)
                </Label>
                <MediaUploader
                  value={formData.thumbnail_url || ''}
                  onChange={(url) => updateField('thumbnail_url', url)}
                  accept="image"
                  folder="lesson-thumbnails"
                  placeholder="Upload ảnh đại diện"
                  aspectRatio="video"
                />
              </div>

              {/* Video Lesson Upload */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                  <Film className="w-3.5 h-3.5 text-purple-500" /> Video bài giảng
                </Label>
                <MediaUploader
                  value={formData.video_url || ''}
                  onChange={(url) => updateField('video_url', url)}
                  accept="video"
                  folder="lesson-videos"
                  maxSizeMB={100}
                  placeholder="Upload video MP4"
                  aspectRatio="video"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Lesson Content / Markdown (Optional) */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            Nội dung bài học / Văn bản chi tiết (Không bắt buộc)
          </Label>
          <Textarea
            value={formData.content_html}
            onChange={(e) => updateField('content_html', e.target.value)}
            placeholder="Nội dung bài đọc, từ vựng hoặc văn bản hướng dẫn chi tiết..."
            rows={4}
            className="font-mono text-sm bg-card rounded-xl"
          />
        </div>

        {/* Collapsible Advanced Settings (Optional - Defaulted for quick save) */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="border rounded-2xl p-4 bg-muted/20">
          <CollapsibleTrigger asChild>
            <button type="button" className="w-full flex items-center justify-between font-bold text-xs text-muted-foreground hover:text-foreground">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Cài đặt phân loại (Kỹ năng, Trình độ JLPT, Điểm XP - Không bắt buộc)
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Skill */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Kỹ năng phân loại</Label>
                <Select value={formData.skill} onValueChange={(val) => updateField('skill', val)}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {skillOptions.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Level */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Trình độ JLPT</Label>
                <Select value={formData.level} onValueChange={(val) => updateField('level', val)}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map(l => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Thời lượng học (phút)
                </Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => updateField('duration_minutes', parseInt(e.target.value) || 15)}
                  min={5}
                  max={180}
                  className="bg-card"
                />
              </div>

              {/* XP Reward */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Award className="w-3 h-3" /> Điểm XP thưởng khi hoàn thành
                </Label>
                <Input
                  type="number"
                  value={formData.xp_reward}
                  onChange={(e) => updateField('xp_reward', parseInt(e.target.value) || 25)}
                  min={10}
                  max={500}
                  className="bg-card"
                />
              </div>
            </div>

            {/* Optional English Title */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tên bài học Tiếng Anh (Không bắt buộc)</Label>
              <Input
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Tự động lấy tên tiếng Việt nếu bỏ trống"
                className="bg-card text-xs"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="ghost" onClick={onCancel}>Hủy</Button>
        <Button onClick={handleSubmit} disabled={saving} className="font-bold px-6 shadow-md">
          {saving ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Đăng bài học')}
        </Button>
      </div>
    </div>
  );
};

export default LessonEditor;

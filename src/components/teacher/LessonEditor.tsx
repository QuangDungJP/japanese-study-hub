import { useState, useEffect } from 'react';
import {
  BookOpen, Clock, BarChart3, Eye, EyeOff, Hash,
  Save, X, Image, Film, FileText, Sparkles, FolderOpen, Users, CalendarClock, Infinity as InfinityIcon,
  Tag, Target,
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
import MaterialsManager from '@/components/teacher/MaterialsManager';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LessonFormData, EMPTY_LESSON } from '@/lib/lessonSchema';

interface LessonEditorProps {
  initialData?: LessonFormData;
  lessonId?: string;
  onSubmit: (data: LessonFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const DEFAULT_SKILL_SUGGESTIONS = ['Đọc hiểu', 'Nghe', 'Nói', 'Viết', 'Từ vựng', 'Ngữ pháp', 'Kanji'];
const DEFAULT_LEVEL_SUGGESTIONS = ['N5', 'N4', 'N3', 'N2', 'N1'];

const toLocalInput = (v?: string | null) => {
  if (!v) return '';
  const d = new Date(v);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
};

const LessonEditor = ({ initialData, lessonId, onSubmit, onCancel, isEditing }: LessonEditorProps) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [recentSkills, setRecentSkills] = useState<string[]>([]);
  const [recentLevels, setRecentLevels] = useState<string[]>([]);

  const [formData, setFormData] = useState<LessonFormData>({ ...EMPTY_LESSON });
  const [tagInput, setTagInput] = useState('');

  const [unlimited, setUnlimited] = useState(true);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      setUnlimited(!initialData.end_at);
    }
  }, [initialData]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: cls }, { data: lessons }] = await Promise.all([
        supabase.from('classes').select('id, name').eq('teacher_id', user.id).order('created_at', { ascending: false }),
        supabase.from('lessons').select('skill, level').eq('teacher_id', user.id).limit(300),
      ]);
      setClasses(((cls as any) || []).map((c: any) => ({ id: c.id, name: c.name })));
      const skillSet = new Set<string>();
      const levelSet = new Set<string>();
      ((lessons as any) || []).forEach((l: any) => {
        if (l.skill) skillSet.add(l.skill);
        if (l.level) String(l.level).split(',').map((x: string) => x.trim()).filter(Boolean).forEach((v: string) => levelSet.add(v));
      });
      setRecentSkills(Array.from(skillSet).slice(0, 12));
      setRecentLevels(Array.from(levelSet).slice(0, 12));
    })();
  }, [user]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload: LessonFormData = {
        ...formData,
        end_at: unlimited ? null : (formData.end_at || null),
        start_at: formData.start_at || null,
        class_id: formData.class_id || null,
      };
      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof LessonFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const skillSuggestions = Array.from(new Set([...recentSkills, ...DEFAULT_SKILL_SUGGESTIONS]));
  const levelSuggestions = Array.from(new Set([...recentLevels, ...DEFAULT_LEVEL_SUGGESTIONS]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {isEditing ? 'Chỉnh sửa bài học' : 'Tạo bài học mới'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tự đặt tên kỹ năng, giao theo lớp và thời gian linh hoạt
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={showPreview} onCheckedChange={setShowPreview} />
            <span className="text-sm text-muted-foreground">
              {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </span>
          </div>
          <Button variant="ghost" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Tạo bài học')}
          </Button>
        </div>
      </div>

      <div className={cn('grid gap-6', showPreview ? 'lg:grid-cols-2' : 'grid-cols-1')}>
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={cn('grid w-full', lessonId ? 'grid-cols-5' : 'grid-cols-4')}>
              <TabsTrigger value="basic" className="gap-2"><FileText className="w-4 h-4" />Thông tin</TabsTrigger>
              <TabsTrigger value="assign" className="gap-2"><CalendarClock className="w-4 h-4" />Giao bài</TabsTrigger>
              <TabsTrigger value="media" className="gap-2"><Image className="w-4 h-4" />Media</TabsTrigger>
              <TabsTrigger value="content" className="gap-2"><Sparkles className="w-4 h-4" />Nội dung</TabsTrigger>
              {lessonId && (
                <TabsTrigger value="materials" className="gap-2"><FolderOpen className="w-4 h-4" />Tài liệu</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" />Tiêu đề bài học</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Tiêu đề chính <span className="text-destructive">*</span></Label>
                      <Input value={formData.title_vi} onChange={(e) => updateField('title_vi', e.target.value)} placeholder="Tên bài học" className="font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Tiêu đề phụ (tùy chọn)</Label>
                      <Input value={formData.title} onChange={(e) => updateField('title', e.target.value)} placeholder="VD: Lesson title / 課題タイトル" className="font-medium" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" />Mô tả</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Mô tả chính</Label>
                      <Textarea value={formData.description_vi} onChange={(e) => updateField('description_vi', e.target.value)} placeholder="Mô tả ngắn gọn..." rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Mô tả phụ (tùy chọn)</Label>
                      <Textarea value={formData.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Optional secondary description..." rows={3} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" />Cài đặt bài học</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Skill: free-text + suggestions */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Kỹ năng (giáo viên tự đặt tên)</Label>
                    <Input
                      list="skill-suggestions"
                      value={formData.skill}
                      onChange={(e) => updateField('skill', e.target.value)}
                      placeholder="VD: Đọc hiểu, Kanji N3, Luyện thi JLPT..."
                    />
                    <datalist id="skill-suggestions">
                      {skillSuggestions.map((s) => <option key={s} value={s} />)}
                    </datalist>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {skillSuggestions.slice(0, 8).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateField('skill', s)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs border transition-all',
                            formData.skill === s
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted/50 hover:bg-muted border-transparent text-muted-foreground'
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Levels */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Trình độ / danh mục (giáo viên tự đặt)
                    </Label>
                    <Input
                      list="level-suggestions"
                      value={formData.level}
                      onChange={(e) => updateField('level', e.target.value)}
                      placeholder="VD: N3, Sơ cấp, Beginner, IELTS 6.5..."
                    />
                    <datalist id="level-suggestions">
                      {levelSuggestions.map((s) => <option key={s} value={s} />)}
                    </datalist>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {levelSuggestions.slice(0, 10).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateField('level', s)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs border transition-all',
                            formData.level === s
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted/50 hover:bg-muted border-transparent text-muted-foreground'
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />Thời lượng (phút)</Label>
                      <Input type="number" value={formData.duration_minutes} onChange={(e) => updateField('duration_minutes', parseInt(e.target.value) || 15)} min={1} max={600} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1"><Hash className="w-3 h-3" />Vị trí sắp xếp</Label>
                      <Input type="number" value={formData.order_index ?? 0} onChange={(e) => updateField('order_index', parseInt(e.target.value) || 0)} min={0} placeholder="0" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4" />Mục tiêu & Thẻ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Mục tiêu bài học</Label>
                      <Textarea
                        value={formData.objectives || ''}
                        onChange={(e) => updateField('objectives', e.target.value)}
                        placeholder="VD: Học xong, học viên có thể giới thiệu bản thân bằng N5..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Yêu cầu tiên quyết</Label>
                      <Textarea
                        value={formData.prerequisites || ''}
                        onChange={(e) => updateField('prerequisites', e.target.value)}
                        placeholder="VD: Đã biết Hiragana, Katakana"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Độ khó</Label>
                      <Select value={formData.difficulty || ''} onValueChange={(v) => updateField('difficulty', v)}>
                        <SelectTrigger><SelectValue placeholder="Chọn độ khó" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Dễ</SelectItem>
                          <SelectItem value="medium">Trung bình</SelectItem>
                          <SelectItem value="hard">Khó</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Thời lượng ước tính tự học (phút)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.estimated_minutes ?? ''}
                        onChange={(e) => updateField('estimated_minutes', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Tùy chọn"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="w-3 h-3" />Thẻ (Tags)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const t = tagInput.trim();
                            if (t && !(formData.tags || []).includes(t)) {
                              updateField('tags', [...(formData.tags || []), t]);
                            }
                            setTagInput('');
                          }
                        }}
                        placeholder="Nhập thẻ rồi Enter (VD: JLPT, n5, ngữ pháp)"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const t = tagInput.trim();
                          if (t && !(formData.tags || []).includes(t)) {
                            updateField('tags', [...(formData.tags || []), t]);
                          }
                          setTagInput('');
                        }}
                      >Thêm</Button>
                    </div>
                    {(formData.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(formData.tags || []).map((t) => (
                          <Badge key={t} variant="secondary" className="gap-1">
                            {t}
                            <button
                              type="button"
                              onClick={() => updateField('tags', (formData.tags || []).filter((x) => x !== t))}
                              className="ml-1 hover:text-destructive"
                            >×</button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assign" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" />Giao cho lớp</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Chọn lớp áp dụng (để trống = mở cho tất cả học viên)</Label>
                  <Select
                    value={formData.class_id || 'all'}
                    onValueChange={(v) => updateField('class_id', v === 'all' ? null : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Chọn lớp" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">— Tất cả học viên —</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {classes.length === 0 && (
                    <p className="text-xs text-muted-foreground">Bạn chưa có lớp nào. Hãy tạo lớp ở trang "Lớp học" trước.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><CalendarClock className="w-4 h-4" />Thời gian mở bài</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center gap-2">
                      <InfinityIcon className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Mở vô hạn</p>
                        <p className="text-xs text-muted-foreground">Học viên truy cập được bất kỳ lúc nào (không có hạn nộp)</p>
                      </div>
                    </div>
                    <Switch checked={unlimited} onCheckedChange={(v) => {
                      setUnlimited(v);
                      if (v) updateField('end_at', null);
                    }} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Mở từ (tùy chọn)</Label>
                      <Input
                        type="datetime-local"
                        value={toLocalInput(formData.start_at)}
                        onChange={(e) => updateField('start_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={cn("text-xs text-muted-foreground", unlimited && "opacity-50")}>
                        Đóng / Hạn nộp {unlimited && '(đã tắt)'}
                      </Label>
                      <Input
                        type="datetime-local"
                        disabled={unlimited}
                        value={toLocalInput(formData.end_at)}
                        onChange={(e) => updateField('end_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Bài học/bài tập sẽ chỉ hiện với học viên trong khung giờ này. Phù hợp cho cả bài tự học (vô hạn) và bài kiểm tra có hạn nộp.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Image className="w-4 h-4" />Ảnh thumbnail</CardTitle></CardHeader>
                <CardContent>
                  <MediaUploader value={formData.thumbnail_url} onChange={(url) => updateField('thumbnail_url', url)} accept="image" folder="lesson-thumbnails" placeholder="Upload ảnh đại diện" aspectRatio="video" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Film className="w-4 h-4" />Video bài giảng</CardTitle></CardHeader>
                <CardContent>
                  <MediaUploader value={formData.video_url} onChange={(url) => updateField('video_url', url)} accept="video" folder="lesson-videos" maxSizeMB={100} placeholder="Upload video (tùy chọn)" aspectRatio="video" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4" />Nội dung bài học</CardTitle></CardHeader>
                <CardContent>
                  <Textarea value={formData.content_html} onChange={(e) => updateField('content_html', e.target.value)} placeholder="Nội dung chi tiết (HTML/Markdown)..." rows={12} className="font-mono text-sm" />
                  <p className="text-xs text-muted-foreground mt-2">💡 Sau khi tạo bài học, có thể thêm bài tập (flashcard, trắc nghiệm, điền từ...) ở tab Module bài tập.</p>
                </CardContent>
              </Card>
            </TabsContent>

            {lessonId && (
              <TabsContent value="materials" className="space-y-4 mt-4">
                <MaterialsManager scope={{ kind: 'lesson', lessonId }} title="Tài liệu đính kèm bài học" />
              </TabsContent>
            )}
          </Tabs>
        </div>

        {showPreview && (
          <div className="sticky top-4">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 px-4 py-2 border-b">
                <span className="text-xs font-medium text-muted-foreground">Xem trước bài học</span>
              </div>
              <CardContent className="p-0">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {formData.thumbnail_url ? (
                    <img src={formData.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : formData.video_url ? (
                    <video src={formData.video_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Image className="w-12 h-12 opacity-30" /></div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                    {formData.skill && <Badge className="bg-primary/10 text-primary">{formData.skill}</Badge>}
                    {(formData.level || '').split(',').map((s) => s.trim()).filter(Boolean).map((lv) => (
                      <Badge key={lv} variant="outline" className="bg-background/80 backdrop-blur-sm font-mono">{lv}</Badge>
                    ))}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-lg">{formData.title_vi || formData.title || 'Tên bài học'}</h3>
                  {formData.title && formData.title_vi && formData.title !== formData.title_vi && (
                    <p className="text-sm text-muted-foreground">{formData.title}</p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">{formData.description_vi || formData.description || 'Mô tả bài học...'}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t flex-wrap">
                    <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{formData.duration_minutes} phút</div>
                    {(formData.order_index ?? 0) > 0 && <div className="flex items-center gap-1"><Hash className="w-3 h-3" />#{formData.order_index}</div>}
                    {formData.class_id && <Badge variant="outline">Theo lớp</Badge>}
                    {unlimited ? (
                      <Badge variant="outline" className="gap-1"><InfinityIcon className="w-3 h-3" />Vô hạn</Badge>
                    ) : formData.end_at ? (
                      <Badge variant="outline">Hạn: {new Date(formData.end_at).toLocaleDateString('vi-VN')}</Badge>
                    ) : null}
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

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, BookOpen, Loader2, Clock, DollarSign, X, Users, Settings2 } from 'lucide-react';
import RichTextEditor from '@/components/admin/RichTextEditor';

interface TimelineItem { week: string; title: string; description: string }
interface FaqItem { q: string; a: string }
interface Testimonial { name: string; role: string; content: string; avatar: string }
interface CustomField { label: string; value: string; icon?: string }

interface SectionVisibility {
  hero: boolean; highlights: boolean; outcomes: boolean; features: boolean;
  timeline: boolean; teachers: boolean; gallery: boolean; testimonials: boolean;
  faq: boolean; related: boolean; enrollment: boolean; certificate: boolean; custom: boolean;
}

const defaultVisibility: SectionVisibility = {
  hero: true, highlights: true, outcomes: true, features: true,
  timeline: true, teachers: true, gallery: true, testimonials: true,
  faq: true, related: true, enrollment: true, certificate: true, custom: true,
};

interface Course {
  id: string;
  title: string; title_vi: string;
  subtitle: string | null; subtitle_vi: string | null;
  description: string | null; description_vi: string | null;
  long_description: string | null; long_description_vi: string | null;
  price: number; original_price: number | null;
  duration_weeks: number | null;
  level: string; language: string;
  is_published: boolean | null;
  features: any; thumbnail_url: string | null;
  intro_video_url: string | null; certificate_image_url: string | null;
  gallery_urls: any;
  enrollment_capacity: number | null; enrolled_count: number;
  enrollment_status: string;
  start_date: string | null;
  schedule_text_vi: string | null; schedule_text: string | null;
  location_vi: string | null; location: string | null;
  timeline: any; highlights: any; requirements: any; outcomes: any;
  faq: any; testimonials: any; custom_fields: any;
  section_visibility: any;
  created_at: string;
}

interface JlptLevel { id: string; value: string; label: string; label_vi: string; order_index: number; is_active: boolean }
const defaultJlptLevels: JlptLevel[] = [
  { id: '1', value: 'N5', label: 'JLPT N5 - Beginner', label_vi: 'JLPT N5 - Cơ bản', order_index: 1, is_active: true },
  { id: '2', value: 'N4', label: 'JLPT N4 - Elementary', label_vi: 'JLPT N4 - Sơ cấp', order_index: 2, is_active: true },
  { id: '3', value: 'N3', label: 'JLPT N3 - Intermediate', label_vi: 'JLPT N3 - Trung cấp', order_index: 3, is_active: true },
  { id: '4', value: 'N2', label: 'JLPT N2 - Upper Intermediate', label_vi: 'JLPT N2 - Cao cấp', order_index: 4, is_active: true },
  { id: '5', value: 'N1', label: 'JLPT N1 - Advanced', label_vi: 'JLPT N1 - Thành thạo', order_index: 5, is_active: true },
];

const enrollmentStatuses = [
  { value: 'open', label: '🟢 Đang tuyển sinh' },
  { value: 'almost_full', label: '🟡 Sắp đầy' },
  { value: 'full', label: '🔴 Đã đầy' },
  { value: 'upcoming', label: '⏳ Sắp khai giảng' },
  { value: 'closed', label: '⚫ Đã đóng' },
];

interface TeacherOption { id: string; display_name: string | null; image_url: string | null }

const toLines = (arr: any): string => Array.isArray(arr) ? arr.join('\n') : '';
const fromLines = (s: string): string[] => s.split('\n').map(x => x.trim()).filter(Boolean);

const AdminCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [allTeachers, setAllTeachers] = useState<TeacherOption[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [jlptLevels, setJlptLevels] = useState<JlptLevel[]>(defaultJlptLevels);
  const [levelsDialogOpen, setLevelsDialogOpen] = useState(false);
  const [newLevel, setNewLevel] = useState({ value: '', label: '', label_vi: '' });
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: '', title_vi: '',
    subtitle: '', subtitle_vi: '',
    description: '', description_vi: '',
    long_description: '', long_description_vi: '',
    price: 0, original_price: 0,
    duration_weeks: 12,
    level: 'N5', language: 'japanese',
    is_published: false,
    thumbnail_url: '',
    intro_video_url: '', certificate_image_url: '',
    galleryText: '',
    enrollment_capacity: 0, enrolled_count: 0,
    enrollment_status: 'open',
    start_date: '',
    schedule_text_vi: '', schedule_text: '',
    location_vi: '', location: '',
    featuresText: '',
    highlightsText: '',
    requirementsText: '',
    outcomesText: '',
    timeline: [] as TimelineItem[],
    faq: [] as FaqItem[],
    testimonials: [] as Testimonial[],
    custom_fields: [] as CustomField[],
    section_visibility: { ...defaultVisibility },
  });

  useEffect(() => { fetchCourses(); fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from('teacher_profiles')
      .select('id, display_name, image_url')
      .order('order_index', { ascending: true });
    setAllTeachers(data || []);
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses').select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCourses((data || []) as any);
    } catch (e) {
      toast({ title: 'Lỗi', description: 'Không thể tải khóa học', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({
      title: '', title_vi: '', subtitle: '', subtitle_vi: '',
      description: '', description_vi: '',
      long_description: '', long_description_vi: '',
      price: 0, original_price: 0, duration_weeks: 12,
      level: 'N5', language: 'japanese', is_published: false,
      thumbnail_url: '', intro_video_url: '', certificate_image_url: '',
      galleryText: '',
      enrollment_capacity: 0, enrolled_count: 0, enrollment_status: 'open',
      start_date: '', schedule_text_vi: '', schedule_text: '',
      location_vi: '', location: '',
      featuresText: '', highlightsText: '', requirementsText: '', outcomesText: '',
      timeline: [], faq: [], testimonials: [], custom_fields: [],
      section_visibility: { ...defaultVisibility },
    });
    setSelectedTeacherIds([]);
    setEditingCourse(null);
  };

  const openEditDialog = async (c: Course) => {
    setEditingCourse(c);
    setForm({
      title: c.title, title_vi: c.title_vi,
      subtitle: c.subtitle || '', subtitle_vi: c.subtitle_vi || '',
      description: c.description || '', description_vi: c.description_vi || '',
      long_description: c.long_description || '', long_description_vi: c.long_description_vi || '',
      price: c.price, original_price: c.original_price || 0,
      duration_weeks: c.duration_weeks || 12,
      level: c.level, language: c.language,
      is_published: !!c.is_published,
      thumbnail_url: c.thumbnail_url || '',
      intro_video_url: c.intro_video_url || '',
      certificate_image_url: c.certificate_image_url || '',
      galleryText: toLines(c.gallery_urls),
      enrollment_capacity: c.enrollment_capacity || 0,
      enrolled_count: c.enrolled_count || 0,
      enrollment_status: c.enrollment_status || 'open',
      start_date: c.start_date || '',
      schedule_text_vi: c.schedule_text_vi || '', schedule_text: c.schedule_text || '',
      location_vi: c.location_vi || '', location: c.location || '',
      featuresText: toLines(c.features),
      highlightsText: toLines(c.highlights),
      requirementsText: toLines(c.requirements),
      outcomesText: toLines(c.outcomes),
      timeline: Array.isArray(c.timeline) ? c.timeline : [],
      faq: Array.isArray(c.faq) ? c.faq : [],
      testimonials: Array.isArray(c.testimonials) ? c.testimonials : [],
      custom_fields: Array.isArray(c.custom_fields) ? c.custom_fields : [],
      section_visibility: { ...defaultVisibility, ...(c.section_visibility || {}) },
    });
    const { data: ct } = await (supabase as any).from('course_teachers').select('teacher_id').eq('course_id', c.id);
    setSelectedTeacherIds((ct || []).map((x: any) => x.teacher_id));
    setIsDialogOpen(true);
  };

  const toggleTeacher = (id: string) =>
    setSelectedTeacherIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const saveCourseTeachers = async (courseId: string) => {
    await (supabase as any).from('course_teachers').delete().eq('course_id', courseId);
    if (selectedTeacherIds.length > 0) {
      await (supabase as any).from('course_teachers').insert(
        selectedTeacherIds.map((teacher_id, idx) => ({ course_id: courseId, teacher_id, order_index: idx }))
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        title: form.title, title_vi: form.title_vi,
        subtitle: form.subtitle || null, subtitle_vi: form.subtitle_vi || null,
        description: form.description || null, description_vi: form.description_vi || null,
        long_description: form.long_description || null, long_description_vi: form.long_description_vi || null,
        price: form.price, original_price: form.original_price || null,
        duration_weeks: form.duration_weeks,
        level: form.level, language: form.language,
        is_published: form.is_published,
        thumbnail_url: form.thumbnail_url || null,
        intro_video_url: form.intro_video_url || null,
        certificate_image_url: form.certificate_image_url || null,
        gallery_urls: fromLines(form.galleryText),
        enrollment_capacity: form.enrollment_capacity || null,
        enrolled_count: form.enrolled_count || 0,
        enrollment_status: form.enrollment_status,
        start_date: form.start_date || null,
        schedule_text_vi: form.schedule_text_vi || null, schedule_text: form.schedule_text || null,
        location_vi: form.location_vi || null, location: form.location || null,
        features: fromLines(form.featuresText),
        highlights: fromLines(form.highlightsText),
        requirements: fromLines(form.requirementsText),
        outcomes: fromLines(form.outcomesText),
        timeline: form.timeline,
        faq: form.faq,
        testimonials: form.testimonials,
        custom_fields: form.custom_fields,
        section_visibility: form.section_visibility,
      };

      let courseId: string | null = null;
      if (editingCourse) {
        const { error } = await supabase.from('courses').update(payload).eq('id', editingCourse.id);
        if (error) throw error;
        courseId = editingCourse.id;
      } else {
        const { data, error } = await supabase.from('courses').insert([payload]).select('id').single();
        if (error) throw error;
        courseId = data?.id || null;
      }
      if (courseId) await saveCourseTeachers(courseId);

      toast({ title: 'Thành công', description: editingCourse ? 'Đã cập nhật' : 'Đã tạo khóa học' });
      setIsDialogOpen(false);
      resetForm();
      fetchCourses();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Lỗi', description: e.message || 'Không thể lưu', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa khóa học này?')) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Đã xóa' }); fetchCourses(); }
  };

  const togglePublish = async (c: Course) => {
    await supabase.from('courses').update({ is_published: !c.is_published }).eq('id', c.id);
    fetchCourses();
  };

  const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  // Helpers for array editors
  const addTimeline = () => setForm(f => ({ ...f, timeline: [...f.timeline, { week: '', title: '', description: '' }] }));
  const updateTimeline = (i: number, k: keyof TimelineItem, v: string) =>
    setForm(f => ({ ...f, timeline: f.timeline.map((t, idx) => idx === i ? { ...t, [k]: v } : t) }));
  const removeTimeline = (i: number) => setForm(f => ({ ...f, timeline: f.timeline.filter((_, idx) => idx !== i) }));

  const addFaq = () => setForm(f => ({ ...f, faq: [...f.faq, { q: '', a: '' }] }));
  const updateFaq = (i: number, k: keyof FaqItem, v: string) =>
    setForm(f => ({ ...f, faq: f.faq.map((t, idx) => idx === i ? { ...t, [k]: v } : t) }));
  const removeFaq = (i: number) => setForm(f => ({ ...f, faq: f.faq.filter((_, idx) => idx !== i) }));

  const addTesti = () => setForm(f => ({ ...f, testimonials: [...f.testimonials, { name: '', role: '', content: '', avatar: '' }] }));
  const updateTesti = (i: number, k: keyof Testimonial, v: string) =>
    setForm(f => ({ ...f, testimonials: f.testimonials.map((t, idx) => idx === i ? { ...t, [k]: v } : t) }));
  const removeTesti = (i: number) => setForm(f => ({ ...f, testimonials: f.testimonials.filter((_, idx) => idx !== i) }));

  const addCustom = () => setForm(f => ({ ...f, custom_fields: [...f.custom_fields, { label: '', value: '', icon: '' }] }));
  const updateCustom = (i: number, k: keyof CustomField, v: string) =>
    setForm(f => ({ ...f, custom_fields: f.custom_fields.map((t, idx) => idx === i ? { ...t, [k]: v } : t) }));
  const removeCustom = (i: number) => setForm(f => ({ ...f, custom_fields: f.custom_fields.filter((_, idx) => idx !== i) }));

  const setVisibility = (key: keyof SectionVisibility, val: boolean) =>
    setForm(f => ({ ...f, section_visibility: { ...f.section_visibility, [key]: val } }));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const visibilityLabels: Record<keyof SectionVisibility, string> = {
    hero: 'Hero (đầu trang)',
    highlights: 'Điểm nổi bật',
    outcomes: 'Kết quả đạt được',
    features: 'Tính năng / module',
    timeline: 'Lộ trình timeline',
    teachers: 'Giảng viên',
    gallery: 'Thư viện ảnh',
    testimonials: 'Đánh giá học viên',
    faq: 'Câu hỏi thường gặp',
    related: 'Khóa học liên quan',
    enrollment: 'Thông tin tuyển sinh',
    certificate: 'Chứng chỉ',
    custom: 'Trường tùy biến',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Khóa học</h1>
          <p className="text-muted-foreground mt-1">Toàn quyền cập nhật trang chi tiết khóa học</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Thêm khóa học</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Chỉnh sửa khóa học' : 'Thêm khóa học mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-4">
              <Tabs defaultValue="basic">
                <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full mb-4">
                  <TabsTrigger value="basic">Cơ bản</TabsTrigger>
                  <TabsTrigger value="content">Nội dung</TabsTrigger>
                  <TabsTrigger value="enroll">Tuyển sinh</TabsTrigger>
                  <TabsTrigger value="timeline">Lộ trình</TabsTrigger>
                  <TabsTrigger value="rich">Phong phú</TabsTrigger>
                  <TabsTrigger value="visibility">Hiển thị</TabsTrigger>
                </TabsList>

                {/* === BASIC === */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tên (English)</Label>
                      <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Tên (Tiếng Việt)</Label>
                      <Input value={form.title_vi} onChange={e => setForm({ ...form, title_vi: e.target.value })} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phụ đề (EN)</Label>
                      <Input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="Master JLPT N5 in 12 weeks" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phụ đề (VI)</Label>
                      <Input value={form.subtitle_vi} onChange={e => setForm({ ...form, subtitle_vi: e.target.value })} placeholder="Chinh phục JLPT N5 trong 12 tuần" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả ngắn (VI)</Label>
                    <Textarea rows={2} value={form.description_vi} onChange={e => setForm({ ...form, description_vi: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả ngắn (EN)</Label>
                    <Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Giá (VNĐ)</Label>
                      <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseInt(e.target.value) || 0 })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Giá gốc (VNĐ)</Label>
                      <Input type="number" value={form.original_price} onChange={e => setForm({ ...form, original_price: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Thời lượng (tuần)</Label>
                      <Input type="number" value={form.duration_weeks} onChange={e => setForm({ ...form, duration_weeks: parseInt(e.target.value) || 12 })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cấp độ JLPT</Label>
                      <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{jlptLevels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>URL Ảnh bìa (Thumbnail)</Label>
                      <Input value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." />
                    </div>
                  </div>
                  {form.thumbnail_url && (
                    <div className="rounded-lg overflow-hidden border max-w-md">
                      <img src={form.thumbnail_url} alt="" className="w-full h-40 object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_published} onCheckedChange={v => setForm({ ...form, is_published: v })} />
                    <Label>Xuất bản ngay</Label>
                  </div>
                </TabsContent>

                {/* === CONTENT === */}
                <TabsContent value="content" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mô tả dài / Giới thiệu chi tiết (VI)</Label>
                    <Textarea rows={6} value={form.long_description_vi} onChange={e => setForm({ ...form, long_description_vi: e.target.value })} placeholder="Giới thiệu chi tiết về khóa học, phương pháp giảng dạy..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả dài (EN)</Label>
                    <Textarea rows={4} value={form.long_description} onChange={e => setForm({ ...form, long_description: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tính năng / Module (mỗi dòng một mục)</Label>
                    <Textarea rows={5} value={form.featuresText} onChange={e => setForm({ ...form, featuresText: e.target.value })} placeholder="Video bài giảng HD&#10;Flashcards từ vựng&#10;Bài tập thực hành" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Điểm nổi bật (mỗi dòng 1)</Label>
                      <Textarea rows={4} value={form.highlightsText} onChange={e => setForm({ ...form, highlightsText: e.target.value })} placeholder="Lộ trình chuẩn JLPT&#10;Giáo viên bản ngữ" />
                    </div>
                    <div className="space-y-2">
                      <Label>Kết quả đạt được (mỗi dòng 1)</Label>
                      <Textarea rows={4} value={form.outcomesText} onChange={e => setForm({ ...form, outcomesText: e.target.value })} placeholder="Đọc hiểu hiragana, katakana&#10;Giao tiếp cơ bản" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Yêu cầu đầu vào (mỗi dòng 1)</Label>
                    <Textarea rows={3} value={form.requirementsText} onChange={e => setForm({ ...form, requirementsText: e.target.value })} placeholder="Không yêu cầu kiến thức trước&#10;Cam kết học 30 phút/ngày" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Video giới thiệu (URL YouTube/MP4)</Label>
                      <Input value={form.intro_video_url} onChange={e => setForm({ ...form, intro_video_url: e.target.value })} placeholder="https://youtube.com/..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Ảnh chứng chỉ (URL)</Label>
                      <Input value={form.certificate_image_url} onChange={e => setForm({ ...form, certificate_image_url: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Thư viện ảnh (mỗi dòng 1 URL)</Label>
                    <Textarea rows={4} value={form.galleryText} onChange={e => setForm({ ...form, galleryText: e.target.value })} placeholder="https://..." />
                  </div>
                </TabsContent>

                {/* === ENROLLMENT === */}
                <TabsContent value="enroll" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Số lượng tuyển (capacity)</Label>
                      <Input type="number" value={form.enrollment_capacity} onChange={e => setForm({ ...form, enrollment_capacity: parseInt(e.target.value) || 0 })} placeholder="30" />
                    </div>
                    <div className="space-y-2">
                      <Label>Đã đăng ký</Label>
                      <Input type="number" value={form.enrolled_count} onChange={e => setForm({ ...form, enrolled_count: parseInt(e.target.value) || 0 })} placeholder="12" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trạng thái tuyển sinh</Label>
                      <Select value={form.enrollment_status} onValueChange={v => setForm({ ...form, enrollment_status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{enrollmentStatuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Ngày khai giảng</Label>
                      <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Lịch học (VI)</Label>
                      <Input value={form.schedule_text_vi} onChange={e => setForm({ ...form, schedule_text_vi: e.target.value })} placeholder="Thứ 2-4-6, 19:00-21:00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Lịch học (EN)</Label>
                      <Input value={form.schedule_text} onChange={e => setForm({ ...form, schedule_text: e.target.value })} placeholder="Mon/Wed/Fri 7-9 PM" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Địa điểm (VI)</Label>
                      <Input value={form.location_vi} onChange={e => setForm({ ...form, location_vi: e.target.value })} placeholder="Online qua Google Meet" />
                    </div>
                    <div className="space-y-2">
                      <Label>Địa điểm (EN)</Label>
                      <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label className="flex items-center gap-2"><Users className="w-4 h-4" /> Giảng viên phụ trách ({selectedTeacherIds.length} đã chọn)</Label>
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                      {allTeachers.length === 0
                        ? <p className="text-sm text-muted-foreground">Chưa có giảng viên.</p>
                        : allTeachers.map(t => (
                          <label key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                            <input type="checkbox" checked={selectedTeacherIds.includes(t.id)} onChange={() => toggleTeacher(t.id)} className="w-4 h-4" />
                            {t.image_url
                              ? <img src={t.image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                              : <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">👩‍🏫</div>}
                            <span className="text-sm font-medium">{t.display_name || 'Giảng viên'}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                </TabsContent>

                {/* === TIMELINE === */}
                <TabsContent value="timeline" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Lộ trình theo tuần / giai đoạn</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addTimeline}><Plus className="w-4 h-4 mr-1" /> Thêm</Button>
                  </div>
                  {form.timeline.length === 0 && <p className="text-sm text-muted-foreground">Chưa có giai đoạn nào.</p>}
                  {form.timeline.map((t, i) => (
                    <Card key={i}><CardContent className="p-4 space-y-3 relative">
                      <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeTimeline(i)}><X className="w-4 h-4" /></Button>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1"><Label className="text-xs">Thời gian</Label>
                          <Input value={t.week} onChange={e => updateTimeline(i, 'week', e.target.value)} placeholder="Tuần 1-2" /></div>
                        <div className="col-span-2 space-y-1"><Label className="text-xs">Tiêu đề</Label>
                          <Input value={t.title} onChange={e => updateTimeline(i, 'title', e.target.value)} placeholder="Hiragana & Katakana" /></div>
                      </div>
                      <div className="space-y-1"><Label className="text-xs">Mô tả</Label>
                        <Textarea rows={2} value={t.description} onChange={e => updateTimeline(i, 'description', e.target.value)} placeholder="Học bảng chữ cái, đọc viết cơ bản..." /></div>
                    </CardContent></Card>
                  ))}
                </TabsContent>

                {/* === RICH (FAQ + Testimonials + Custom) === */}
                <TabsContent value="rich" className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">FAQ - Câu hỏi thường gặp</Label>
                      <Button type="button" size="sm" variant="outline" onClick={addFaq}><Plus className="w-4 h-4 mr-1" /> Thêm</Button>
                    </div>
                    {form.faq.map((f, i) => (
                      <Card key={i}><CardContent className="p-4 space-y-2 relative">
                        <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeFaq(i)}><X className="w-4 h-4" /></Button>
                        <Input value={f.q} onChange={e => updateFaq(i, 'q', e.target.value)} placeholder="Câu hỏi" />
                        <Textarea rows={2} value={f.a} onChange={e => updateFaq(i, 'a', e.target.value)} placeholder="Trả lời" />
                      </CardContent></Card>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Đánh giá học viên</Label>
                      <Button type="button" size="sm" variant="outline" onClick={addTesti}><Plus className="w-4 h-4 mr-1" /> Thêm</Button>
                    </div>
                    {form.testimonials.map((t, i) => (
                      <Card key={i}><CardContent className="p-4 space-y-2 relative">
                        <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeTesti(i)}><X className="w-4 h-4" /></Button>
                        <div className="grid grid-cols-2 gap-3">
                          <Input value={t.name} onChange={e => updateTesti(i, 'name', e.target.value)} placeholder="Họ tên" />
                          <Input value={t.role} onChange={e => updateTesti(i, 'role', e.target.value)} placeholder="Học viên N5 / Du học sinh..." />
                        </div>
                        <Input value={t.avatar} onChange={e => updateTesti(i, 'avatar', e.target.value)} placeholder="URL ảnh đại diện (tùy chọn)" />
                        <Textarea rows={2} value={t.content} onChange={e => updateTesti(i, 'content', e.target.value)} placeholder="Cảm nhận của học viên..." />
                      </CardContent></Card>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Trường tùy biến</Label>
                        <p className="text-xs text-muted-foreground">Tự thêm bất kỳ thông tin nào (ví dụ: Tài liệu phát, Ngôn ngữ giảng dạy, Quà tặng kèm...)</p>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={addCustom}><Plus className="w-4 h-4 mr-1" /> Thêm</Button>
                    </div>
                    {form.custom_fields.map((c, i) => (
                      <Card key={i}><CardContent className="p-4 space-y-2 relative">
                        <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeCustom(i)}><X className="w-4 h-4" /></Button>
                        <div className="grid grid-cols-3 gap-3">
                          <Input value={c.icon || ''} onChange={e => updateCustom(i, 'icon', e.target.value)} placeholder="Emoji 🎁" />
                          <Input value={c.label} onChange={e => updateCustom(i, 'label', e.target.value)} placeholder="Nhãn (Ngôn ngữ giảng dạy)" />
                          <Input value={c.value} onChange={e => updateCustom(i, 'value', e.target.value)} placeholder="Giá trị (Tiếng Việt + Nhật)" />
                        </div>
                      </CardContent></Card>
                    ))}
                  </div>
                </TabsContent>

                {/* === VISIBILITY === */}
                <TabsContent value="visibility" className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">Bật / tắt từng phần hiển thị trên trang chi tiết khóa học</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {(Object.keys(visibilityLabels) as Array<keyof SectionVisibility>).map(key => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                        <Label className="cursor-pointer">{visibilityLabels[key]}</Label>
                        <Switch checked={form.section_visibility[key]} onCheckedChange={v => setVisibility(key, v)} />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-6 border-t mt-6">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Hủy</Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingCourse ? 'Cập nhật' : 'Tạo khóa học'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Chưa có khóa học</h3>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((c) => (
            <Card key={c.id}><CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-foreground truncate">{c.title_vi}</h3>
                    <Badge>{c.level}</Badge>
                    {c.is_published ? <Badge className="bg-green-600">Đã xuất bản</Badge> : <Badge variant="secondary">Bản nháp</Badge>}
                    {c.enrollment_capacity ? (
                      <Badge variant="outline" className="gap-1"><Users className="w-3 h-3" /> {c.enrolled_count}/{c.enrollment_capacity}</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{c.description_vi || c.description || 'Chưa có mô tả'}</p>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /><span className="font-semibold text-foreground">{formatPrice(c.price)}</span></span>
                    {c.duration_weeks && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {c.duration_weeks} tuần</span>}
                    {c.start_date && <span>📅 {new Date(c.start_date).toLocaleDateString('vi-VN')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => togglePublish(c)}>{c.is_published ? 'Ẩn' : 'Xuất bản'}</Button>
                  <Button variant="outline" size="icon" onClick={() => openEditDialog(c)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCourses;

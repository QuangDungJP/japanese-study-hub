import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Loader2, Plus, Pencil, Trash2, X, Eye, EyeOff, Star, Award, Globe, MapPin, Clock, Users, BookOpen, GripVertical, Save, Crop, Calendar, Video, Building, ExternalLink, CheckCircle2
} from "lucide-react";
import { formatWithJST } from "@/lib/dateUtils";
import { useToast } from "@/hooks/use-toast";
import MediaUploader from "@/components/shared/MediaUploader";
import ImageCropModal from "@/components/shared/ImageCropModal";
import { Database } from "@/integrations/supabase/types";
import { ScrollArea } from "@/components/ui/scroll-area";

type TeacherRow = Database["public"]["Tables"]["teacher_profiles"]["Row"];

interface FormData {
  display_name: string;
  headline: string;
  bio: string;
  bio_vi: string;
  image_url: string;
  cover_image_url: string;
  intro_video_url: string;
  experience_years: number;
  rating: number;
  total_reviews: number;
  total_students: number;
  total_lessons: number;
  total_hours: number;
  hourly_rate: number;
  location: string;
  slug: string;
  is_available: boolean;
  is_featured: boolean;
  specializations: string[];
  certifications: string[];
  languages: string[];
  social_links: Record<string, string>;
  extra_fields: { key: string; value: string }[];
}

const emptyForm: FormData = {
  display_name: "", headline: "", bio: "", bio_vi: "",
  image_url: "", cover_image_url: "", intro_video_url: "",
  experience_years: 0, rating: 0, total_reviews: 0, total_students: 0,
  total_lessons: 0, total_hours: 0, hourly_rate: 0,
  location: "", slug: "",
  is_available: true, is_featured: false,
  specializations: [], certifications: [], languages: [],
  social_links: {}, extra_fields: [],
};

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) { onChange([...value, trimmed]); setInput(""); }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <Button type="button" variant="secondary" size="sm" onClick={add}>Thêm</Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminTeachers() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scheduleTeacher, setScheduleTeacher] = useState<TeacherRow | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [orderChanged, setOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [cropTarget, setCropTarget] = useState<'image_url' | 'cover_image_url'>('image_url');
  const cropInputRef = useRef<HTMLInputElement>(null);

  const openCropForFile = (target: 'image_url' | 'cover_image_url') => {
    setCropTarget(target);
    cropInputRef.current?.click();
  };

  const handleCropFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async (blob: Blob) => {
    const ext = 'jpg';
    const fileName = `teachers/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('website-assets').upload(fileName, blob, { contentType: 'image/jpeg' });
    if (uploadError) {
      toast({ title: 'Lỗi upload ảnh đã cắt', variant: 'destructive' });
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('website-assets').getPublicUrl(fileName);
    set(cropTarget, publicUrl);
    toast({ title: 'Đã cắt và upload ảnh ✓' });
  };

  const fetchTeachers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("teacher_profiles")
      .select("*")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Không tải được giảng viên", variant: "destructive" });
    setTeachers(data || []);
    setLoading(false);
    setOrderChanged(false);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const parseJsonArray = (val: unknown): string[] => {
    if (Array.isArray(val)) return val.filter((v) => typeof v === "string");
    return [];
  };

  const parseExtraData = (val: unknown): { key: string; value: string }[] => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.entries(val as Record<string, unknown>).map(([key, value]) => ({ key, value: String(value ?? "") }));
    }
    return [];
  };

  const parseSocialLinks = (val: unknown): Record<string, string> => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const result: Record<string, string> = {};
      Object.entries(val as Record<string, unknown>).forEach(([k, v]) => { result[k] = String(v ?? ""); });
      return result;
    }
    return {};
  };

  // Drag & Drop
  const handleDragStart = (index: number) => { setDragIndex(index); };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setOverIndex(index); };
  const handleDragEnd = () => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const updated = [...teachers];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(overIndex, 0, moved);
      setTeachers(updated);
      setOrderChanged(true);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      const updates = teachers.map((t, i) =>
        supabase.from("teacher_profiles").update({ order_index: i } as any).eq("id", t.id)
      );
      await Promise.all(updates);
      toast({ title: "Đã lưu thứ tự giảng viên ✓" });
      setOrderChanged(false);
    } catch {
      toast({ title: "Lỗi khi lưu thứ tự", variant: "destructive" });
    }
    setSavingOrder(false);
  };

  const openNew = () => { setEditingTeacher(null); setFormData(emptyForm); setDialogOpen(true); };

  const openEdit = (teacher: TeacherRow) => {
    setEditingTeacher(teacher);
    setFormData({
      display_name: teacher.display_name || "",
      headline: teacher.headline || "",
      bio: teacher.bio || "",
      bio_vi: teacher.bio_vi || "",
      image_url: teacher.image_url || "",
      cover_image_url: teacher.cover_image_url || "",
      intro_video_url: teacher.intro_video_url || "",
      experience_years: teacher.experience_years || 0,
      rating: Number(teacher.rating) || 0,
      total_reviews: teacher.total_reviews || 0,
      total_students: teacher.total_students || 0,
      total_lessons: teacher.total_lessons || 0,
      total_hours: teacher.total_hours || 0,
      hourly_rate: Number(teacher.hourly_rate) || 0,
      location: teacher.location || "",
      slug: teacher.slug || "",
      is_available: teacher.is_available ?? true,
      is_featured: teacher.is_featured ?? false,
      specializations: parseJsonArray(teacher.specializations),
      certifications: parseJsonArray(teacher.certifications),
      languages: parseJsonArray(teacher.languages),
      social_links: parseSocialLinks(teacher.social_links),
      extra_fields: parseExtraData(teacher.extra_data),
    });
    setDialogOpen(true);
  };

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setFormData((p) => ({ ...p, [key]: value }));

  const handleToggleVisibility = async (teacher: TeacherRow, field: "is_available" | "is_featured") => {
    const newVal = !(teacher[field] ?? false);
    const { error } = await supabase.from("teacher_profiles").update({ [field]: newVal } as any).eq("id", teacher.id);
    if (!error) {
      setTeachers((prev) => prev.map((t) => (t.id === teacher.id ? { ...t, [field]: newVal } : t)));
      toast({ title: field === "is_available" ? (newVal ? "Đã hiện giảng viên" : "Đã ẩn giảng viên") : (newVal ? "Đã ghim trang chủ" : "Đã bỏ ghim trang chủ") });
    }
  };

  const handleSave = async () => {
    if (!formData.display_name.trim()) {
      toast({ title: "Vui lòng nhập tên giảng viên", variant: "destructive" });
      return;
    }
    setSaving(true);

    const extraData: Record<string, string> = {};
    formData.extra_fields.forEach((f) => { if (f.key.trim()) extraData[f.key.trim()] = f.value; });

    const payload: any = {
      display_name: formData.display_name,
      headline: formData.headline || null,
      bio: formData.bio || null,
      bio_vi: formData.bio_vi || null,
      image_url: formData.image_url || null,
      cover_image_url: formData.cover_image_url || null,
      intro_video_url: formData.intro_video_url || null,
      experience_years: formData.experience_years,
      rating: formData.rating,
      total_reviews: formData.total_reviews,
      total_students: formData.total_students,
      total_lessons: formData.total_lessons,
      total_hours: formData.total_hours,
      hourly_rate: formData.hourly_rate,
      location: formData.location || null,
      slug: formData.slug || null,
      is_available: formData.is_available,
      is_featured: formData.is_featured,
      specializations: formData.specializations,
      certifications: formData.certifications,
      languages: formData.languages,
      social_links: formData.social_links,
      extra_data: extraData,
    };

    try {
      if (editingTeacher) {
        const { error } = await supabase.from("teacher_profiles").update(payload).eq("id", editingTeacher.id);
        if (error) throw error;
        toast({ title: "Đã cập nhật giảng viên ✓" });
      } else {
        payload.order_index = teachers.length;
        const { error } = await supabase.from("teacher_profiles").insert(payload);
        if (error) throw error;
        toast({ title: "Đã tạo giảng viên mới ✓" });
      }
      setDialogOpen(false);
      fetchTeachers();
    } catch (err: any) {
      toast({ title: "Lỗi: " + (err.message || "Không lưu được"), variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa giảng viên này?")) return;
    const { error } = await supabase.from("teacher_profiles").delete().eq("id", id);
    if (!error) { toast({ title: "Đã xóa giảng viên" }); fetchTeachers(); }
  };

  const getDisplayName = (t: TeacherRow) => t.display_name || "Chưa đặt tên";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý giảng viên</h1>
          <p className="text-muted-foreground text-sm">Kéo thả để sắp xếp thứ tự • Toggle để hiện/ẩn</p>
        </div>
        <div className="flex gap-2 self-start">
          {orderChanged && (
            <Button onClick={saveOrder} disabled={savingOrder} variant="default" className="bg-green-600 hover:bg-green-700">
              {savingOrder ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Lưu thứ tự
            </Button>
          )}
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" /> Thêm giảng viên
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng giảng viên", value: teachers.length, icon: Users },
          { label: "Đang hiển thị", value: teachers.filter((t) => t.is_available).length, icon: Eye },
          { label: "Trang chủ", value: teachers.filter((t) => t.is_featured).length, icon: Star },
          { label: "Đang ẩn", value: teachers.filter((t) => !t.is_available).length, icon: EyeOff },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><s.icon className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin w-6 h-6" /></div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có giảng viên nào</p>
              <Button variant="link" onClick={openNew}>Thêm giảng viên đầu tiên</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Giảng viên</TableHead>
                  <TableHead className="hidden md:table-cell">Chuyên môn</TableHead>
                  <TableHead className="text-center">Website</TableHead>
                  <TableHead className="text-center">Trang chủ</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher, index) => (
                  <TableRow
                    key={teacher.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`${!teacher.is_available ? "opacity-50" : ""} ${dragIndex === index ? "opacity-30" : ""} ${overIndex === index && dragIndex !== index ? "border-t-2 border-primary" : ""} cursor-grab active:cursor-grabbing`}
                  >
                    <TableCell className="w-10 px-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3 items-center">
                        {teacher.image_url ? (
                          <img src={teacher.image_url} className="w-10 h-10 rounded-full object-cover border" alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">👩‍🏫</div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{getDisplayName(teacher)}</div>
                          {teacher.headline && <div className="text-xs text-muted-foreground truncate">{teacher.headline}</div>}
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            {teacher.experience_years ? <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{teacher.experience_years} năm</span> : null}
                            {Number(teacher.rating) > 0 && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-500" />{Number(teacher.rating).toFixed(1)}</span>}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {parseJsonArray(teacher.specializations).slice(0, 3).map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={teacher.is_available ?? false} onCheckedChange={() => handleToggleVisibility(teacher, "is_available")} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={teacher.is_featured ?? false} onCheckedChange={() => handleToggleVisibility(teacher, "is_featured")} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-semibold gap-1 text-primary border-primary/30"
                          onClick={() => setScheduleTeacher(teacher)}
                          title="Xem Lịch dạy & Danh sách Lớp"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Lịch dạy & Lớp
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(teacher)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(teacher.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TeacherScheduleModal
        open={!!scheduleTeacher}
        onOpenChange={(o) => !o && setScheduleTeacher(null)}
        teacher={scheduleTeacher}
      />

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl">{editingTeacher ? "Chỉnh sửa giảng viên" : "Thêm giảng viên mới"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-140px)]">
            <div className="p-6 pt-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="w-full grid grid-cols-4 mb-6">
                  <TabsTrigger value="basic">Cơ bản</TabsTrigger>
                  <TabsTrigger value="details">Chi tiết</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="extra">Tùy chỉnh</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Headline / Chức danh</Label>
                      <Input value={formData.headline} onChange={(e) => set("headline", e.target.value)} placeholder="VD: Giảng viên JLPT N1" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">Tên giảng viên <span className="text-destructive">*</span></Label>
                      <Input value={formData.display_name} onChange={(e) => set("display_name", e.target.value)} placeholder="VD: Tanaka Yuki" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Giới thiệu (Tiếng Việt)</Label>
                    <Textarea value={formData.bio_vi} onChange={(e) => set("bio_vi", e.target.value)} rows={3} placeholder="Mô tả ngắn về giảng viên..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Giới thiệu (Tiếng Nhật / English)</Label>
                    <Textarea value={formData.bio} onChange={(e) => set("bio", e.target.value)} rows={3} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />Địa điểm</Label>
                      <Input value={formData.location} onChange={(e) => set("location", e.target.value)} placeholder="Tokyo, Japan" />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug URL</Label>
                      <Input value={formData.slug} onChange={(e) => set("slug", e.target.value)} placeholder="tanaka-yuki" />
                    </div>
                    <div className="space-y-2">
                      <Label>Giá / giờ (VNĐ)</Label>
                      <Input type="number" value={formData.hourly_rate} onChange={(e) => set("hourly_rate", Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <Switch checked={formData.is_available} onCheckedChange={(v) => set("is_available", v)} />
                      <div>
                        <Label className="flex items-center gap-1.5"><Eye className="w-4 h-4" />Hiện trên website</Label>
                        <p className="text-xs text-muted-foreground">Trang giảng viên</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <Switch checked={formData.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
                      <div>
                        <Label className="flex items-center gap-1.5"><Star className="w-4 h-4" />Hiện trên trang chủ</Label>
                        <p className="text-xs text-muted-foreground">Ghim lên trang chủ</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "Kinh nghiệm (năm)", key: "experience_years" as const, icon: Clock },
                      { label: "Đánh giá", key: "rating" as const, icon: Star },
                      { label: "Số đánh giá", key: "total_reviews" as const, icon: Award },
                      { label: "Số học viên", key: "total_students" as const, icon: Users },
                      { label: "Số bài giảng", key: "total_lessons" as const, icon: BookOpen },
                      { label: "Tổng giờ dạy", key: "total_hours" as const, icon: Clock },
                    ].map(({ label, key, icon: Icon }) => (
                      <div key={key} className="space-y-2">
                        <Label className="flex items-center gap-1"><Icon className="w-3.5 h-3.5" />{label}</Label>
                        <Input type="number" step={key === "rating" ? "0.1" : "1"} value={formData[key]} onChange={(e) => set(key, Number(e.target.value))} />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />Chuyên môn</Label>
                    <TagInput value={formData.specializations} onChange={(v) => set("specializations", v)} placeholder="VD: JLPT N1, Kaiwa..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />Chứng chỉ</Label>
                    <TagInput value={formData.certifications} onChange={(v) => set("certifications", v)} placeholder="VD: TESOL..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />Ngôn ngữ</Label>
                    <TagInput value={formData.languages} onChange={(v) => set("languages", v)} placeholder="VD: 日本語, Tiếng Việt..." />
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-5">
                  <input ref={cropInputRef} type="file" accept="image/*" className="hidden" onChange={handleCropFileSelect} />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Ảnh đại diện</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => { setCropTarget('image_url'); openCropForFile('image_url'); }}>
                        <Crop className="w-3.5 h-3.5 mr-1" /> Chọn & Cắt ảnh
                      </Button>
                    </div>
                    <MediaUploader value={formData.image_url} onChange={(url) => set("image_url", url)} folder="teachers" aspectRatio="square" accept="image" />
                    <Input value={formData.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="Hoặc dán URL ảnh..." className="text-xs" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Ảnh bìa (Cover)</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => { setCropTarget('cover_image_url'); openCropForFile('cover_image_url'); }}>
                        <Crop className="w-3.5 h-3.5 mr-1" /> Chọn & Cắt ảnh
                      </Button>
                    </div>
                    <MediaUploader value={formData.cover_image_url} onChange={(url) => set("cover_image_url", url)} folder="teachers" aspectRatio="banner" accept="image" />
                    <Input value={formData.cover_image_url} onChange={(e) => set("cover_image_url", e.target.value)} placeholder="Hoặc dán URL ảnh bìa..." className="text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label>Video giới thiệu (URL)</Label>
                    <Input value={formData.intro_video_url} onChange={(e) => set("intro_video_url", e.target.value)} placeholder="https://youtube.com/..." />
                  </div>
                </TabsContent>

                <TabsContent value="extra" className="space-y-5">
                  <div className="space-y-2">
                    <Label>Trường tùy chỉnh</Label>
                    <p className="text-xs text-muted-foreground">Thêm thông tin bổ sung tùy ý</p>
                  </div>
                  <div className="space-y-3">
                    {formData.extra_fields.map((field, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <Input placeholder="Tên trường" value={field.key} className="w-1/3"
                          onChange={(e) => { const u = [...formData.extra_fields]; u[index] = { ...u[index], key: e.target.value }; set("extra_fields", u); }} />
                        <Input placeholder="Giá trị" value={field.value} className="flex-1"
                          onChange={(e) => { const u = [...formData.extra_fields]; u[index] = { ...u[index], value: e.target.value }; set("extra_fields", u); }} />
                        <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => set("extra_fields", formData.extra_fields.filter((_, i) => i !== index))}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => set("extra_fields", [...formData.extra_fields, { key: "", value: "" }])}>
                      <Plus className="w-4 h-4 mr-1" /> Thêm trường
                    </Button>
                  </div>
                  <div className="border-t pt-5 space-y-3">
                    <Label>Mạng xã hội</Label>
                    {["facebook", "instagram", "youtube", "linkedin", "twitter"].map((platform) => (
                      <div key={platform} className="flex gap-2 items-center">
                        <Label className="w-24 capitalize text-sm text-muted-foreground">{platform}</Label>
                        <Input value={formData.social_links[platform] || ""}
                          onChange={(e) => set("social_links", { ...formData.social_links, [platform]: e.target.value })}
                          placeholder={`https://${platform}.com/...`} />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 pt-0 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
              {editingTeacher ? "Cập nhật" : "Tạo giảng viên"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageCropModal
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        aspect={cropTarget === 'image_url' ? 1 : 3}
        title={cropTarget === 'image_url' ? 'Cắt ảnh đại diện' : 'Cắt ảnh bìa'}
      />
    </div>
  );
}

function TeacherScheduleModal({
  open,
  onOpenChange,
  teacher,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: TeacherRow | null;
}) {
  const [classes, setClasses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && teacher) {
      fetchTeacherData();
    }
  }, [open, teacher]);

  const fetchTeacherData = async () => {
    if (!teacher) return;
    setLoading(true);
    try {
      // 1. Fetch classes taught by this teacher
      const { data: classData } = await supabase
        .from('classes')
        .select('*, courses(title_vi)')
        .or(`teacher_id.eq.${teacher.user_id || teacher.id}`);

      setClasses(classData || []);

      const classIds = (classData || []).map((c: any) => c.id);

      // 2. Fetch class sessions for these classes
      if (classIds.length > 0) {
        const { data: sessionData } = await supabase
          .from('class_sessions')
          .select('*, classes(name_vi)')
          .in('class_id', classIds)
          .order('session_date', { ascending: false });

        setSessions(sessionData || []);
      } else {
        setSessions([]);
      }

      // 3. Fetch 1-on-1 bookings for this teacher
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*, meetings(meet_link)')
        .or(`teacher_id.eq.${teacher.user_id || teacher.id},teacher_name.ilike.%${teacher.display_name}%`)
        .order('booking_date', { ascending: false });

      setBookings(bookingData || []);
    } catch (err) {
      console.error('Error loading teacher schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {teacher.image_url ? (
                <img src={teacher.image_url} className="w-10 h-10 rounded-full object-cover" alt="" />
              ) : (
                '👩‍🏫'
              )}
            </div>
            <div>
              <p className="font-bold">{teacher.display_name}</p>
              <p className="text-xs text-muted-foreground font-normal">
                {teacher.headline || 'Giảng viên'} · Lịch dạy & Danh sách Lớp phụ trách
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-120px)]">
          <div className="p-6">
            <Tabs defaultValue="classes" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="classes" className="gap-2">
                  <Building className="w-4 h-4" />
                  Danh sách Lớp học ({classes.length})
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Lịch dạy & Session ({sessions.length + bookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="classes" className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Giảng viên chưa được phân công lớp học nào.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classes.map((cls) => (
                      <Card key={cls.id} className="border border-border/80 shadow-sm">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge variant="outline" className="text-[10px] text-primary border-primary/30 mb-1">
                                {cls.courses?.title_vi || 'Khóa học'}
                              </Badge>
                              <h4 className="font-bold text-foreground text-base">{cls.name_vi || cls.name}</h4>
                            </div>
                            <Badge variant={cls.status === 'ongoing' ? 'default' : 'secondary'} className="text-xs">
                              {cls.status === 'ongoing' ? 'Đang học' : cls.status || 'Hoạt động'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t">
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> Sĩ số: {cls.max_students || 30} HV
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" /> Tổng buổi: {cls.total_sessions || 24} buổi
                            </div>
                            {cls.start_date && (
                              <div className="flex items-center gap-1 col-span-2">
                                <Calendar className="w-3.5 h-3.5" /> Khai giảng: {formatWithJST(cls.start_date, false)}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : sessions.length === 0 && bookings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Chưa có lịch dạy trực tuyến hoặc lịch Meeting nào.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Class Sessions */}
                    {sessions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                          <Building className="w-4 h-4 text-primary" /> Buổi học lớp trực tuyến ({sessions.length})
                        </h4>
                        <div className="rounded-xl border divide-y divide-border bg-card">
                          {sessions.slice(0, 10).map((sess) => (
                            <div key={sess.id} className="p-3 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-foreground">{sess.topic || 'Buổi học'}</p>
                                <p className="text-muted-foreground">{sess.classes?.name_vi} • 📅 {formatWithJST(sess.session_date, false)} lúc {sess.start_time?.slice(0, 5)}</p>
                              </div>
                              {sess.meet_link && (
                                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => window.open(sess.meet_link, '_blank')}>
                                  <Video className="w-3 h-3 mr-1" /> Vào Google Meet
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bookings 1-on-1 */}
                    {bookings.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                          <Video className="w-4 h-4 text-indigo-500" /> Lịch học Meeting 1-on-1 ({bookings.length})
                        </h4>
                        <div className="rounded-xl border divide-y divide-border bg-card">
                          {bookings.slice(0, 10).map((b) => (
                            <div key={b.id} className="p-3 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-foreground">Học viên: {(b.profiles as any)?.full_name || 'Học viên'}</p>
                                <p className="text-muted-foreground">📅 {formatWithJST(b.booking_date, false)} lúc {b.booking_time?.slice(0, 5)} ({b.duration_minutes} phút)</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize text-[10px]">
                                  {b.status}
                                </Badge>
                                {b.meetings?.[0]?.meet_link && (
                                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => window.open(b.meetings[0].meet_link, '_blank')}>
                                    <Video className="w-3 h-3 mr-1" /> Meet
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


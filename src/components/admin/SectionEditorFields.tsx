import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Image, Film, Link, FolderOpen, X, Check, ChevronDown, ChevronUp, GripVertical, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MediaUploader from "@/components/shared/MediaUploader";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SectionEditorFieldsProps {
  sectionKey: string;
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

// Media Library Browser
const MediaLibraryPicker = ({
  open,
  onClose,
  onSelect,
  accept = "image",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  accept?: "image" | "video" | "both";
}) => {
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) fetchFiles();
  }, [open]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const buckets = ["website-assets", "lesson-assets"];
      const allFiles: { name: string; url: string }[] = [];

      for (const bucket of buckets) {
        const { data } = await supabase.storage.from(bucket).list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
        if (data) {
          for (const file of data) {
            if (file.name === ".emptyFolderPlaceholder") continue;
            const isImg = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
            const isVid = /\.(mp4|webm|mov|ogg)$/i.test(file.name);
            if (accept === "image" && !isImg) continue;
            if (accept === "video" && !isVid) continue;
            if (accept === "both" && !isImg && !isVid) continue;

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(file.name);
            allFiles.push({ name: file.name, url: publicUrl });
          }
        }
      }
      setFiles(allFiles);
    } catch { }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Thư viện Media
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Chưa có file nào trong thư viện</p>
              <p className="text-xs mt-1">Upload ảnh ở tab bên cạnh</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-1">
              {files.map((file) => {
                const isVideo = /\.(mp4|webm|mov|ogg)$/i.test(file.name);
                return (
                  <button
                    key={file.url}
                    onClick={() => setSelectedUrl(file.url)}
                    className={cn(
                      "relative group rounded-xl overflow-hidden border-2 transition-all aspect-square bg-muted/50",
                      selectedUrl === file.url
                        ? "border-primary ring-2 ring-primary/20 shadow-lg"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {isVideo ? (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Film className="w-8 h-8 text-muted-foreground" />
                      </div>
                    ) : (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    )}
                    {selectedUrl === file.url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                      <p className="text-[10px] text-white truncate">{file.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {selectedUrl && (
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setSelectedUrl(null)}>Hủy</Button>
            <Button size="sm" onClick={() => { onSelect(selectedUrl); onClose(); }}>
              <Check className="w-4 h-4 mr-1" /> Chọn file này
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Media field: upload + library + URL input
const MediaField = ({
  label,
  value,
  onChange,
  accept = "image",
  bucket = "website-assets",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: "image" | "video" | "both";
  bucket?: string;
}) => {
  const [mode, setMode] = useState<"upload" | "library" | "url">("upload");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value || "");
  const isVideo = /\.(mp4|webm|mov|ogg)$/i.test(value || "");

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>

      {/* Current preview */}
      {value && (
        <div className="relative rounded-xl border border-border overflow-hidden bg-muted/30">
          {isVideo ? (
            <video src={value} className="w-full aspect-video object-contain" controls />
          ) : isImage ? (
            <img src={value} alt="" className="w-full aspect-video object-cover" />
          ) : (
            <div className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Link className="w-4 h-4" />
              <span className="truncate">{value}</span>
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg"
            onClick={() => onChange("")}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {!value && (
        <>
          {/* Mode tabs */}
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            <button
              onClick={() => setMode("upload")}
              className={cn("flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-all",
                mode === "upload" ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Image className="w-3.5 h-3.5" /> Upload
            </button>
            <button
              onClick={() => { setMode("library"); setLibraryOpen(true); }}
              className={cn("flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-all",
                mode === "library" ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FolderOpen className="w-3.5 h-3.5" /> Thư viện
            </button>
            <button
              onClick={() => setMode("url")}
              className={cn("flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-all",
                mode === "url" ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Link className="w-3.5 h-3.5" /> URL
            </button>
          </div>

          {mode === "upload" && (
            <MediaUploader
              value=""
              onChange={onChange}
              accept={accept}
              bucket={bucket}
              folder="teachers"
              maxSizeMB={20}
              aspectRatio="video"
              placeholder="Kéo thả hoặc click để upload"
            />
          )}
          {mode === "url" && (
            <Input
              placeholder="https://example.com/image.jpg"
              onBlur={(e) => { if (e.target.value) onChange(e.target.value); }}
              onKeyDown={(e) => { if (e.key === "Enter") onChange((e.target as HTMLInputElement).value); }}
            />
          )}
        </>
      )}

      <MediaLibraryPicker
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={onChange}
        accept={accept}
      />
    </div>
  );
};

const HeroEditor = ({ content, onChange }: { content: Record<string, any>; onChange: (c: Record<string, any>) => void }) => {
  const update = (key: string, value: string) => onChange({ ...content, [key]: value });
  const features = (content.features as string[]) || [];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Thống kê Hero</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Số học viên</Label>
          <Input value={content.students || ""} onChange={(e) => update("students", e.target.value)} placeholder="50K+" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Số giáo viên</Label>
          <Input value={content.teachers || ""} onChange={(e) => update("teachers", e.target.value)} placeholder="200+" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Số bài học</Label>
          <Input value={content.lessons || ""} onChange={(e) => update("lessons", e.target.value)} placeholder="1000+" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Rating</Label>
          <Input value={content.rating || ""} onChange={(e) => update("rating", e.target.value)} placeholder="4.9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Số đánh giá</Label>
          <Input value={content.reviews || ""} onChange={(e) => update("reviews", e.target.value)} placeholder="2.5k đánh giá" />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Tính năng nổi bật</Label>
        {features.map((f, i) => (
          <div key={i} className="flex gap-2">
            <Input value={f} onChange={(e) => {
              const newF = [...features];
              newF[i] = e.target.value;
              onChange({ ...content, features: newF });
            }} />
            <Button variant="ghost" size="icon" onClick={() => {
              onChange({ ...content, features: features.filter((_, j) => j !== i) });
            }}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => onChange({ ...content, features: [...features, ""] })}>
          <Plus className="w-3 h-3 mr-1" /> Thêm
        </Button>
      </div>
    </div>
  );
};

const TeachersEditor = ({ content, onChange }: { content: Record<string, any>; onChange: (c: Record<string, any>) => void }) => {
  const teachers = (content.teachers as any[]) || [];
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...teachers];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    onChange({ ...content, teachers: updated });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const updateTeacher = (index: number, field: string, value: any) => {
    const updated = [...teachers];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...content, teachers: updated });
  };

  const addTeacher = () => {
    const newIndex = teachers.length;
    onChange({
      ...content,
      teachers: [...teachers, {
        name: "", role: "", avatar_url: "", video_url: "", bio: "",
        specializations: [], certifications: [], experience_years: 0,
        rating: 5.0, total_reviews: 0, languages: ["日本語", "Tiếng Việt"]
      }]
    });
    setExpandedIndex(newIndex);
  };

  const removeTeacher = (index: number) => {
    onChange({ ...content, teachers: teachers.filter((_, i) => i !== index) });
    if (expandedIndex === index) setExpandedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Danh sách giảng viên ({teachers.length})</h3>
        <Button variant="outline" size="sm" onClick={addTeacher} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Thêm giảng viên
        </Button>
      </div>

      {teachers.map((teacher, i) => {
        const isExpanded = expandedIndex === i;
        return (
          <div
            key={i}
            draggable={!isExpanded}
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
            className={cn(
              "rounded-xl border transition-all overflow-hidden",
              isExpanded ? "border-primary/30 shadow-md bg-card" : "border-border bg-muted/30 hover:bg-muted/50",
              dragIndex === i && "opacity-40 scale-95",
              dragOverIndex === i && dragIndex !== i && "border-primary border-dashed ring-2 ring-primary/20"
            )}
          >
            {/* Collapsed header */}
            <button
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
              className="w-full flex items-center gap-3 p-3 text-left"
            >
              {/* Drag handle */}
              <div
                className={cn("cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors", isExpanded && "opacity-30 pointer-events-none")}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4" />
              </div>
              {/* Mini avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0">
                {teacher.avatar_url ? (
                  <img src={teacher.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">👩‍🏫</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {teacher.name || <span className="text-muted-foreground italic">Chưa có tên</span>}
                </p>
                <p className="text-xs text-muted-foreground truncate">{teacher.role || "Chưa có chức vụ"}</p>
              </div>
              <div className="flex items-center gap-2">
                {teacher.rating > 0 && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Star className="w-3 h-3 fill-accent text-accent" /> {teacher.rating}
                  </Badge>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            {/* Expanded editor */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                {/* Avatar & Video */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MediaField
                    label="📸 Ảnh đại diện"
                    value={teacher.avatar_url || ""}
                    onChange={(url) => updateTeacher(i, "avatar_url", url)}
                    accept="image"
                  />
                  <MediaField
                    label="🎬 Video giới thiệu"
                    value={teacher.video_url || ""}
                    onChange={(url) => updateTeacher(i, "video_url", url)}
                    accept="video"
                  />
                </div>

                {/* Basic info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Họ tên</Label>
                    <Input value={teacher.name || ""} onChange={(e) => updateTeacher(i, "name", e.target.value)} placeholder="Tanaka Yuki" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Chức vụ</Label>
                    <Input value={teacher.role || ""} onChange={(e) => updateTeacher(i, "role", e.target.value)} placeholder="Giáo viên JLPT N1-N2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Tiểu sử</Label>
                  <Textarea value={teacher.bio || ""} onChange={(e) => updateTeacher(i, "bio", e.target.value)} rows={3} placeholder="Mô tả kinh nghiệm, phong cách giảng dạy..." />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Năm kinh nghiệm</Label>
                    <Input type="number" value={teacher.experience_years || 0} onChange={(e) => updateTeacher(i, "experience_years", parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rating</Label>
                    <Input type="number" step="0.1" min="0" max="5" value={teacher.rating || 0} onChange={(e) => updateTeacher(i, "rating", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Số đánh giá</Label>
                    <Input type="number" value={teacher.total_reviews || 0} onChange={(e) => updateTeacher(i, "total_reviews", parseInt(e.target.value) || 0)} />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1">
                  <Label className="text-xs">Chuyên môn (phân cách bằng dấu phẩy)</Label>
                  <Input
                    value={(teacher.specializations || []).join(", ")}
                    onChange={(e) => updateTeacher(i, "specializations", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                    placeholder="JLPT N1-N2, Ngữ pháp nâng cao"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Chứng chỉ (phân cách bằng dấu phẩy)</Label>
                  <Input
                    value={(teacher.certifications || []).join(", ")}
                    onChange={(e) => updateTeacher(i, "certifications", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                    placeholder="JLPT N1, 日本語教育能力検定"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ngôn ngữ (phân cách bằng dấu phẩy)</Label>
                  <Input
                    value={(teacher.languages || []).join(", ")}
                    onChange={(e) => updateTeacher(i, "languages", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                    placeholder="日本語, Tiếng Việt, English"
                  />
                </div>

                {/* Delete button */}
                <div className="pt-2 border-t border-border flex justify-end">
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5" onClick={() => removeTeacher(i)}>
                    <Trash2 className="w-4 h-4" /> Xóa giảng viên
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const CTAEditor = ({ content, onChange }: { content: Record<string, any>; onChange: (c: Record<string, any>) => void }) => {
  const update = (key: string, value: string) => onChange({ ...content, [key]: value });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Nội dung CTA</h3>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Ưu đãi</Label>
          <Input value={content.offer || ""} onChange={(e) => update("offer", e.target.value)} placeholder="Giảm 30% khoá học" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nút chính</Label>
          <Input value={content.primaryButton || ""} onChange={(e) => update("primaryButton", e.target.value)} placeholder="Đăng ký ngay" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nút phụ</Label>
          <Input value={content.secondaryButton || ""} onChange={(e) => update("secondaryButton", e.target.value)} placeholder="Tìm hiểu thêm" />
        </div>
      </div>
    </div>
  );
};

const SectionEditorFields = ({ sectionKey, content, onChange }: SectionEditorFieldsProps) => {
  switch (sectionKey) {
    case "hero":
      return <HeroEditor content={content} onChange={onChange} />;
    case "teachers":
      return <TeachersEditor content={content} onChange={onChange} />;
    case "cta":
      return <CTAEditor content={content} onChange={onChange} />;
    default:
      return null;
  }
};

export default SectionEditorFields;

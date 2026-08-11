import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Image, Film, Link, FolderOpen, X, Check, ChevronDown, ChevronUp, GripVertical, Star, Globe, Layout, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MediaUploader from "@/components/shared/MediaUploader";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import BannerStyleEditor from "@/components/admin/BannerStyleEditor";

const DIMENSION_HINT_MAP: Record<string, string> = {
  hero: "💡 Kích thước khuyến nghị: 1920 × 800 px (Banner Slide / Cover) hoặc 800 × 600 px (Card)",
  teachers: "💡 Kích thước khuyến nghị: 400 × 400 px (Ảnh đại diện 1:1 Vuông), Tối đa 2MB",
  zoom: "💡 Kích thước khuyến nghị: 1200 × 675 px (Tỷ lệ chuẩn 16:9), Tối đa 3MB",
  skills: "💡 Kích thước khuyến nghị: 1200 × 675 px (Tỷ lệ 16:9)",
  languages: "💡 Kích thước khuyến nghị: 1200 × 675 px (Tỷ lệ 16:9)",
  features: "💡 Kích thước khuyến nghị: 1200 × 675 px (Tỷ lệ 16:9)",
  blog: "💡 Kích thước khuyến nghị: 800 × 500 px (Tỷ lệ 16:10)",
  events: "💡 Kích thước khuyến nghị: 1200 × 630 px (Banner sự kiện 1.91:1)",
  cta: "💡 Kích thước khuyến nghị: 1920 × 600 px (Full Width Banner)",
  about_hero: "💡 Kích thước khuyến nghị: 1920 × 800 px",
  about_story: "💡 Kích thước khuyến nghị: 1200 × 675 px",
  default: "💡 Kích thước khuyến nghị: 1200 × 675 px (Tỷ lệ 16:9)"
};

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
    } catch {
      // ignore fetch errors
    }
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
                      selectedUrl === file.url ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                    )}
                  >
                    {isVideo ? (
                      <video src={file.url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={file.url} alt="" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                      <div className="flex justify-end">
                        {isVideo ? <Film className="w-4 h-4 text-white" /> : <Image className="w-4 h-4 text-white" />}
                      </div>
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

// Media field: upload + library + URL input + Dimension hint
const MediaField = ({
  label,
  value,
  onChange,
  accept = "image",
  bucket = "website-assets",
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: "image" | "video" | "both";
  bucket?: string;
  hint?: string;
}) => {
  const [mode, setMode] = useState<"upload" | "library" | "url">("upload");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value || "");
  const isVideo = /\.(mp4|webm|mov|ogg)$/i.test(value || "");

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <Label className="text-xs font-bold text-foreground">{label}</Label>
        {hint && (
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit">
            {hint}
          </span>
        )}
      </div>

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
              type="button"
              onClick={() => setMode("upload")}
              className={cn("flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-all",
                mode === "upload" ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Image className="w-3.5 h-3.5" /> Upload
            </button>
            <button
              type="button"
              onClick={() => { setMode("library"); setLibraryOpen(true); }}
              className={cn("flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-all",
                mode === "library" ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FolderOpen className="w-3.5 h-3.5" /> Thư viện
            </button>
            <button
              type="button"
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
              folder="website"
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
  const update = (key: string, value: any) => onChange({ ...content, [key]: value });
  const heroMode = content.hero_mode || 'standard';
  const carouselSlides = (content.carousel_slides as any[]) || [];
  const primaryBtn = content.primary_btn || { enabled: true, text: 'Học miễn phí ngay', url: '/auth' };
  const secondaryBtn = content.secondary_btn || { enabled: true, text: 'Xem demo', url: '/giao-vien' };
  const features = (content.features as string[]) || [];

  return (
    <div className="space-y-6 border p-4 rounded-xl bg-muted/20">
      {/* Mode Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-bold flex items-center gap-2">
          <Layout className="w-4 h-4 text-primary" /> Chế độ hiển thị Hero
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => update("hero_mode", "center_full")}
            className={cn("p-2.5 text-left rounded-xl border-2 transition-all",
              heroMode === "center_full" ? "border-primary bg-primary/10 font-bold" : "border-border hover:bg-muted"
            )}
          >
            <p className="text-xs font-bold">🌄 Tràn Full Screen</p>
            <p className="text-[10px] text-muted-foreground">Ảnh tràn 100% chiều rộng</p>
          </button>
          <button
            type="button"
            onClick={() => update("hero_mode", "center_poster")}
            className={cn("p-2.5 text-left rounded-xl border-2 transition-all",
              (heroMode === "center_poster" || !heroMode) ? "border-primary bg-primary/10 font-bold" : "border-border hover:bg-muted"
            )}
          >
            <p className="text-xs font-bold">🖼️ Center Poster</p>
            <p className="text-[10px] text-muted-foreground">Ảnh ở giữa + Nút bấm ở dưới</p>
          </button>
          <button
            type="button"
            onClick={() => update("hero_mode", "standard")}
            className={cn("p-2.5 text-left rounded-xl border-2 transition-all",
              heroMode === "standard" ? "border-primary bg-primary/10 font-bold" : "border-border hover:bg-muted"
            )}
          >
            <p className="text-xs font-bold">Standard Split</p>
            <p className="text-[10px] text-muted-foreground">Chữ bên trái + Card bên phải</p>
          </button>
          <button
            type="button"
            onClick={() => update("hero_mode", "single_cover")}
            className={cn("p-2.5 text-left rounded-xl border-2 transition-all",
              heroMode === "single_cover" ? "border-primary bg-primary/10 font-bold" : "border-border hover:bg-muted"
            )}
          >
            <p className="text-xs font-bold">Single Cover</p>
            <p className="text-[10px] text-muted-foreground">1 Ảnh bìa ngang toàn bộ</p>
          </button>
          <button
            type="button"
            onClick={() => update("hero_mode", "carousel")}
            className={cn("p-2.5 text-left rounded-xl border-2 transition-all",
              heroMode === "carousel" ? "border-primary bg-primary/10 font-bold" : "border-border hover:bg-muted"
            )}
          >
            <p className="text-xs font-bold">Carousel Slide</p>
            <p className="text-[10px] text-muted-foreground">Slide trượt nhiều banner</p>
          </button>
        </div>
      </div>

      <BannerStyleEditor
        value={content.banner_style}
        onChange={(style) => update("banner_style", style)}
        imageUrl={content.cover_image_url || content.background_image || carouselSlides?.[0]?.image_url}
        title={content.title_vi || content.title}
      />

      {/* Mode Carousel Editor */}
      {heroMode === "carousel" && (
        <div className="space-y-4 p-4 rounded-xl bg-background border">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Danh sách Slides Banner (Carousel)
            </h4>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const newSlides = [...carouselSlides, {
                  image_url: "",
                  title_vi: "Tiêu đề Slide mới",
                  subtitle_vi: "Khuyến mãi hot",
                  description_vi: "Mô tả cho slide mới...",
                  button_text_vi: "Xem ngay",
                  button_url: "/auth"
                }];
                update("carousel_slides", newSlides);
              }}
              className="h-7 text-xs font-bold gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm Slide
            </Button>
          </div>

          {carouselSlides.map((slide, idx) => (
            <div key={idx} className="p-3 rounded-xl border bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Slide #{idx + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => {
                    update("carousel_slides", carouselSlides.filter((_, i) => i !== idx));
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <MediaField
                label={`Ảnh Banner Slide #${idx + 1}`}
                value={slide.image_url || ""}
                onChange={(url) => {
                  const updated = [...carouselSlides];
                  updated[idx] = { ...updated[idx], image_url: url };
                  update("carousel_slides", updated);
                }}
                hint="💡 1920 × 800 px (tỷ lệ 21:9)"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px]">Tiêu đề Slide</Label>
                  <Input
                    value={slide.title_vi || ""}
                    onChange={(e) => {
                      const updated = [...carouselSlides];
                      updated[idx] = { ...updated[idx], title_vi: e.target.value };
                      update("carousel_slides", updated);
                    }}
                    placeholder="Tiêu đề banner"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Phụ đề (Tagline)</Label>
                  <Input
                    value={slide.subtitle_vi || ""}
                    onChange={(e) => {
                      const updated = [...carouselSlides];
                      updated[idx] = { ...updated[idx], subtitle_vi: e.target.value };
                      update("carousel_slides", updated);
                    }}
                    placeholder="Phụ đề banner"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[11px]">Mô tả Slide</Label>
                <Textarea
                  value={slide.description_vi || ""}
                  onChange={(e) => {
                    const updated = [...carouselSlides];
                    updated[idx] = { ...updated[idx], description_vi: e.target.value };
                    update("carousel_slides", updated);
                  }}
                  placeholder="Mô tả cho slide banner này"
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px]">Tên nút bấm CTA</Label>
                  <Input
                    value={slide.button_text_vi || ""}
                    onChange={(e) => {
                      const updated = [...carouselSlides];
                      updated[idx] = { ...updated[idx], button_text_vi: e.target.value };
                      update("carousel_slides", updated);
                    }}
                    placeholder="Xem ngay"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Link nút bấm</Label>
                  <Input
                    value={slide.button_url || ""}
                    onChange={(e) => {
                      const updated = [...carouselSlides];
                      updated[idx] = { ...updated[idx], button_url: e.target.value };
                      update("carousel_slides", updated);
                    }}
                    placeholder="/auth hoặc https://..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic CTA Buttons Manager with Add/Delete/Reorder */}
      <div className="space-y-3 p-4 rounded-xl bg-background border">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Link className="w-3.5 h-3.5 text-primary" /> Quản Lý Danh Sách Nút Bấm Call-To-Action (CTA)
          </h4>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const currentBtns = content.custom_buttons || [
                primaryBtn,
                secondaryBtn
              ];
              const newBtn = {
                id: `btn_${Date.now()}`,
                text: "Nút bấm mới",
                url: "/khoa-hoc",
                variant: "primary",
                enabled: true
              };
              update("custom_buttons", [...currentBtns, newBtn]);
            }}
            className="h-7 text-xs font-bold gap-1 text-primary border-primary/40 hover:bg-primary/10"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Nút Bấm Mới
          </Button>
        </div>

        {/* Buttons Placement Selector */}
        <div className="p-3 rounded-lg bg-muted/30 border space-y-2">
          <Label className="text-xs font-bold">Vị Trí & Phong Cách Nút Bấm</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => update("buttons_placement", "overlay")}
              className={cn("p-2 text-left rounded-lg border text-xs transition-all",
                content.buttons_placement === "overlay" ? "border-primary bg-primary/10 font-bold" : "bg-card hover:bg-muted"
              )}
            >
              <p className="font-bold">🌄 Đè Lên Ảnh (Background Overlay)</p>
              <p className="text-[10px] text-muted-foreground">Nút bấm hiển thị trực tiếp trên tấm ảnh bìa</p>
            </button>
            <button
              type="button"
              onClick={() => update("buttons_placement", "below")}
              className={cn("p-2 text-left rounded-lg border text-xs transition-all",
                (!content.buttons_placement || content.buttons_placement === "below") ? "border-primary bg-primary/10 font-bold" : "bg-card hover:bg-muted"
              )}
            >
              <p className="font-bold">🖼️ Bên Dưới Banner</p>
              <p className="text-[10px] text-muted-foreground">Nút bấm đặt ở phần chi tiết bên dưới ảnh</p>
            </button>
          </div>
        </div>

        {/* Buttons List */}
        {((content.custom_buttons as any[]) || [primaryBtn, secondaryBtn]).map((btn: any, idx: number, arr: any[]) => (
          <div key={btn.id || idx} className="p-3 rounded-lg border bg-muted/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">Nút #{idx + 1}</span>
                <span className="text-xs font-bold truncate max-w-[140px]">{btn.text || "Nút bấm"}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                {/* Reorder Buttons */}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={idx === 0}
                  onClick={() => {
                    const list = [...arr];
                    const temp = list[idx - 1];
                    list[idx - 1] = list[idx];
                    list[idx] = temp;
                    update("custom_buttons", list);
                  }}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={idx === arr.length - 1}
                  onClick={() => {
                    const list = [...arr];
                    const temp = list[idx + 1];
                    list[idx + 1] = list[idx];
                    list[idx] = temp;
                    update("custom_buttons", list);
                  }}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  ↓
                </Button>
                <span className="text-[11px] text-muted-foreground ml-1">Bật:</span>
                <Switch
                  checked={btn.enabled !== false}
                  onCheckedChange={(val) => {
                    const list = [...arr];
                    list[idx] = { ...list[idx], enabled: val };
                    update("custom_buttons", list);
                  }}
                />
                {arr.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const list = arr.filter((_, i) => i !== idx);
                      update("custom_buttons", list);
                    }}
                    className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {btn.enabled !== false && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div>
                  <Label className="text-[11px]">Nội dung chữ</Label>
                  <Input
                    value={btn.text || ""}
                    onChange={(e) => {
                      const list = [...arr];
                      list[idx] = { ...list[idx], text: e.target.value };
                      update("custom_buttons", list);
                    }}
                    placeholder="Tên nút bấm"
                    className="h-8 text-xs font-semibold"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Đường dẫn (Link)</Label>
                  <Input
                    value={btn.url || ""}
                    onChange={(e) => {
                      const list = [...arr];
                      list[idx] = { ...list[idx], url: e.target.value };
                      update("custom_buttons", list);
                    }}
                    placeholder="/auth hoặc https://..."
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Kiểu thiết kế (Variant)</Label>
                  <select
                    value={btn.variant || "primary"}
                    onChange={(e) => {
                      const list = [...arr];
                      list[idx] = { ...list[idx], variant: e.target.value };
                      update("custom_buttons", list);
                    }}
                    className="w-full h-8 px-2 text-xs rounded-md border border-input bg-background"
                  >
                    <option value="primary">Dark Navy Solid (Nút chính)</option>
                    <option value="outline">White Border (Viền)</option>
                    <option value="rose">Rose Red (Màu đỏ)</option>
                    <option value="gold">Gold (Màu vàng)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
        {/* Hero Stats Customizer */}
        <div className="p-3 rounded-xl border bg-background space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" /> Thống kê Khối Hero (KPI Stats)
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Bật/Tắt Thống kê:</span>
              <Switch
                checked={content.show_stats !== false}
                onCheckedChange={(val) => update("show_stats", val)}
              />
            </div>
          </div>

          {content.show_stats !== false && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-2.5 rounded-lg border bg-muted/20 space-y-1">
                <Label className="text-[11px] font-bold">Chỉ số #1 (Học viên)</Label>
                <Input
                  value={content.students || "50K+"}
                  onChange={(e) => update("students", e.target.value)}
                  placeholder="50K+"
                  className="h-8 text-xs font-bold"
                />
              </div>
              <div className="p-2.5 rounded-lg border bg-muted/20 space-y-1">
                <Label className="text-[11px] font-bold">Chỉ số #2 (Giáo viên)</Label>
                <Input
                  value={content.teachers || "200+"}
                  onChange={(e) => update("teachers", e.target.value)}
                  placeholder="200+"
                  className="h-8 text-xs font-bold"
                />
              </div>
              <div className="p-2.5 rounded-lg border bg-muted/20 space-y-1">
                <Label className="text-[11px] font-bold">Chỉ số #3 (Bài học)</Label>
                <Input
                  value={content.lessons || "1000+"}
                  onChange={(e) => update("lessons", e.target.value)}
                  placeholder="1000+"
                  className="h-8 text-xs font-bold"
                />
              </div>
            </div>
          )}
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

const FooterEditor = ({ content, onChange }: { content: Record<string, any>; onChange: (c: Record<string, any>) => void }) => {
  const update = (key: string, value: string) => onChange({ ...content, [key]: value });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" /> Thông tin Chân trang (Footer)
      </h3>
      
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Mô tả thương hiệu</Label>
        <Textarea 
          value={content.brand_description || ""} 
          onChange={(e) => update("brand_description", e.target.value)} 
          rows={3}
          placeholder="Trung tâm đào tạo Tiếng Nhật hàng đầu..." 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Địa chỉ trụ sở</Label>
          <Input value={content.address || ""} onChange={(e) => update("address", e.target.value)} placeholder="123 Nguyễn Huệ, Q.1, TP.HCM" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Số điện thoại Hotline</Label>
          <Input value={content.phone || ""} onChange={(e) => update("phone", e.target.value)} placeholder="1900 1234" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Email liên hệ</Label>
          <Input value={content.email || ""} onChange={(e) => update("email", e.target.value)} placeholder="hello@tnqdo.com" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Tên miền Website / URL</Label>
          <Input value={content.website_domain || ""} onChange={(e) => update("website_domain", e.target.value)} placeholder="https://quangdungjp.quachthanhlong.com/" />
        </div>
      </div>

      <div className="border-t pt-3 space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mạng xã hội</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Facebook URL</Label>
            <Input value={content.facebook_url || ""} onChange={(e) => update("facebook_url", e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Youtube URL</Label>
            <Input value={content.youtube_url || ""} onChange={(e) => update("youtube_url", e.target.value)} placeholder="https://youtube.com/..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Instagram URL</Label>
            <Input value={content.instagram_url || ""} onChange={(e) => update("instagram_url", e.target.value)} placeholder="https://instagram.com/..." />
          </div>
        </div>
      </div>

      <div className="space-y-1 border-t pt-3">
        <Label className="text-xs font-semibold">Bản quyền (Copyright text)</Label>
        <Input value={content.copyright_text || ""} onChange={(e) => update("copyright_text", e.target.value)} placeholder="© 2026 TNQDO. All rights reserved." />
      </div>
    </div>
  );
};

const GenericSectionEditor = ({ sectionKey, content, onChange }: { sectionKey: string; content: Record<string, any>; onChange: (c: Record<string, any>) => void }) => {
  const update = (key: string, value: any) => onChange({ ...content, [key]: value });
  const layoutMode = content.layout_mode || 'standard_split';
  const primaryBtn = content.primary_btn || { enabled: true, text: 'Xem chi tiết', url: '/auth' };
  const secondaryBtn = content.secondary_btn || { enabled: false, text: 'Liên hệ tư vấn', url: '/lien-he' };
  const features = (content.features as string[]) || [];

  return (
    <div className="space-y-5 border p-4 rounded-2xl bg-muted/20">
      {/* Layout Mode Selector */}
      <div className="space-y-2">
        <Label className="text-xs font-bold flex items-center gap-2">
          <Layout className="w-4 h-4 text-primary" /> Chọn Kiểu Layout Hiển Thị Section
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => update("layout_mode", "standard_split")}
            className={cn("p-2.5 text-left rounded-xl border-2 transition-all",
              layoutMode === "standard_split" ? "border-primary bg-primary/10 font-bold" : "border-border hover:bg-muted"
            )}
          >
            <p className="text-xs font-bold">Text + Ảnh (Split)</p>
            <p className="text-[10px] text-muted-foreground">Chữ bên trái + Ảnh bên phải</p>
          </button>
          <button
            type="button"
            onClick={() => update("layout_mode", "full_banner")}
            className={cn("p-2.5 text-left rounded-xl border-2 transition-all",
              layoutMode === "full_banner" ? "border-primary bg-primary/10 font-bold" : "border-border hover:bg-muted"
            )}
          >
            <p className="text-xs font-bold">1 Ảnh Full Banner</p>
            <p className="text-[10px] text-muted-foreground">Banner 100% chiều ngang</p>
          </button>
          <button
            type="button"
            onClick={() => update("layout_mode", "carousel")}
            className={cn("p-2.5 text-left rounded-xl border-2 transition-all",
              layoutMode === "carousel" ? "border-primary bg-primary/10 font-bold" : "border-border hover:bg-muted"
            )}
          >
            <p className="text-xs font-bold">Carousel Slide</p>
            <p className="text-[10px] text-muted-foreground">Trượt nhiều banner</p>
          </button>
          <button
            type="button"
            onClick={() => update("layout_mode", "text_only")}
            className={cn("p-2.5 text-left rounded-xl border-2 transition-all",
              layoutMode === "text_only" ? "border-primary bg-primary/10 font-bold" : "border-border hover:bg-muted"
            )}
          >
            <p className="text-xs font-bold">Chỉ Chữ (Text Only)</p>
            <p className="text-[10px] text-muted-foreground">Khối văn bản trung tâm</p>
          </button>
        </div>
      </div>

      <BannerStyleEditor
        value={content.banner_style}
        onChange={(style) => update("banner_style", style)}
        imageUrl={content.cover_image_url || content.background_image}
        title={content.title_vi || content.title}
      />

      {/* Button Customizers */}
      <div className="space-y-3 p-3 rounded-xl bg-background border">
        <Label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Tùy chỉnh Nút bấm Hành động (CTA Buttons)
        </Label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2 p-2.5 rounded-lg border bg-muted/20">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">Nút Chính (Primary)</Label>
              <Switch
                checked={primaryBtn.enabled !== false}
                onCheckedChange={(checked) => update("primary_btn", { ...primaryBtn, enabled: checked })}
              />
            </div>
            <Input
              placeholder="VD: Học miễn phí ngay"
              value={primaryBtn.text || ""}
              onChange={(e) => update("primary_btn", { ...primaryBtn, text: e.target.value })}
              className="h-8 text-xs font-bold"
            />
            <Input
              placeholder="VD: /auth"
              value={primaryBtn.url || ""}
              onChange={(e) => update("primary_btn", { ...primaryBtn, url: e.target.value })}
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="space-y-2 p-2.5 rounded-lg border bg-muted/20">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">Nút Phụ (Secondary)</Label>
              <Switch
                checked={secondaryBtn.enabled === true}
                onCheckedChange={(checked) => update("secondary_btn", { ...secondaryBtn, enabled: checked })}
              />
            </div>
            <Input
              placeholder="VD: Tìm hiểu thêm"
              value={secondaryBtn.text || ""}
              onChange={(e) => update("secondary_btn", { ...secondaryBtn, text: e.target.value })}
              className="h-8 text-xs font-bold"
            />
            <Input
              placeholder="VD: /lien-he"
              value={secondaryBtn.url || ""}
              onChange={(e) => update("secondary_btn", { ...secondaryBtn, url: e.target.value })}
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactEditor = ({ content, onChange }: { content: Record<string, any>; onChange: (data: Record<string, any>) => void }) => {
  const update = (key: string, val: any) => onChange({ ...content, [key]: val });
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-extrabold">Mã nhúng / Link Google Maps (Iframe Embed URL)</Label>
        <Textarea
          rows={3}
          placeholder="Dán mã Google Maps Embed hoặc URL map (VD: https://www.google.com/maps/embed?pb=...)"
          value={content.google_maps_url || ''}
          onChange={(e) => update('google_maps_url', e.target.value)}
          className="text-xs font-mono"
        />
        <p className="text-[11px] text-muted-foreground">
          Vào Google Maps ➔ Chia sẻ ➔ Nhúng bản đồ ➔ Copy link trong src="..." dán vào đây.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-bold">Hotline 1</Label>
          <Input value={content.phone_1 || ''} onChange={(e) => update('phone_1', e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-bold">Hotline 2</Label>
          <Input value={content.phone_2 || ''} onChange={(e) => update('phone_2', e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-bold">Email chính</Label>
          <Input value={content.email_1 || ''} onChange={(e) => update('email_1', e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-bold">Địa chỉ trụ sở</Label>
          <Input value={content.address || ''} onChange={(e) => update('address', e.target.value)} className="h-8 text-xs" />
        </div>
      </div>
    </div>
  );
};

const PartnersEditor = ({ content, onChange }: { content: Record<string, any>; onChange: (data: Record<string, any>) => void }) => {
  const partnersList = Array.isArray(content.partners_list) ? content.partners_list : [];
  const update = (key: string, val: any) => onChange({ ...content, [key]: val });

  const addPartner = () => {
    const newPartner = {
      id: Date.now().toString(),
      name: 'Đối tác mới',
      logoUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=300&auto=format&fit=crop&q=80',
      websiteUrl: 'https://www.quangdungnihongo.com',
    };
    update('partners_list', [...partnersList, newPartner]);
  };

  const updatePartner = (index: number, field: string, val: any) => {
    const updated = [...partnersList];
    updated[index] = { ...updated[index], [field]: val };
    update('partners_list', updated);
  };

  const removePartner = (index: number) => {
    const updated = partnersList.filter((_, i) => i !== index);
    update('partners_list', updated);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl border bg-muted/20">
        <div className="space-y-1">
          <Label className="text-xs font-bold">Tiêu đề Section</Label>
          <Input
            value={content.section_title || 'Đơn vị kết nối'}
            onChange={(e) => update('section_title', e.target.value)}
            className="h-8 text-xs font-bold"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-bold">Tốc độ trượt Carousel (Giây)</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={content.slide_speed_seconds || 3.5}
            onChange={(e) => update('slide_speed_seconds', parseFloat(e.target.value) || 3.5)}
            className="h-8 text-xs font-mono"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs font-extrabold text-foreground">Danh sách các đối tác kết nối ({partnersList.length})</Label>
        <Button size="sm" variant="outline" onClick={addPartner} className="h-7 text-xs font-bold gap-1">
          <Plus className="w-3.5 h-3.5" /> Thêm đối tác
        </Button>
      </div>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {partnersList.map((partner: any, idx: number) => (
          <div key={partner.id || idx} className="p-3 rounded-xl border bg-card space-y-2 relative group shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-muted-foreground w-5">{idx + 1}.</span>
              <Input
                placeholder="Tên đơn vị đối tác"
                value={partner.name || ''}
                onChange={(e) => updatePartner(idx, 'name', e.target.value)}
                className="h-8 text-xs font-bold flex-1"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removePartner(idx)}
                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                placeholder="URL Logo (https://...)"
                value={partner.logoUrl || ''}
                onChange={(e) => updatePartner(idx, 'logoUrl', e.target.value)}
                className="h-8 text-xs font-mono"
              />
              <Input
                placeholder="URL Website đối tác"
                value={partner.websiteUrl || ''}
                onChange={(e) => updatePartner(idx, 'websiteUrl', e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        ))}
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
    case "footer":
      return <FooterEditor content={content} onChange={onChange} />;
    case "partners":
      return <PartnersEditor content={content} onChange={onChange} />;
    case "contact_info":
    case "contact":
      return <ContactEditor content={content} onChange={onChange} />;
    default:
      return <GenericSectionEditor sectionKey={sectionKey} content={content} onChange={onChange} />;
  }
};

export default SectionEditorFields;

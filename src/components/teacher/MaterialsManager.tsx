import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import DocumentViewer from "./DocumentViewer";
import {
  FileText, Upload, Trash2, Eye, FileType2, Presentation, FileSpreadsheet,
  File as FileIcon, Loader2, Plus, ArrowUp, ArrowDown, RefreshCw, Music2,
  Video, Image as ImageIcon, Archive, Link2, ExternalLink, ChevronDown,
  FolderOpen, MoreVertical, FolderPlus,
} from "lucide-react";
import PdfPresenter from "./PdfPresenter";

interface Material {
  id: string;
  title: string;
  description: string | null; // used as topic
  file_url: string;
  file_type: string;
  file_size: number | null;
  lesson_id: string | null;
  class_id: string | null;
  created_at: string;
  order_index: number | null;
}

interface LessonRef { id: string; title_vi: string | null; title: string }

type Scope =
  | { kind: "teacher"; lessons?: LessonRef[] }      // generic library, can link to any lesson
  | { kind: "lesson"; lessonId: string }            // attachments for one lesson
  | { kind: "class"; classId: string };             // attachments for one class

interface Props {
  lessons?: LessonRef[];          // back-compat (teacher library)
  scope?: Scope;
  readOnly?: boolean;
  title?: string;
}

const NO_TOPIC = "Không có chủ đề";

const iconFor = (t: string) => {
  const cls = "w-5 h-5";
  if (t === "pdf") return <FileType2 className={`${cls} text-rose-500`} />;
  if (["doc", "docx"].includes(t)) return <FileText className={`${cls} text-blue-500`} />;
  if (["ppt", "pptx"].includes(t)) return <Presentation className={`${cls} text-orange-500`} />;
  if (["xls", "xlsx", "csv"].includes(t)) return <FileSpreadsheet className={`${cls} text-emerald-500`} />;
  if (["mp3", "wav", "m4a", "ogg", "aac", "flac"].includes(t))
    return <Music2 className={`${cls} text-violet-500`} />;
  if (["mp4", "mov", "webm", "mkv", "avi"].includes(t))
    return <Video className={`${cls} text-pink-500`} />;
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(t))
    return <ImageIcon className={`${cls} text-teal-500`} />;
  if (["zip", "rar", "7z", "tar", "gz"].includes(t))
    return <Archive className={`${cls} text-amber-600`} />;
  if (t === "link") return <Link2 className={`${cls} text-sky-500`} />;
  return <FileIcon className={`${cls} text-muted-foreground`} />;
};

const detectType = (name: string) =>
  (name.split(".").pop() || "other").toLowerCase().slice(0, 12);

const fmtSize = (n: number | null) => {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

const ACCEPT_ALL =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt," +
  ".mp3,.wav,.m4a,.ogg,.aac,.flac," +
  ".mp4,.mov,.webm,.mkv,.avi," +
  ".jpg,.jpeg,.png,.gif,.webp,.svg,.bmp," +
  ".zip,.rar,.7z,.tar,.gz";

const MaterialsManager = ({ lessons, scope, readOnly, title }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const effectiveScope: Scope = scope || { kind: "teacher", lessons: lessons || [] };
  const teacherLessons = effectiveScope.kind === "teacher" ? (effectiveScope.lessons || []) : (lessons || []);

  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [preview, setPreview] = useState<Material | null>(null);
  const [presenting, setPresenting] = useState<Material | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"file" | "link">("file");

  const [form, setForm] = useState({
    title: "",
    topic: "",
    link_url: "",
    lesson_id: "none",
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});

  const load = async () => {
    if (!user && effectiveScope.kind === "teacher") return;
    setLoading(true);
    let q = supabase.from("lesson_materials").select("*");
    if (effectiveScope.kind === "teacher") q = q.eq("teacher_id", user!.id);
    if (effectiveScope.kind === "lesson") q = q.eq("lesson_id", effectiveScope.lessonId);
    if (effectiveScope.kind === "class") q = q.eq("class_id", effectiveScope.classId);
    const { data, error } = await q
      .order("order_index", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    setItems((data as Material[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user, effectiveScope.kind, (effectiveScope as any).lessonId, (effectiveScope as any).classId]);

  const grouped = useMemo(() => {
    const filtered = items.filter((i) =>
      filterTopic === "all" ? true : (i.description || NO_TOPIC) === filterTopic
    );
    const map = new Map<string, Material[]>();
    for (const m of filtered) {
      const k = (m.description || "").trim() || NO_TOPIC;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(m);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === NO_TOPIC) return -1;
      if (b === NO_TOPIC) return 1;
      return a.localeCompare(b, "vi");
    });
  }, [items, filterTopic]);

  const topics = useMemo(
    () =>
      Array.from(
        new Set(items.map((m) => (m.description || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, "vi")),
    [items]
  );

  const resetForm = () => {
    setForm({ title: "", topic: "", link_url: "", lesson_id: "none" });
    setCreateMode("file");
  };

  const persistRow = async (extra: Partial<Material>) => {
    if (!user) throw new Error("Chưa đăng nhập");
    const nextOrder = (items.reduce((m, it) => Math.max(m, it.order_index || 0), 0) || 0) + 1;
    const lessonId =
      effectiveScope.kind === "lesson"
        ? effectiveScope.lessonId
        : form.lesson_id === "none"
        ? null
        : form.lesson_id;
    const classId = effectiveScope.kind === "class" ? effectiveScope.classId : null;
    const row: any = {
      teacher_id: user.id,
      title: form.title || (extra.title ?? "Tài liệu"),
      description: form.topic.trim() || null,
      lesson_id: lessonId,
      class_id: classId,
      order_index: nextOrder,
      ...extra,
    };
    const { error } = await supabase.from("lesson_materials").insert(row);
    if (error) throw error;
  };

  const handleFile = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = detectType(file.name);
      const path = `materials/${user.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("lesson-assets")
        .upload(path, file, { contentType: file.type || undefined });
      if (upErr) throw upErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from("lesson-assets").getPublicUrl(path);
      await persistRow({
        title: form.title || file.name,
        file_url: publicUrl,
        file_type: ext,
        file_size: file.size,
      });
      toast({ title: "Đã tải lên", description: file.name });
      setCreateOpen(false);
      resetForm();
      load();
    } catch (e: any) {
      toast({ title: "Lỗi upload", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleLink = async () => {
    if (!form.link_url.trim()) {
      return toast({ title: "Thiếu URL", variant: "destructive" });
    }
    try {
      await persistRow({
        title: form.title || form.link_url,
        file_url: form.link_url.trim(),
        file_type: "link",
        file_size: null,
      });
      toast({ title: "Đã thêm liên kết" });
      setCreateOpen(false);
      resetForm();
      load();
    } catch (e: any) {
      toast({ title: "Lỗi", description: e.message, variant: "destructive" });
    }
  };

  const handleReplace = async (m: Material, file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = detectType(file.name);
      const path = `materials/${user.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("lesson-assets")
        .upload(path, file, { contentType: file.type || undefined });
      if (upErr) throw upErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from("lesson-assets").getPublicUrl(path);
      const { error: updErr } = await supabase
        .from("lesson_materials")
        .update({ file_url: publicUrl, file_type: ext, file_size: file.size })
        .eq("id", m.id);
      if (updErr) throw updErr;
      toast({ title: "Đã thay thế", description: file.name });
      load();
    } catch (e: any) {
      toast({ title: "Lỗi", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setReplacingId(null);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  };

  const move = async (m: Material, list: Material[], direction: -1 | 1) => {
    const sorted = [...list].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const idx = sorted.findIndex((x) => x.id === m.id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    const a = m.order_index ?? idx + 1;
    const b = other.order_index ?? swapIdx + 1;
    await Promise.all([
      supabase.from("lesson_materials").update({ order_index: b }).eq("id", m.id),
      supabase.from("lesson_materials").update({ order_index: a }).eq("id", other.id),
    ]);
    load();
  };

  const remove = async (m: Material) => {
    if (!confirm("Xóa tài liệu này?")) return;
    await supabase.from("lesson_materials").delete().eq("id", m.id);
    load();
  };

  const renameTopic = async (oldTopic: string) => {
    const next = prompt("Đổi tên chủ đề", oldTopic === NO_TOPIC ? "" : oldTopic);
    if (next === null) return;
    const targets = items.filter((m) => (m.description || "").trim() === (oldTopic === NO_TOPIC ? "" : oldTopic));
    await Promise.all(
      targets.map((m) =>
        supabase
          .from("lesson_materials")
          .update({ description: next.trim() || null })
          .eq("id", m.id)
      )
    );
    load();
  };

  const openPreview = (m: Material) => {
    if (m.file_type === "link") {
      window.open(m.file_url, "_blank", "noopener");
    } else {
      setPreview(m);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-primary/5 via-card to-card border-b">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              {title || "Tài liệu lớp học"}
              <Badge variant="outline" className="ml-1">{items.length}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Tải lên PDF, Word, PPT, Excel, ảnh, audio (MP3/WAV), video (MP4) hoặc dán link như Google Classroom.
            </p>
          </div>
          {!readOnly && (
            <Button variant="hero" onClick={() => { resetForm(); setCreateOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Tạo
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {topics.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Bộ lọc theo chủ đề:</span>
            <Select value={filterTopic} onValueChange={setFilterTopic}>
              <SelectTrigger className="w-[260px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chủ đề</SelectItem>
                <SelectItem value={NO_TOPIC}>{NO_TOPIC}</SelectItem>
                {topics.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
            <FolderPlus className="w-14 h-14 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-foreground/70">Chưa có tài liệu nào</p>
            <p className="text-xs">Nhấn "Tạo" để tải lên file hoặc thêm liên kết</p>
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map(([topic, list]) => {
              const open = openTopics[topic] !== false;
              return (
                <Collapsible
                  key={topic}
                  open={open}
                  onOpenChange={(v) =>
                    setOpenTopics((s) => ({ ...s, [topic]: v }))
                  }
                  className="border rounded-xl bg-card overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                    <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${open ? "" : "-rotate-90"}`}
                      />
                      <h3 className="font-semibold text-base">{topic}</h3>
                      <Badge variant="secondary" className="text-[10px]">
                        {list.length}
                      </Badge>
                    </CollapsibleTrigger>
                    {!readOnly && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => renameTopic(topic)}>
                            Đổi tên chủ đề
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <CollapsibleContent>
                    <div className="divide-y">
                      {list.map((m, idx) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            {iconFor(m.file_type)}
                          </div>
                          <button
                            onClick={() => openPreview(m)}
                            className="flex-1 text-left min-w-0"
                          >
                            <p className="font-medium truncate">{m.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <Badge
                                variant="outline"
                                className="uppercase text-[10px] py-0 px-1.5"
                              >
                                {m.file_type}
                              </Badge>
                              {m.file_size != null && <span>{fmtSize(m.file_size)}</span>}
                              {m.file_type === "link" && (
                                <span className="truncate max-w-[40ch]">{m.file_url}</span>
                              )}
                            </div>
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => openPreview(m)}
                              title={m.file_type === "link" ? "Mở liên kết" : "Xem"}
                            >
                              {m.file_type === "link" ? (
                                <ExternalLink className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            {(["pdf", "ppt", "pptx", "slide"].includes(m.file_type.toLowerCase()) ||
                              m.file_url.includes("canva.com") ||
                              m.file_url.includes("google.com/presentation")) && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-500/10"
                                onClick={() => setPresenting(m)}
                                title="Trình chiếu slide bài giảng"
                              >
                                <Presentation className="w-4 h-4" />
                              </Button>
                            )}
                            {!readOnly && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  disabled={idx === 0}
                                  onClick={() => move(m, list, -1)}
                                  title="Lên"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  disabled={idx === list.length - 1}
                                  onClick={() => move(m, list, 1)}
                                  title="Xuống"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </Button>
                                {m.file_type !== "link" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setReplacingId(m.id);
                                      replaceInputRef.current?.click();
                                    }}
                                    title="Thay thế file"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => remove(m)}
                                  title="Xóa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}

        {/* Audio inline player preview note */}
        {preview && ["mp3", "wav", "m4a", "ogg", "aac", "flac"].includes(preview.file_type) && (
          <Dialog open onOpenChange={() => setPreview(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{preview.title}</DialogTitle>
              </DialogHeader>
              <audio src={preview.file_url} controls className="w-full" />
              <a
                href={preview.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> Mở trong tab mới
              </a>
            </DialogContent>
          </Dialog>
        )}
        {preview && ["mp4", "mov", "webm", "mkv"].includes(preview.file_type) && (
          <Dialog open onOpenChange={() => setPreview(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{preview.title}</DialogTitle>
              </DialogHeader>
              <video src={preview.file_url} controls className="w-full rounded-md" />
            </DialogContent>
          </Dialog>
        )}
        {preview && ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(preview.file_type) && (
          <Dialog open onOpenChange={() => setPreview(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{preview.title}</DialogTitle>
              </DialogHeader>
              <img src={preview.file_url} alt={preview.title} className="w-full rounded-md" />
            </DialogContent>
          </Dialog>
        )}
        {preview &&
          !["mp3", "wav", "m4a", "ogg", "aac", "flac",
             "mp4", "mov", "webm", "mkv",
             "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(preview.file_type) && (
            <Dialog open onOpenChange={() => setPreview(null)}>
              <DialogContent className="max-w-5xl">
                <DialogHeader>
                  <DialogTitle>{preview.title}</DialogTitle>
                </DialogHeader>
                <DocumentViewer
                  url={preview.file_url}
                  title={preview.title}
                  fileType={preview.file_type}
                />
              </DialogContent>
            </Dialog>
          )}

        {presenting && (
          <PdfPresenter
            open={!!presenting}
            onOpenChange={(o) => !o && setPresenting(null)}
            url={presenting.file_url}
            title={presenting.title}
          />
        )}

        {/* Replace input */}
        <input
          ref={replaceInputRef}
          type="file"
          accept={ACCEPT_ALL}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            const target = items.find((i) => i.id === replacingId);
            if (f && target) handleReplace(target, f);
          }}
        />

        {/* Create dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {createMode === "file" ? "Tải tệp lên" : "Thêm liên kết"}
              </DialogTitle>
              <DialogDescription>
                Chọn chủ đề để gom nhóm tài liệu giống Google Classroom.
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={createMode === "file" ? "default" : "outline"}
                onClick={() => setCreateMode("file")}
              >
                <Upload className="w-4 h-4 mr-1" /> Tệp
              </Button>
              <Button
                size="sm"
                variant={createMode === "link" ? "default" : "outline"}
                onClick={() => setCreateMode("link")}
              >
                <Link2 className="w-4 h-4 mr-1" /> Liên kết
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Tên hiển thị {createMode === "file" && "(tùy chọn)"}</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={createMode === "file" ? "Mặc định: tên file" : "VD: Bài giảng YouTube"}
                />
              </div>

              <div>
                <Label>Chủ đề</Label>
                <Input
                  list="topic-suggestions"
                  value={form.topic}
                  onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                  placeholder="VD: Tuần 1 - Tổng quan, Ngữ pháp N5..."
                />
                <datalist id="topic-suggestions">
                  <option value="Giáo trình học (Sách Ebook / Lộ trình chung)" />
                  {topics.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              {effectiveScope.kind === "teacher" && teacherLessons.length > 0 && (
                <div>
                  <Label>Gắn vào bài học (tùy chọn)</Label>
                  <Select
                    value={form.lesson_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, lesson_id: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không gắn bài học</SelectItem>
                      {teacherLessons.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.title_vi || l.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {createMode === "link" ? (
                <div>
                  <Label>URL</Label>
                  <Input
                    value={form.link_url}
                    onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                    placeholder="https://"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-xl p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    PDF · Word · PPT · Excel · MP3 · MP4 · Ảnh · ZIP
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Chọn file
                  </Button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT_ALL}
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFile(e.target.files[0])
                    }
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Hủy
              </Button>
              {createMode === "link" && (
                <Button onClick={handleLink}>Thêm liên kết</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default MaterialsManager;

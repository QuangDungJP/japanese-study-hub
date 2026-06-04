import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import DocumentViewer from "./DocumentViewer";
import {
  FileText, Upload, Trash2, Eye, FileType2, Presentation, FileSpreadsheet,
  File as FileIcon, Loader2, Plus,
} from "lucide-react";

interface Material {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size: number | null;
  lesson_id: string | null;
  class_id: string | null;
  created_at: string;
}

interface LessonRef { id: string; title_vi: string | null; title: string }

const iconFor = (t: string) => {
  if (t === "pdf") return <FileType2 className="w-5 h-5 text-rose-500" />;
  if (t === "docx" || t === "doc") return <FileText className="w-5 h-5 text-blue-500" />;
  if (t === "pptx" || t === "ppt") return <Presentation className="w-5 h-5 text-orange-500" />;
  if (t === "xlsx" || t === "xls") return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
  return <FileIcon className="w-5 h-5 text-muted-foreground" />;
};

const detectType = (name: string) => (name.split(".").pop() || "other").toLowerCase();

const MaterialsManager = ({ lessons }: { lessons: LessonRef[] }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterLesson, setFilterLesson] = useState<string>("all");
  const [preview, setPreview] = useState<Material | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [linkLessonId, setLinkLessonId] = useState<string>("none");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("lesson_materials")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    setItems((data as Material[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const handleFile = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = detectType(file.name);
      const path = `materials/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("lesson-assets").upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("lesson-assets").getPublicUrl(path);
      const { error: insErr } = await supabase.from("lesson_materials").insert({
        teacher_id: user.id,
        title: newTitle || file.name,
        file_url: publicUrl,
        file_type: ext,
        file_size: file.size,
        lesson_id: linkLessonId === "none" ? null : linkLessonId,
      });
      if (insErr) throw insErr;
      toast({ title: "Đã tải lên", description: file.name });
      setNewTitle("");
      load();
    } catch (e: any) {
      toast({ title: "Lỗi upload", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (m: Material) => {
    if (!confirm("Xóa tài liệu này?")) return;
    await supabase.from("lesson_materials").delete().eq("id", m.id);
    load();
  };

  const filtered = items.filter((i) =>
    filterLesson === "all" ? true : filterLesson === "none" ? !i.lesson_id : i.lesson_id === filterLesson
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" /> Thư viện tài liệu ({items.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">Tải lên PDF, Word, PowerPoint, Excel để dùng trong bài giảng.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl border border-dashed p-4 grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <Input placeholder="Tên hiển thị (tùy chọn)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <Select value={linkLessonId} onValueChange={setLinkLessonId}>
            <SelectTrigger><SelectValue placeholder="Gắn vào bài học" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Không gắn bài học</SelectItem>
              {lessons.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.title_vi || l.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => inputRef.current?.click()} disabled={uploading} variant="hero">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Tải lên
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Lọc:</span>
          <Select value={filterLesson} onValueChange={setFilterLesson}>
            <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="none">Chưa gắn bài học</SelectItem>
              {lessons.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.title_vi || l.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p>Chưa có tài liệu nào.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <div key={m.id} className="rounded-xl border bg-card p-4 hover:shadow-md transition-all flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {iconFor(m.file_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{m.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="uppercase text-[10px]">{m.file_type}</Badge>
                      {m.file_size && (
                        <span className="text-xs text-muted-foreground">{(m.file_size / 1024 / 1024).toFixed(2)}MB</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-auto">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setPreview(m)}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> Xem
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(m)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-w-5xl">
            <DialogHeader><DialogTitle>{preview?.title}</DialogTitle></DialogHeader>
            {preview && <DocumentViewer url={preview.file_url} title={preview.title} fileType={preview.file_type} />}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default MaterialsManager;
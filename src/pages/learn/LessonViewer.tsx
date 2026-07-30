import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLearning } from "@/contexts/LearningContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import PdfPresenter from "@/components/teacher/PdfPresenter";
import BlockRenderer, { getEmbeddableInfo } from "@/components/lesson-viewer/BlockRenderer";
import { isBlockArray } from "@/lib/lessonBlocks";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Dumbbell,
  Download,
  FileText,
  Film,
  Presentation,
  Sparkles,
  Target,
  Trophy,
  ExternalLink,
} from "lucide-react";
interface Lesson {
  id: string;
title: string;
title_vi: string | null;
description: string | null;
description_vi: string | null;
content: any;
content_html: string | null;
video_url: string | null;
thumbnail_url: string | null;
level: string | null;
skill: string | null;
duration_minutes: number | null;
estimated_minutes: number | null;
xp_reward: number | null;
objectives: string | null;
prerequisites: string | null;
}
interface Material {
  id: string;
title: string;
description: string | null;
file_url: string;
file_type: string;
order_index: number;
}
const isPdf = (m: Material) =>
  m.file_type?.toLowerCase().includes("pdf") || /\.pdf($|\?)/i.test(m.file_url);
const isVideo = (m: Material) =>
  m.file_type?.toLowerCase().startsWith("video") ||
  /\.(mp4|webm|mov)($|\?)/i.test(m.file_url);
const LessonViewer = () => {
  const { id } = useParams<{ id: string }>();
const navigate = useNavigate();
const { user } = useAuth();
useLearning();
const [lesson, setLesson] = useState<Lesson | null>(null);
const [materials, setMaterials] = useState<Material[]>([]);
const [exerciseCount, setExerciseCount] = useState(0);
const [completed, setCompleted] = useState(false);
const [loading, setLoading] = useState(true);
const [presenter, setPresenter] = useState<{
    url: string;
title: string;
} | null>(null);
useEffect(() => {
    if (!id) return;
let cancelled = false;
(async () => {
      setLoading(true);
const [{ data: l }, { data: mats }, { data: ex }] = await Promise.all([
        supabase.from("lessons").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("lesson_materials")
          .select("id,title,description,file_url,file_type,order_index")
          .eq("lesson_id", id)
          .eq("is_published", true)
          .order("order_index", { ascending: true }),
        supabase.rpc("get_lesson_exercises", { _lesson_id: id }),
      ]);
if (cancelled) return;
setLesson(l as any);
setMaterials((mats || []) as Material[]);
setExerciseCount((ex || []).length);
if (user) {
        const { data: c } = await supabase
          .from("completed_lessons")
          .select("id")
          .eq("user_id", user.id)
          .eq("lesson_id", id)
          .maybeSingle();
setCompleted(!!c);
}
      setLoading(false);
})();
return () => {
      cancelled = true;
};
}, [id, user]);
  const videoEmbed = useMemo(() => {
    if (!lesson?.video_url) return null;
    const url = lesson.video_url.trim();
    const yt = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/,
    );
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    return url;
  }, [lesson]);

  const embeddedLinks = useMemo(() => {
    if (!lesson) return [];
    const list: string[] = [];

    const addIfValid = (u?: string | null) => {
      if (!u) return;
      const clean = u.trim();
      if (!clean) return;
      if (
        clean.includes("docs.google.com") ||
        clean.includes("canva.com") ||
        /\.(pdf|pptx?|xlsx?|docx?)($|\?)/i.test(clean)
      ) {
        if (!list.includes(clean)) list.push(clean);
      }
    };

    addIfValid((lesson as any).slide_url);
    addIfValid((lesson as any).document_url);

    if (lesson.content_html) {
      const found = lesson.content_html.match(/https?:\/\/(?:docs\.google\.com|canva\.com|[^\s<"']+\.(?:pdf|pptx?|xlsx?|docx?))[^\s<"']*/gi) || [];
      found.forEach(u => {
        const clean = u.replace(/[ "'>,]+$/, '').trim();
        addIfValid(clean);
      });
    }

    return list;
  }, [lesson]);

  const processedHtml = useMemo(() => {
    if (!lesson?.content_html) return null;
    let html = lesson.content_html;
    embeddedLinks.forEach(url => {
      const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const containerRegex = new RegExp(`<div[^>]*>\\s*<p[^>]*>.*?Slide trình chiếu:.*?<\\/p>\\s*<p[^>]*>\\s*<a[^>]*>${escapedUrl}<\\/a>\\s*<\\/p>\\s*<\\/div>`, 'gi');
      html = html.replace(containerRegex, '');
    });
    return html.trim() || null;
  }, [lesson?.content_html, embeddedLinks]);
const handleComplete = async () => {
    if (!user || !lesson || completed) return;
const { error } = await supabase
      .from("completed_lessons")
      .insert({ user_id: user.id, lesson_id: lesson.id, score: null });
if (error) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
return;
}
    setCompleted(true);
toast({ title: "🎉 Hoàn thành!", description: "Đã đánh dấu hoàn thành bài học." });
};
if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        {" "}
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />{" "}
      </div>
    );
}
  if (!lesson) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        {" "}
        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />{" "}
        <h2 className="text-xl font-semibold">Không tìm thấy bài học</h2>{" "}
        <Button onClick={() => navigate("/learn/lessons")} variant="outline">
          {" "}
          <ArrowLeft className="w-4 h-4 mr-2" /> Về danh sách bài học{" "}
        </Button>{" "}
      </div>
    );
}
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {" "}
      {/* Top bar */}{" "}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {" "}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="-ml-2"
        >
          {" "}
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại{" "}
        </Button>{" "}
        {completed ? (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/30 gap-1 px-3 py-1">
            {" "}
            <CheckCircle2 className="w-4 h-4" /> Đã hoàn thành{" "}
          </Badge>
        ) : (
          <Button size="sm" onClick={handleComplete} className="gap-2">
            {" "}
            <CheckCircle2 className="w-4 h-4" /> Đánh dấu hoàn thành{" "}
          </Button>
        )}{" "}
      </div>{" "}
      {/* Hero */}{" "}
      <Card className="overflow-hidden">
        {" "}
        {lesson.thumbnail_url && (
          <div className="aspect-[21/9] bg-muted overflow-hidden">
            {" "}
            <img
              src={lesson.thumbnail_url}
              alt=""
              className="w-full h-full object-cover"
            />{" "}
          </div>
        )}{" "}
        <CardContent className="p-5 sm:p-7 space-y-4">
          {" "}
          <div className="flex items-center gap-2 flex-wrap">
            {" "}
            {lesson.skill && (
              <Badge className="bg-primary/10 text-primary border-0">
                {lesson.skill}
              </Badge>
            )}{" "}
            {lesson.level && <Badge variant="outline">{lesson.level}</Badge>}{" "}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              {" "}
              <Clock className="w-3.5 h-3.5" />{" "}
              {lesson.duration_minutes || lesson.estimated_minutes || 15}{" "}
              phút{" "}
            </span>{" "}
          </div>{" "}
          <div>
            {" "}
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              {lesson.title_vi || lesson.title}
            </h1>{" "}
            {lesson.title_vi &&
              lesson.title &&
              lesson.title !== lesson.title_vi && (
                <p className="text-muted-foreground mt-1">{lesson.title}</p>
              )}{" "}
            {(lesson.description_vi || lesson.description) && (
              <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
                {" "}
                {lesson.description_vi || lesson.description}{" "}
              </p>
            )}{" "}
          </div>{" "}
          {(lesson.objectives || lesson.prerequisites) && (
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              {" "}
              {lesson.objectives && (
                <div className="rounded-xl border bg-primary/5 p-4">
                  {" "}
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1">
                    {" "}
                    <Target className="w-4 h-4" /> Mục tiêu{" "}
                  </div>{" "}
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {lesson.objectives}
                  </p>{" "}
                </div>
              )}{" "}
              {lesson.prerequisites && (
                <div className="rounded-xl border bg-muted/40 p-4">
                  {" "}
                  <div className="flex items-center gap-2 text-sm font-semibold mb-1">
                    {" "}
                    <Sparkles className="w-4 h-4" /> Cần biết trước{" "}
                  </div>{" "}
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {lesson.prerequisites}
                  </p>{" "}
                </div>
              )}{" "}
            </div>
          )}{" "}
        </CardContent>{" "}
      </Card>{" "}
      {/* Video */}{" "}
      {videoEmbed && (
        <Card>
          {" "}
          <CardContent className="p-3">
            {" "}
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              {" "}
              <iframe
                src={videoEmbed}
                title="Lesson video"
                allow="accelerometer;
autoplay;
clipboard-write;
encrypted-media;
gyroscope;
picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />{" "}
            </div>{" "}
          </CardContent>{" "}
        </Card>
      )}{" "}
      {/* HTML / text content */}{" "}
      {(() => {
        const blocks = (lesson.content && typeof lesson.content === 'object' && Array.isArray((lesson.content as any).blocks))
          ? (lesson.content as any).blocks
          : null;
        if (blocks && isBlockArray(blocks) && blocks.length > 0) {
          return (
            <Card>
              <CardContent className="p-5 sm:p-7">
                <BlockRenderer blocks={blocks} />
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}
      {/* Live Interactive Presentation, Spreadsheet & Document In-Page Viewer */}
      {embeddedLinks.length > 0 && (
        <div className="space-y-6">
          {embeddedLinks.map((url, idx) => {
            const info = getEmbeddableInfo(url);
            return (
              <Card key={idx} className="overflow-hidden border-primary/30 shadow-xl rounded-3xl bg-card">
                {/* Header Bar */}
                <div className="px-5 py-4 bg-gradient-to-r from-muted/90 via-card to-primary/10 border-b flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0 border border-primary/20">
                      {info.type === 'sheet' ? '📊' : info.type === 'slide' ? '📺' : info.type === 'canva' ? '🎨' : '📄'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-base text-foreground tracking-tight">
                          {info.label}
                        </h3>
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs font-bold px-2.5 py-0.5">
                          Trình chiếu trực tiếp trong trang ✨
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-xl mt-0.5">{url}</p>
                    </div>
                  </div>

                  {/* Action controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-bold gap-1.5 bg-background text-primary border-primary/30 rounded-xl"
                      asChild
                    >
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" /> Mở link gốc
                      </a>
                    </Button>

                    {info.type === 'pdf' && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 text-xs font-bold gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs"
                        onClick={() => setPresenter({ url, title: lesson.title_vi || lesson.title })}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Chế độ Presenter Laser
                      </Button>
                    )}
                  </div>
                </div>

                {/* Embedded Responsive Live Iframe Container */}
                <div className="w-full h-[640px] bg-zinc-950/5 relative overflow-hidden">
                  <iframe
                    src={info.embedUrl}
                    className="w-full h-full border-0"
                    title={info.label}
                    allowFullScreen
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* HTML / text content */}
      {(() => {
        const blocks = (lesson.content && typeof lesson.content === 'object' && Array.isArray((lesson.content as any).blocks))
          ? (lesson.content as any).blocks
          : null;
        if (blocks && isBlockArray(blocks) && blocks.length > 0) {
          return (
            <Card>
              <CardContent className="p-5 sm:p-7">
                <BlockRenderer blocks={blocks} />
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}
      {(processedHtml ||
        (lesson.content &&
          typeof lesson.content === "object" &&
          !Array.isArray((lesson.content as any).blocks) &&
          (lesson.content as any).text)) && (
        <Card>
          {" "}
          <CardContent className="p-5 sm:p-7">
            {" "}
            <div
              className="prose prose-sm sm:prose-base dark:prose-invert max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{
                __html:
                  processedHtml || (lesson.content as any).text || "",
              }}
            />{" "}
          </CardContent>{" "}
        </Card>
      )}{" "}
      {/* Materials */}{" "}
      {materials.length > 0 && (
        <Card>
          {" "}
          <CardContent className="p-5 sm:p-6 space-y-3">
            {" "}
            <h2 className="font-semibold flex items-center gap-2">
              {" "}
              <FileText className="w-4 h-4 text-primary" /> Tài liệu bài học{" "}
              <Badge variant="outline" className="ml-1">
                {materials.length}
              </Badge>{" "}
            </h2>{" "}
            <div className="grid gap-2">
              {" "}
              {materials.map((m) => {
                const pdf = isPdf(m);
const video = isVideo(m);
const Icon = pdf ? FileText : video ? Film : FileText;
return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-primary/40 transition-colors"
                  >
                    {" "}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${pdf ? "bg-red-500/10 text-red-600" : video ? "bg-purple-500/10 text-purple-600" : "bg-blue-500/10 text-blue-600"}`}
                    >
                      {" "}
                      <Icon className="w-5 h-5" />{" "}
                    </div>{" "}
                    <div className="flex-1 min-w-0">
                      {" "}
                      <p className="font-medium text-sm truncate">
                        {m.title}
                      </p>{" "}
                      {m.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {m.description}
                        </p>
                      )}{" "}
                    </div>{" "}
                    <div className="flex items-center gap-1 shrink-0">
                      {" "}
                      {pdf && (
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-1.5"
                          onClick={() =>
                            setPresenter({ url: m.file_url, title: m.title })
                          }
                        >
                          {" "}
                          <Presentation className="w-4 h-4" />{" "}
                          <span className="hidden sm:inline">
                            Trình chiếu
                          </span>{" "}
                        </Button>
                      )}{" "}
                      <Button
                        asChild
                        size="icon"
                        variant="ghost"
                        title="Tải xuống"
                      >
                        {" "}
                        <a
                          href={m.file_url}
                          target="_blank"
                          rel="noreferrer"
                          download
                        >
                          {" "}
                          <Download className="w-4 h-4" />{" "}
                        </a>{" "}
                      </Button>{" "}
                    </div>{" "}
                  </div>
                );
})}{" "}
            </div>{" "}
          </CardContent>{" "}
        </Card>
      )}{" "}
      {/* Exercises CTA */}{" "}
      {exerciseCount > 0 && (
        <Card className="bg-gradient-to-br from-primary/5 via-card to-accent/5 border-primary/20">
          {" "}
          <CardContent className="p-5 sm:p-6 flex items-center justify-between gap-4 flex-wrap">
            {" "}
            <div className="flex items-center gap-3">
              {" "}
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                {" "}
                <Dumbbell className="w-5 h-5" />{" "}
              </div>{" "}
              <div>
                {" "}
                <p className="font-semibold">Luyện tập kèm bài học</p>{" "}
                <p className="text-sm text-muted-foreground">
                  {" "}
                  {exerciseCount} bài tập tương tác để củng cố kiến thức.{" "}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <Button asChild size="lg" className="gap-2">
              {" "}
              <Link to={`/learn/exercises?lesson=${lesson.id}`}>
                {" "}
                <Trophy className="w-4 h-4" /> Bắt đầu luyện tập{" "}
              </Link>{" "}
            </Button>{" "}
          </CardContent>{" "}
        </Card>
      )}{" "}
      {/* Footer complete button (sticky-ish) */}{" "}
      {!completed && (
        <div className="flex justify-center pt-4">
          {" "}
          <Button
            size="lg"
            onClick={handleComplete}
            className="gap-2 rounded-full px-8"
          >
            {" "}
            <CheckCircle2 className="w-5 h-5" /> Hoàn thành bài học{" "}
          </Button>{" "}
        </div>
      )}{" "}
      <PdfPresenter
        open={!!presenter}
        onOpenChange={(v) => !v && setPresenter(null)}
        url={presenter?.url || ""}
        title={presenter?.title || ""}
      />{" "}
    </div>
  );
};
export default LessonViewer;

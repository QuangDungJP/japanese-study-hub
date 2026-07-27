import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, Maximize2, Minimize2, X,
  ZoomIn, ZoomOut, LayoutGrid, Loader2, Download, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// pdfjs-dist v6 (ESM). We set the workerSrc to the CDN that mirrors the installed version.
import * as pdfjsLib from "pdfjs-dist";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${(pdfjsLib as any).version}/build/pdf.worker.min.mjs`;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title?: string;
}

const PdfPresenter = ({ open, onOpenChange, url, title }: Props) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [doc, setDoc] = useState<any>(null);
  const storageKey = useMemo(() => (url ? `pdf-presenter:${url}` : ""), [url]);
  const readSaved = useCallback(() => {
    if (typeof window === "undefined" || !storageKey) return null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as { page?: number; zoom?: number }) : null;
    } catch { return null; }
  }, [storageKey]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(() => readSaved()?.zoom ?? 1); // 1 = fit
  const [showThumbs, setShowThumbs] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const hydratedRef = useRef(false);

  // Load the PDF
  useEffect(() => {
    if (!open || !url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    hydratedRef.current = false;
    // Optimistic restore from localStorage (instant) before server reply
    const cached = readSaved();
    setPage(cached?.page && cached.page > 0 ? cached.page : 1);
    if (typeof cached?.zoom === "number") setZoom(cached.zoom);
    // Server-side restore (authoritative, cross-device)
    if (user) {
      (async () => {
        try {
          const { data } = await (supabase as any)
            .from("pdf_presenter_state")
            .select("page, zoom")
            .eq("user_id", user.id)
            .eq("file_url", url)
            .maybeSingle();
          if (cancelled) return;
          if (data) {
            if (typeof data.page === "number" && data.page > 0) setPage(data.page);
            if (typeof data.zoom === "number") setZoom(Number(data.zoom));
          }
        } catch { /* table may not exist yet; localStorage already restored */ }
        finally { if (!cancelled) hydratedRef.current = true; }
      })();
    } else {
      hydratedRef.current = true;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const task = (pdfjsLib as any).getDocument({ url, withCredentials: false });
    task.promise
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((d: any) => {
        if (cancelled) return;
        setDoc(d);
        setTotal(d.numPages);
        // Clamp restored page to actual range
        setPage((p) => Math.min(Math.max(1, p), d.numPages));
        setLoading(false);
      })
      .catch((e: any) => {
        if (cancelled) return;
        console.error("PDF load error", e);
        setError("Không tải được PDF. File có thể bị chặn CORS — hãy thử nút 'Mở tab mới'.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
      try { task.destroy?.(); } catch { /* noop */ }
    };
  }, [open, url, readSaved, user]);

  // Persist page + zoom per file (localStorage instantly, server debounced)
  useEffect(() => {
    if (!storageKey || !doc) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ page, zoom }));
    } catch { /* noop */ }
    if (!user || !hydratedRef.current) return;
    const t = setTimeout(() => {
      (supabase as any)
        .from("pdf_presenter_state")
        .upsert(
          { user_id: user.id, file_url: url, page, zoom, updated_at: new Date().toISOString() },
          { onConflict: "user_id,file_url" },
        )
        .then(() => { /* ignore errors (table may be missing) */ }, () => {});
    }, 600);
    return () => clearTimeout(t);
  }, [storageKey, doc, page, zoom, user, url]);

  // Render the current page sized to its container
  const renderPage = useCallback(async () => {
    if (!doc || !canvasRef.current || !containerRef.current) return;
    try {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch { /* noop */ }
      }
      const p = await doc.getPage(page);
      const container = containerRef.current;
      const baseViewport = p.getViewport({ scale: 1 });
      const padding = 32;
      const availW = container.clientWidth - padding;
      const availH = container.clientHeight - padding;
      const fitScale = Math.min(availW / baseViewport.width, availH / baseViewport.height);
      const scale = Math.max(0.2, fitScale * zoom);
      const viewport = p.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderTaskRef.current = p.render({ canvasContext: ctx, viewport });
      await renderTaskRef.current.promise;
    } catch (e: any) {
      if (e?.name !== "RenderingCancelledException") console.warn(e);
    }
  }, [doc, page, zoom]);

  useEffect(() => { renderPage(); }, [renderPage]);

  // Resize observer for fit-mode rerender
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => { renderPage(); });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [renderPage]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        setPage((p) => Math.min(total, p + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setPage((p) => Math.max(1, p - 1));
      } else if (e.key === "Home") setPage(1);
      else if (e.key === "End") setPage(total);
      else if (e.key.toLowerCase() === "f") toggleFullscreen();
      else if (e.key === "Escape" && isFs) exitFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, total, isFs]);

  // Fullscreen
  const wrapperRef = useRef<HTMLDivElement>(null);
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try { await wrapperRef.current?.requestFullscreen(); } catch { /* noop */ }
    } else {
      exitFullscreen();
    }
  };
  const exitFullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* noop */ }
  };
  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const thumbs = useMemo(() => Array.from({ length: total }, (_, i) => i + 1), [total]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[98vw] w-[98vw] h-[95vh] p-0 overflow-hidden flex flex-col gap-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div ref={wrapperRef} className="flex flex-col h-full bg-background">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-card flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold truncate max-w-[40vw]">{title || "Slide PDF"}</span>
              {total > 0 && (
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
                  {page}/{total}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setShowThumbs((v) => !v)} title="Danh sách slide">
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))} title="Thu nhỏ">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <button
                onClick={() => setZoom(1)}
                className="text-xs font-mono px-2 py-1 rounded hover:bg-muted"
                title="Vừa khung hình"
              >
                {Math.round(zoom * 100)}%
              </button>
              <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.min(4, z + 0.15))} title="Phóng to">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleFullscreen} title="Toàn màn hình (F)">
                {isFs ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button asChild variant="ghost" size="sm" title="Mở tab mới">
                <a href={url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
              </Button>
              <Button asChild variant="ghost" size="sm" title="Tải về">
                <a href={url} download><Download className="w-4 h-4" /></a>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} title="Đóng">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 flex min-h-0">
            {showThumbs && (
              <aside className="w-40 shrink-0 border-r bg-muted/30 overflow-y-auto p-2 space-y-2">
                {thumbs.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={cn(
                      "block w-full text-left rounded-md border px-2 py-3 text-xs transition-all hover:border-primary",
                      page === n ? "border-primary bg-primary/10 font-semibold" : "border-border bg-card"
                    )}
                  >
                    Slide {n}
                  </button>
                ))}
              </aside>
            )}

            <div
              ref={containerRef}
              className="relative flex-1 bg-neutral-900 flex items-center justify-center overflow-auto"
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-white/80 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang tải PDF...
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 gap-3 p-6 text-center">
                  <p>{error}</p>
                  <Button asChild variant="secondary">
                    <a href={url} target="_blank" rel="noreferrer">Mở tab mới</a>
                  </Button>
                </div>
              )}
              <canvas ref={canvasRef} className="shadow-2xl rounded-sm bg-white" />

              {/* Click zones for nav */}
              <button
                aria-label="Slide trước"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                aria-label="Slide kế tiếp"
                onClick={() => setPage((p) => Math.min(total, p + 1))}
                disabled={page >= total}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="px-3 py-1.5 border-t bg-card text-[11px] text-muted-foreground flex items-center justify-between">
            <span>← → để chuyển slide • F: toàn màn hình • Esc: thoát</span>
            <span className="font-mono">{page} / {total}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfPresenter;
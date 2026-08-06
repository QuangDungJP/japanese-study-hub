import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, ExternalLink, Maximize2, Minimize2, Video, ShieldAlert,
  StickyNote, RefreshCw, Copy, CheckCircle2, PanelRightClose, PanelRightOpen,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { normalizeMeetingUrl, openMeetingPopup, isGoogleMeetUrl } from '@/lib/meetingLink';

const MeetingRoom = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const rawUrl = params.get('url') || '';
  const title = params.get('title') || 'Phòng học trực tuyến';
  const url = useMemo(() => normalizeMeetingUrl(rawUrl), [rawUrl]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState('');

  const notesKey = `meeting_notes_${url}`;

  useEffect(() => {
    setNotes(localStorage.getItem(notesKey) || '');
  }, [notesKey]);

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(notesKey, notes), 400);
    return () => clearTimeout(t);
  }, [notes, notesKey]);

  // Google Meet chặn nhúng iframe → hiển thị chế độ cửa sổ ghép ngay
  useEffect(() => {
    setBlocked(isGoogleMeetUrl(url));
  }, [url]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen?.();
      setIsFull(true);
    } else {
      await document.exitFullscreen?.();
      setIsFull(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: 'Đã sao chép link phòng học' });
  };

  if (!url) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <ShieldAlert className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-black">Thiếu link phòng học</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Đường dẫn phòng học không hợp lệ. Vui lòng quay lại lịch học và bấm “Vào lớp” một lần nữa.
        </p>
        <Button onClick={() => navigate(-1)} className="rounded-xl font-bold">Quay lại</Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col bg-slate-950 text-white">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white hover:bg-white/10 rounded-xl gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate leading-tight">{title}</p>
            <p className="text-[11px] text-white/50 truncate font-mono">{url.replace(/^https?:\/\//, '')}</p>
          </div>
        </div>
        <Badge className="hidden sm:flex bg-emerald-500/15 text-emerald-300 border-emerald-400/30 text-[10px] font-bold ml-1">
          All-in-one · Trong website
        </Badge>

        <div className="flex-1" />

        <Button variant="ghost" size="sm" onClick={copyLink} className="text-white hover:bg-white/10 rounded-xl gap-1.5">
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span className="hidden md:inline">Sao chép</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setFrameKey(k => k + 1)} className="text-white hover:bg-white/10 rounded-xl gap-1.5">
          <RefreshCw className="w-4 h-4" /><span className="hidden md:inline">Tải lại</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowPanel(v => !v)} className="text-white hover:bg-white/10 rounded-xl">
          {showPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-white/10 rounded-xl">
          {isFull ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
        <Button
          size="sm"
          onClick={() => openMeetingPopup(url)}
          className="rounded-xl font-bold gap-1.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600"
        >
          <ExternalLink className="w-4 h-4" /> <span className="hidden sm:inline">Mở cửa sổ riêng</span>
        </Button>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <main className="flex-1 relative min-h-[60vh] bg-black">
          {blocked ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-5 p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
              <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Video className="w-10 h-10 text-sky-400" />
              </div>
              <div className="space-y-2 max-w-lg">
                <h2 className="text-2xl font-black">Phòng học Google Meet đã sẵn sàng</h2>
                <p className="text-sm text-white/70 leading-relaxed">
                  Google Meet không cho phép nhúng trực tiếp vì lý do bảo mật. Bấm nút bên dưới để mở
                  phòng họp trong <b>cửa sổ ghép</b> — bạn vẫn ở lại website TNQDO, ghi chú, tài liệu và
                  lớp học vẫn mở song song.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => openMeetingPopup(url)}
                  className="rounded-2xl font-black gap-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600"
                >
                  <Video className="w-5 h-5" /> Vào phòng học ngay
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setBlocked(false)}
                  className="rounded-2xl font-bold gap-2 bg-transparent border-white/20 text-white hover:bg-white/10"
                >
                  Thử nhúng trong trang
                </Button>
              </div>
              <p className="text-[11px] text-white/40">
                Mẹo: bật chế độ “Hình trong hình” của trình duyệt để vừa họp vừa xem bài giảng.
              </p>
            </div>
          ) : (
            <iframe
              key={frameKey}
              src={url}
              title={title}
              className="absolute inset-0 w-full h-full border-0"
              allow="camera; microphone; display-capture; fullscreen; autoplay; clipboard-write"
              allowFullScreen
            />
          )}
        </main>

        {/* Side panel */}
        {showPanel && (
          <aside className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-slate-900/70 backdrop-blur p-4 space-y-4">
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-400" /> Ghi chú buổi học
              </h3>
              <p className="text-[11px] text-white/50">Tự động lưu trên thiết bị của bạn.</p>
            </div>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ghi lại từ vựng, ngữ pháp, bài tập về nhà..."
              className="min-h-[220px] bg-slate-950/60 border-white/10 text-white text-sm rounded-2xl resize-none placeholder:text-white/30"
            />
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2 text-[11px] text-white/70 leading-relaxed">
              <p className="font-bold text-white text-xs">Quy tắc lớp học trực tuyến</p>
              <p>• Vào phòng trước 5 phút, bật camera khi giáo viên yêu cầu.</p>
              <p>• Tắt mic khi không phát biểu để tránh ồn.</p>
              <p>• Ghi chú tại đây sẽ không mất khi bạn chuyển tab.</p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default MeetingRoom;
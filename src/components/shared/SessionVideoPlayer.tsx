import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, ExternalLink, Download, X, Play, RefreshCw, Sparkles } from 'lucide-react';

interface Props {
  videoUrl: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const getEmbeddableVideoUrl = (rawUrl: string): { embedUrl: string; provider: 'gdrive' | 'youtube' | 'vimeo' | 'direct' | 'other'; label: string } => {
  if (!rawUrl) return { embedUrl: '', provider: 'other', label: 'Video' };
  const url = rawUrl.trim();

  // 1. Google Drive Video
  if (url.includes('drive.google.com')) {
    // Extract file ID
    let fileId = '';
    const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fileDMatch) fileId = fileDMatch[1];
    else if (idParamMatch) fileId = idParamMatch[1];

    if (fileId) {
      return {
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        provider: 'gdrive',
        label: 'Google Drive Record Video 📁'
      };
    }
  }

  // 2. YouTube Video
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  if (ytMatch) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
      provider: 'youtube',
      label: 'YouTube Record Video 🔴'
    };
  }

  // 3. Vimeo Video
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      provider: 'vimeo',
      label: 'Vimeo Record Video 🎬'
    };
  }

  // 4. Direct MP4 / WebM / MOV file
  if (/\.(mp4|webm|mov|mkv)($|\?)/i.test(url) || url.startsWith('blob:')) {
    return {
      embedUrl: url,
      provider: 'direct',
      label: 'File Video Trực Tiếp 📹'
    };
  }

  return {
    embedUrl: url,
    provider: 'other',
    label: 'Link Video Buổi Học 🎥'
  };
};

export const SessionVideoPlayer = ({ videoUrl, title, isOpen, onClose }: Props) => {
  if (!videoUrl || !isOpen) return null;

  const { embedUrl, provider, label } = getEmbeddableVideoUrl(videoUrl);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-5xl w-[95vw] h-[85vh] p-0 flex flex-col overflow-hidden bg-background border-2 shadow-2xl rounded-3xl">
        {/* Header Bar */}
        <DialogHeader className="px-5 py-3.5 border-b bg-gradient-to-r from-muted/90 via-card to-primary/10 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold shrink-0 border border-purple-500/20">
              <Video className="w-5 h-5 text-purple-600 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base font-extrabold text-foreground truncate">
                  {title || 'Video Ghi Hình Record Buổi Học'}
                </DialogTitle>
                <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 text-xs font-bold px-2.5 py-0.5">
                  {label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-lg mt-0.5">{videoUrl}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-1.5 border-primary/30 text-primary" asChild>
              <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" /> Mở tab gốc
              </a>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Video Player Container with seeking & full screen controls */}
        <div className="flex-1 w-full bg-zinc-950 flex items-center justify-center relative overflow-hidden">
          {provider === 'direct' ? (
            <video
              src={embedUrl}
              controls
              autoPlay
              className="w-full h-full max-h-[75vh] object-contain"
            >
              Trình duyệt của bạn không hỗ trợ phát thẻ video HTML5.
            </video>
          ) : (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0 min-h-[500px]"
              title={title || 'Record Video Buổi học'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 border-t bg-muted/40 text-xs text-muted-foreground flex justify-between items-center shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            ✨ Hỗ trợ tính năng tua video, chuyển tốc độ & toàn màn hình đầy đủ trong giao diện website.
          </span>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7 text-xs font-bold">
            Đóng Player
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionVideoPlayer;

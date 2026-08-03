import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, 
  Music2, Disc, ListMusic, X, Sparkles, Radio, GripHorizontal, RotateCcw
} from 'lucide-react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  cover_image: string | null;
  audio_url: string;
  duration_seconds: number;
  is_free: boolean;
  price_xp: number;
  associated_item_code?: string | null;
}

export const BackgroundMusicPlayer = () => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize visible to true by default if music is enabled in localStorage
  const [visible, setVisible] = useState<boolean>(() => {
    return localStorage.getItem('bg_music_enabled') !== 'false';
  });
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

  // Draggable position state (YouTube Premium style)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('bg_music_player_pos');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const hasMovedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only left click or single touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const currentX = pos?.x ?? (window.innerWidth / 2 - 100);
    const currentY = pos?.y ?? (window.innerHeight - 80);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currentX,
      posY: currentY,
    };
    hasMovedRef.current = false;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedRef.current = true;
    }

    let newX = dragStartRef.current.posX + dx;
    let newY = dragStartRef.current.posY + dy;

    // Clamp within viewport bounds
    newX = Math.max(12, Math.min(window.innerWidth - 180, newX));
    newY = Math.max(12, Math.min(window.innerHeight - 70, newY));

    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    if (pos) {
      localStorage.setItem('bg_music_player_pos', JSON.stringify(pos));
    }
  };

  const resetPos = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPos(null);
    localStorage.removeItem('bg_music_player_pos');
  };

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const { data: allTracks } = await (supabase as any)
          .from('music_tracks')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!allTracks || allTracks.length === 0) return;

        let unlockedCodes = new Set<string>();
        if (user) {
          const { data: inv } = await (supabase as any)
            .from('user_inventory')
            .select('item_code')
            .eq('user_id', user.id);
          if (inv) unlockedCodes = new Set((inv as any[]).map((i: any) => i.item_code));
        }

        const available = (allTracks as Track[]).filter(t => {
          if (t.is_free) return true;
          if (t.associated_item_code && unlockedCodes.has(t.associated_item_code)) return true;
          return false;
        });

        setTracks(available.length > 0 ? available : (allTracks as Track[]));
      } catch (err) {
        console.error('Error fetching bg music tracks:', err);
      }
    };
    fetchMusic();

    // Refresh when admin updates tracks (cover image, title, audio...)
    const onMusicUpdated = () => fetchMusic();
    window.addEventListener('music_updated', onMusicUpdated);

    const channel = (supabase as any)
      .channel(`music-tracks-rt-${Math.random().toString(36).slice(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'music_tracks' }, () => fetchMusic())
      .subscribe();

    return () => {
      window.removeEventListener('music_updated', onMusicUpdated);
      (supabase as any).removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const handlePlayTrackEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Track>;
      const newTrack = customEvent.detail;
      if (!newTrack || !newTrack.audio_url) return;

      setVisible(true);
      setIsMinimized(false);

      setTracks(prev => {
        const existingIdx = prev.findIndex(t => t.audio_url === newTrack.audio_url || (newTrack.id && t.id === newTrack.id));
        if (existingIdx !== -1) {
          setCurrentTrackIndex(existingIdx);
          // always take the freshest metadata (cover image, title, artist)
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...newTrack };
          return updated;
        } else {
          const updated = [newTrack, ...prev];
          setCurrentTrackIndex(0);
          return updated;
        }
      });

      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = newTrack.audio_url;
        audioRef.current.play().catch(err => console.warn('Audio playback error:', err));
      }
    };

    const handleToggleEvent = () => {
      const enabled = localStorage.getItem('bg_music_enabled') !== 'false';
      if (enabled) {
        setVisible(true);
        setIsMinimized(false);
      } else {
        setVisible(false);
        setIsPlaying(false);
        audioRef.current?.pause();
      }
    };

    window.addEventListener('play_bg_track', handlePlayTrackEvent);
    window.addEventListener('bg_music_toggle', handleToggleEvent);
    return () => {
      window.removeEventListener('play_bg_track', handlePlayTrackEvent);
      window.removeEventListener('bg_music_toggle', handleToggleEvent);
    };
  }, []);

  const currentTrack = tracks[currentTrackIndex] || null;

  // Bust the browser cache when admin replaces a cover image at the same URL
  const coverSrc = (track: Track | null) => {
    if (!track?.cover_image) return null;
    const version = (track as any).updated_at || (track as any).created_at;
    if (!version) return track.cover_image;
    const stamp = encodeURIComponent(String(version));
    return track.cover_image.includes('?') ? `${track.cover_image}&v=${stamp}` : `${track.cover_image}?v=${stamp}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => console.warn('Audio play blocked:', err));
    }
  };

  const playNext = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex(prev => (prev + 1) % tracks.length);
    setIsPlaying(true);
  };

  const playPrev = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex(prev => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && audioRef.current && currentTrack) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrackIndex]);

  // If component is not enabled, do not render
  if (!visible && tracks.length === 0) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack?.audio_url}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={playNext}
        style={{ display: 'none' }}
      />

      {/* Floating Trigger Button (Draggable YouTube Premium style) */}
      {(isMinimized || !visible) && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={
            pos
              ? { left: `${pos.x}px`, top: `${pos.y}px` }
              : { left: '50%', transform: 'translateX(-50%)', bottom: '24px' }
          }
          className={`fixed z-[999] touch-none select-none ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'}`}
        >
          <div
            onClick={(e) => {
              if (hasMovedRef.current) return;
              setVisible(true);
              setIsMinimized(false);
            }}
            title="Kéo thả vị trí tùy ý hoặc nhấp để mở Nhạc Học Tập"
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-2xl hover:scale-105 transition-transform duration-200 ring-4 ring-amber-400/30 border border-amber-300/40"
          >
            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
              <GripHorizontal className="w-3.5 h-3.5 text-yellow-100" />
            </div>

            <div className="relative">
              <Music2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce text-yellow-200' : ''}`} />
              {isPlaying && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                </span>
              )}
            </div>
            <span className="text-xs font-black tracking-wide hidden sm:inline">
              {isPlaying ? 'Đang phát Lo-Fi' : 'Nhạc Học Tập'}
            </span>
            <Radio className="w-3.5 h-3.5 text-yellow-200 animate-pulse" />

            {pos && (
              <button
                onClick={resetPos}
                title="Đặt lại vị trí giữa màn hình"
                className="ml-1 p-0.5 rounded-full bg-black/20 hover:bg-black/40 text-yellow-100 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Full Music Player Popup Bar */}
      {visible && !isMinimized && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] max-w-2xl w-[94vw] sm:w-[680px] transition-all duration-300 animate-in fade-in slide-in-from-bottom-6"
        >
          <div className="relative bg-card/95 backdrop-blur-2xl border-2 border-amber-500/40 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.3)] overflow-hidden">
            {/* Cover artwork backdrop */}
            {currentTrack?.cover_image && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-25 blur-xl scale-110 pointer-events-none transition-all duration-700"
                style={{ backgroundImage: `url(${coverSrc(currentTrack)})` }}
              />
            )}

            {/* Background Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 pointer-events-none" />

            {/* Top Progress Line */}
            <div
              className="absolute top-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-300"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            />

            <div className="relative z-10 flex items-center gap-3 p-3.5 sm:p-4">
              {/* Disc / Cover Image */}
              <div className="relative shrink-0">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-md bg-muted flex items-center justify-center ${isPlaying ? 'ring-4 ring-amber-400/30' : ''}`}>
                  {currentTrack?.cover_image ? (
                    <img
                      key={coverSrc(currentTrack) || ''}
                      src={coverSrc(currentTrack) || ''}
                      alt={currentTrack.title}
                      className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'brightness-75'}`}
                    />
                  ) : (
                    <Disc
                      className={`w-6 h-6 text-amber-500 ${isPlaying ? 'animate-spin' : ''}`}
                      style={{ animationDuration: '4s' }}
                    />
                  )}
                </div>
              </div>

              {/* Title & Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[9px] bg-amber-500/15 text-amber-600 border-amber-400/30 font-bold px-1.5 py-0">
                    Lo-Fi Hub
                  </Badge>
                  {isPlaying && (
                    <span className="flex items-center gap-0.5">
                      <span className="w-1 h-3 bg-amber-500 rounded-full animate-pulse" />
                      <span className="w-1 h-4 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                      <span className="w-1 h-2 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                    </span>
                  )}
                </div>
                <p className="font-extrabold text-xs sm:text-sm truncate text-foreground mt-0.5">
                  {currentTrack?.title || 'Chưa chọn bài nhạc'}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate font-medium">
                  {currentTrack?.artist || 'TNQDO Studio'}
                </p>
              </div>

              {/* Center Controls & Scrubber */}
              <div className="hidden sm:flex flex-col items-center gap-1.5 flex-shrink-0 w-48">
                <div className="flex items-center gap-2">
                  <button onClick={playPrev} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                  <button onClick={playNext} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-full flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                  <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={1}
                    onValueChange={val => { if (audioRef.current) audioRef.current.currentTime = val[0]; }}
                    className="flex-1 h-1"
                  />
                  <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>

              {/* Mobile Play Button */}
              <div className="flex sm:hidden items-center">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md active:scale-95"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
              </div>

              {/* Right Utility Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <div className="hidden md:flex items-center gap-1.5 mr-1">
                  <button onClick={() => setIsMuted(!isMuted)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.05}
                    onValueChange={val => setVolume(val[0])}
                    className="w-14 h-1"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-xl"
                  onClick={() => setIsPlaylistOpen(true)}
                  title="Danh sách bài nhạc"
                >
                  <ListMusic className="w-4 h-4" />
                </Button>

                <button
                  onClick={() => setIsMinimized(true)}
                  title="Thu nhỏ trình phát"
                  className="h-8 w-8 flex items-center justify-center rounded-xl bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  <X className="w-4 h-4 font-bold" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Selector Modal */}
      <Dialog open={isPlaylistOpen} onOpenChange={setIsPlaylistOpen}>
        <DialogContent className="max-w-sm sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ListMusic className="w-5 h-5 text-amber-500" />
              Danh sách Nhạc Lo-Fi ({tracks.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto py-1 pr-1">
            {tracks.map((t, idx) => {
              const isSelected = idx === currentTrackIndex;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                    setIsPlaylistOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400/50 text-amber-600 dark:text-amber-400 font-bold shadow-sm'
                      : 'hover:bg-muted border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted shrink-0 flex items-center justify-center border">
                    {t.cover_image ? (
                      <img src={coverSrc(t) || ''} alt={t.title} className="w-full h-full object-cover" />
                    ) : (
                      <Disc className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs truncate">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t.artist}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.is_free ? (
                      <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-1.5">
                        Miễn phí
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20 px-1.5">
                        Đã mở
                      </Badge>
                    )}
                    {isSelected && isPlaying && <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BackgroundMusicPlayer;

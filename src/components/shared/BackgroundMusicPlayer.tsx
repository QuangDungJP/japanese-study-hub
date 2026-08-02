import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, 
  Music2, Disc, ListMusic, X, Music
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

  const [visible, setVisible] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  // True after user has opened the player at least once (to show mini-button)
  const [hasBeenOpened, setHasBeenOpened] = useState(false);

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
          if (inv) unlockedCodes = new Set(inv.map((i: any) => i.item_code));
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
  }, [user]);

  useEffect(() => {
    const handlePlayTrackEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Track>;
      const newTrack = customEvent.detail;
      if (!newTrack || !newTrack.audio_url) return;

      setClosing(false);
      setVisible(true);
      setHasBeenOpened(true);

      setTracks(prev => {
        const existingIdx = prev.findIndex(t => t.audio_url === newTrack.audio_url);
        if (existingIdx !== -1) {
          setCurrentTrackIndex(existingIdx);
          return prev;
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
      const enabled = localStorage.getItem('bg_music_enabled') === 'true';
      if (enabled) {
        setClosing(false);
        setVisible(true);
        setHasBeenOpened(true);
        // Auto-play first track when toggled on
        setTracks(prev => {
          if (prev.length > 0 && audioRef.current) {
            setCurrentTrackIndex(0);
            setIsPlaying(true);
            audioRef.current.src = prev[0].audio_url;
            audioRef.current.play().catch(err => console.warn('Audio playback error:', err));
          }
          return prev;
        });
      } else {
        handleClose();
      }
    };

    window.addEventListener('play_bg_track', handlePlayTrackEvent);
    window.addEventListener('bg_music_toggle', handleToggleEvent);
    return () => {
        window.removeEventListener('play_bg_track', handlePlayTrackEvent);
        window.removeEventListener('bg_music_toggle', handleToggleEvent);
    };
  }, [visible]);

  const currentTrack = tracks[currentTrackIndex] || null;

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

  const handleClose = () => {
    setClosing(true);
    setIsPlaying(false);
    audioRef.current?.pause();
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 350);
  };

  // Show mini floating button only when player was previously opened and now hidden
  if (!visible) return hasBeenOpened && tracks.length > 0 ? (
    <button
      onClick={() => { setVisible(true); setClosing(false); }}
      title="Mở lại trình phát nhạc"
      className="fixed bottom-4 right-4 z-[100] w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-110 transition-transform ring-2 ring-primary/30"
    >
      <Music2 className="w-5 h-5" />
    </button>
  ) : null;

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

      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] max-w-2xl w-[94vw] sm:w-[680px] transition-all duration-350 ${
          closing ? 'opacity-0 translate-y-6 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
        style={{ animation: visible && !closing ? 'slideUp 0.35s cubic-bezier(.21,1.02,.73,1) both' : undefined }}
      >
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(32px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>

        <div className="relative bg-card/95 backdrop-blur-2xl border border-primary/30 rounded-2xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-amber-400/8 to-rose-500/8 pointer-events-none" />
          <div className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-primary via-amber-400 to-rose-400 transition-all duration-300"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }} />

          <div className="relative z-10 flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5">
            <div className="relative shrink-0">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-border shadow-lg bg-muted flex items-center justify-center ${isPlaying ? 'ring-2 ring-primary/50 ring-offset-1' : ''}`}>
                {currentTrack?.cover_image
                  ? <img src={currentTrack.cover_image} alt={currentTrack.title} className={`w-full h-full object-cover transition-all ${isPlaying ? 'brightness-110' : 'brightness-75'}`} />
                  : <Disc className={`w-5 h-5 text-primary ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                }
              </div>
              {isPlaying && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs sm:text-sm truncate text-foreground flex items-center gap-1.5">
                <Music2 className="w-3 h-3 text-primary shrink-0 animate-pulse" />
                {currentTrack?.title || 'No Track'}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{currentTrack?.artist || 'Unknown'}</p>
            </div>

            <div className="hidden sm:flex flex-col items-center gap-1 flex-shrink-0 w-44">
              <div className="flex items-center gap-2">
                <button onClick={playPrev} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                </button>
                <button onClick={playNext} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="w-full flex items-center gap-1.5 text-[9px] text-muted-foreground font-mono">
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

            <div className="flex sm:hidden items-center">
              <button onClick={togglePlay} className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <div className="hidden md:flex items-center gap-1">
                <button onClick={() => setIsMuted(!isMuted)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
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
                className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                onClick={() => setIsPlaylistOpen(true)}
              >
                <ListMusic className="w-3.5 h-3.5" />
              </Button>

              <button
                onClick={handleClose}
                className="group relative h-8 w-8 flex items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/30 transition-all duration-200 hover:scale-105"
              >
                <X className="w-3.5 h-3.5 font-bold" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isPlaylistOpen} onOpenChange={setIsPlaylistOpen}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ListMusic className="w-4 h-4 text-amber-500" />
              Danh sách Nhạc ({tracks.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 max-h-72 overflow-y-auto py-1">
            {tracks.map((t, idx) => {
              const isSelected = idx === currentTrackIndex;
              return (
                <div
                  key={t.id}
                  onClick={() => { setCurrentTrackIndex(idx); setIsPlaying(true); setIsPlaylistOpen(false); }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected ? 'bg-primary/10 border-primary/40 text-primary font-bold' : 'hover:bg-muted border-transparent'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                    {t.cover_image
                      ? <img src={t.cover_image} alt={t.title} className="w-full h-full object-cover" />
                      : <Disc className="w-4 h-4 text-primary" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs truncate">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t.artist}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.is_free
                      ? <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-1.5">Miễn phí</Badge>
                      : <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20 px-1.5">Đã mở</Badge>
                    }
                    {isSelected && isPlaying && <Music2 className="w-3.5 h-3.5 text-primary animate-bounce" />}
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

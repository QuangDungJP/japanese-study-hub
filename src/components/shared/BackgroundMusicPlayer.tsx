import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, 
  Music, Music2, Disc, Repeat, ListMusic, Sparkles, X, ChevronUp, ChevronDown
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

  const [enabled, setEnabled] = useState<boolean>(() => {
    return localStorage.getItem('bg_music_enabled') !== 'false';
  });

  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

  // Listen for storage / custom event changes for bg_music_enabled toggle in Profile
  useEffect(() => {
    const handleSettingChange = () => {
      const isEn = localStorage.getItem('bg_music_enabled') !== 'false';
      setEnabled(isEn);
      if (!isEn && isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener('storage', handleSettingChange);
    window.addEventListener('bg_music_toggle', handleSettingChange);
    return () => {
      window.removeEventListener('storage', handleSettingChange);
      window.removeEventListener('bg_music_toggle', handleSettingChange);
    };
  }, [isPlaying]);

  // Fetch available music tracks
  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const { data: allTracks } = await supabase
          .from('music_tracks')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (!allTracks || allTracks.length === 0) return;

        // Fetch user's unlocked inventory items
        let unlockedCodes = new Set<string>();
        if (user) {
          const { data: inv } = await supabase
            .from('user_inventory')
            .select('item_code')
            .eq('user_id', user.id);
          if (inv) unlockedCodes = new Set(inv.map(i => i.item_code));
        }

        // Filter: keep free tracks OR tracks user purchased
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

  const currentTrack = tracks[currentTrackIndex] || null;

  // Handle Play/Pause
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
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIdx);
    setIsPlaying(true);
  };

  const playPrev = () => {
    if (tracks.length === 0) return;
    const prevIdx = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrackIndex(prevIdx);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrackIndex]);

  if (!enabled || !currentTrack) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack.audio_url}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={playNext}
      />

      {/* Floating Spotify/ZingMP3 Bar at bottom center */}
      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 max-w-2xl w-[92vw] sm:w-full ${
        isMinimized ? 'translate-y-2' : ''
      }`}>
        <div className="bg-card/90 backdrop-blur-xl border-2 border-primary/30 rounded-2xl shadow-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 relative overflow-hidden group">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-amber-500/10 to-rose-500/10 pointer-events-none opacity-50" />

          {/* Left: Album Cover & Track Title */}
          <div className="flex items-center gap-3 min-w-0 z-10">
            <div className="relative shrink-0">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-border shadow-md bg-muted flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : ''}`}>
                {currentTrack.cover_image ? (
                  <img src={currentTrack.cover_image} alt={currentTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <Disc className="w-6 h-6 text-primary" />
                )}
              </div>
              {isPlaying && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="font-bold text-xs sm:text-sm truncate text-foreground flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
                {currentTrack.title}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Center: Controls & Progress */}
          {!isMinimized && (
            <div className="hidden sm:flex flex-col items-center justify-center flex-1 max-w-xs px-2 z-10 space-y-1">
              <div className="flex items-center gap-2">
                <button onClick={playPrev} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <button onClick={playNext} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Slider */}
              <div className="w-full flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={(val) => {
                    if (audioRef.current) audioRef.current.currentTime = val[0];
                  }}
                  className="flex-1 h-1"
                />
                <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
          )}

          {/* Mobile Play Button */}
          <div className="flex sm:hidden items-center gap-1 z-10">
            <button onClick={togglePlay} className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
          </div>

          {/* Right: Volume & Playlist Drawer Toggle */}
          <div className="flex items-center gap-1.5 z-10 shrink-0">
            <div className="hidden md:flex items-center gap-1.5">
              <button onClick={() => setIsMuted(!isMuted)} className="text-muted-foreground hover:text-foreground p-1">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.05}
                onValueChange={(val) => setVolume(val[0])}
                className="w-16 h-1"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsPlaylistOpen(true)}
              title="Danh sách phát"
            >
              <ListMusic className="w-4 h-4 text-amber-500" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Playlist Drawer Modal */}
      <Dialog open={isPlaylistOpen} onOpenChange={setIsPlaylistOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ListMusic className="w-5 h-5 text-amber-500" />
              Danh sách Nhạc Học Tập Lo-Fi ({tracks.length})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-80 overflow-y-auto py-2">
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
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected ? 'bg-primary/10 border-primary text-primary font-bold' : 'hover:bg-muted border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                      {t.cover_image ? (
                        <img src={t.cover_image} alt={t.title} className="w-full h-full object-cover" />
                      ) : (
                        <Disc className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs truncate">{t.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{t.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {t.is_free ? (
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Miễn phí</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">Đã mở khóa</Badge>
                    )}
                    {isSelected && isPlaying && <Music2 className="w-4 h-4 text-primary animate-bounce" />}
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

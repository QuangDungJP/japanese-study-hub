import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Image as ImageIcon, Music, Search, Upload, Check, Loader2, RefreshCw, FileText } from 'lucide-react';

interface MediaFile {
  name: string;
  url: string;
  size?: number;
  created_at?: string;
  type: 'image' | 'audio' | 'other';
}

interface MediaLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUrl: (url: string) => void;
  fileType?: 'image' | 'audio' | 'all';
}

export default function MediaLibraryDialog({
  open,
  onOpenChange,
  onSelectUrl,
  fileType = 'all',
}: MediaLibraryDialogProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMediaFiles = async () => {
    setLoading(true);
    try {
      // List files from Supabase Storage bucket 'lesson-assets'
      const { data, error } = await supabase.storage.from('lesson-assets').list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (error) throw error;

      const mediaList: MediaFile[] = (data || [])
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => {
          const { data: { publicUrl } } = supabase.storage.from('lesson-assets').getPublicUrl(f.name);
          const nameLower = f.name.toLowerCase();
          let type: 'image' | 'audio' | 'other' = 'other';
          if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.webp') || nameLower.endsWith('.svg')) {
            type = 'image';
          } else if (nameLower.endsWith('.mp3') || nameLower.endsWith('.wav') || nameLower.endsWith('.ogg') || nameLower.endsWith('.m4a')) {
            type = 'audio';
          }
          return {
            name: f.name,
            url: publicUrl,
            size: f.metadata?.size,
            created_at: f.created_at,
            type,
          };
        });

      setFiles(mediaList);
    } catch (err: any) {
      console.error('Error fetching media files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchMediaFiles();
  }, [open]);

  const handleUploadNewFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

      const { error: upErr } = await supabase.storage.from('lesson-assets').upload(fileName, file);
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('lesson-assets').getPublicUrl(fileName);

      toast({ title: '✅ Đã tải lên file thành công' });
      onSelectUrl(publicUrl);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Lỗi tải file', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = fileType === 'all' || f.type === fileType || f.type === 'other';
    return matchesSearch && matchesType;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <ImageIcon className="w-5 h-5 text-primary" />
            Thư Viện Media Supabase (Media Asset Library)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Chọn từ các file ảnh/audio đã có trên hệ thống hoặc tải file mới từ máy tính của bạn
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2 border-b">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm file media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={fetchMediaFiles} className="h-9 text-xs gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Làm mới
            </Button>
            <input
              type="file"
              accept={fileType === 'image' ? 'image/*' : fileType === 'audio' ? 'audio/*' : '*/*'}
              className="hidden"
              id="media-dialog-file-input"
              onChange={handleUploadNewFile}
            />
            <Button
              size="sm"
              disabled={uploading}
              onClick={() => document.getElementById('media-dialog-file-input')?.click()}
              className="h-9 text-xs gap-1 bg-primary font-bold"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload file từ máy
            </Button>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto min-h-[300px] py-3">
          {loading ? (
            <div className="flex justify-center items-center h-48 text-xs text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải kho media...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-16 text-xs text-muted-foreground">
              Không tìm thấy file media nào trong thư viện.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredFiles.map((file, i) => (
                <div
                  key={i}
                  onClick={() => {
                    onSelectUrl(file.url);
                    onOpenChange(false);
                  }}
                  className="group rounded-xl border-2 hover:border-primary p-2 bg-card cursor-pointer transition-all duration-200 flex flex-col justify-between hover:shadow-md relative overflow-hidden"
                >
                  <div className="aspect-square rounded-lg bg-muted overflow-hidden mb-2 flex items-center justify-center relative">
                    {file.type === 'image' ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : file.type === 'audio' ? (
                      <div className="flex flex-col items-center justify-center text-amber-500">
                        <Music className="w-8 h-8 mb-1" />
                        <span className="text-[10px] font-mono font-bold uppercase">Audio MP3</span>
                      </div>
                    ) : (
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    )}

                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                      <Check className="w-4 h-4" /> Chọn
                    </div>
                  </div>

                  <p className="font-semibold text-[11px] truncate text-foreground leading-tight" title={file.name}>
                    {file.name.split('/').pop()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

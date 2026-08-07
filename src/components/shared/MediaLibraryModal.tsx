import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Image, Film, FileText, Music, Check, Upload, FolderOpen, RefreshCw, ExternalLink, Link2, HardDrive, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document' | 'audio';
  bucket?: string;
  size?: number;
  created_at?: string;
  isExternal?: boolean;
}

interface MediaLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  filterType?: 'image' | 'video' | 'document' | 'audio' | 'all';
  title?: string;
}

export const MediaLibraryModal = ({
  open,
  onOpenChange,
  onSelect,
  filterType = 'all',
  title = 'Khu Vực Quản Lý Media & Thư Viện Tệp',
}: MediaLibraryModalProps) => {
  const { toast } = useToast();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>(filterType);
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [customLinkInput, setCustomLinkInput] = useState('');
  const [totalStorageBytes, setTotalStorageBytes] = useState(0);

  useEffect(() => {
    if (open) {
      fetchMediaAssets();
    }
  }, [open]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const fetchMediaAssets = async () => {
    setLoading(true);
    let calculatedBytes = 0;
    try {
      const assetMap = new Map<string, MediaAsset>();
      const buckets = ['lesson-assets', 'course-media', 'lesson-audio', 'avatars', 'event-media'];

      // 1. Fetch from Supabase Storage buckets
      for (const bucket of buckets) {
        try {
          const { data: files } = await supabase.storage.from(bucket).list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
          if (files) {
            files.forEach((f) => {
              if (!f.name || f.name.startsWith('.')) return;
              const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(f.name);
              const ext = f.name.split('.').pop()?.toLowerCase() || '';

              let type: 'image' | 'video' | 'document' | 'audio' = 'document';
              if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) type = 'image';
              else if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) type = 'video';
              else if (['mp3', 'wav', 'aac', 'flac'].includes(ext)) type = 'audio';

              const fileSize = f.metadata?.size || 0;
              calculatedBytes += fileSize;

              assetMap.set(publicUrl, {
                id: `${bucket}-${f.id || f.name}`,
                name: f.name,
                url: publicUrl,
                type,
                bucket,
                size: fileSize,
                created_at: f.created_at,
                isExternal: false,
              });
            });
          }
        } catch {
          // ignore bucket list errors
        }
      }

      // 2. Fetch URLs from lessons, lesson_materials, courses, events, popups
      const sb: any = supabase;
      const [{ data: lessons }, { data: materials }, { data: courses }, { data: events }] = await Promise.all([
        sb.from('lessons').select('thumbnail_url, video_url, slide_url, document_url, title_vi').order('created_at', { ascending: false }).limit(50),
        sb.from('lesson_materials').select('file_url, title, file_type').order('created_at', { ascending: false }).limit(50),
        sb.from('courses').select('thumbnail_url, title_vi').order('created_at', { ascending: false }).limit(50),
        sb.from('events').select('thumbnail_url, title_vi').order('created_at', { ascending: false }).limit(50),
      ]);

      (lessons || []).forEach((l: any) => {
        [l.thumbnail_url, l.video_url, l.slide_url, l.document_url].forEach((url) => {
          if (url && typeof url === 'string' && url.startsWith('http') && !assetMap.has(url)) {
            const isDrive = url.includes('drive.google.com') || url.includes('docs.google.com');
            const isImg = url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || url.includes('unsplash.com');
            const isVid = url.match(/\.(mp4|webm|mov)/i) || url.includes('youtube.com');
            assetMap.set(url, {
              id: `lesson-${url}`,
              name: l.title_vi ? `${l.title_vi} (${isDrive ? 'Google Drive' : 'Link'})` : 'Tài liệu bài học',
              url,
              type: isImg ? 'image' : isVid ? 'video' : 'document',
              isExternal: true,
            });
          }
        });
      });

      (materials || []).forEach((m: any) => {
        if (m.file_url && typeof m.file_url === 'string' && m.file_url.startsWith('http') && !assetMap.has(m.file_url)) {
          const isImg = m.file_url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i);
          assetMap.set(m.file_url, {
            id: `material-${m.file_url}`,
            name: m.title || 'Tệp đính kèm',
            url: m.file_url,
            type: isImg ? 'image' : 'document',
            isExternal: true,
          });
        }
      });

      (courses || []).forEach((c: any) => {
        if (c.thumbnail_url && !assetMap.has(c.thumbnail_url)) {
          assetMap.set(c.thumbnail_url, {
            id: `course-${c.thumbnail_url}`,
            name: c.title_vi || 'Ảnh khóa học',
            url: c.thumbnail_url,
            type: 'image',
            isExternal: true,
          });
        }
      });

      (events || []).forEach((e: any) => {
        if (e.thumbnail_url && !assetMap.has(e.thumbnail_url)) {
          assetMap.set(e.thumbnail_url, {
            id: `event-${e.thumbnail_url}`,
            name: e.title_vi || 'Ảnh sự kiện',
            url: e.thumbnail_url,
            type: 'image',
            isExternal: true,
          });
        }
      });

      setTotalStorageBytes(calculatedBytes);
      setAssets(Array.from(assetMap.values()));
    } catch (err: any) {
      console.error('Error fetching media library:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `media-lib/${Date.now()}-${Math.random().toString(36).substr(2, 7)}.${fileExt}`;
      const { error } = await supabase.storage.from('lesson-assets').upload(fileName, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('lesson-assets').getPublicUrl(fileName);

      toast({ title: '✅ Upload thành công', description: `Đã lưu ${file.name} (${formatFileSize(file.size)}) vào khu media` });
      setSelectedUrl(publicUrl);
      fetchMediaAssets();
    } catch (err: any) {
      toast({ title: 'Lỗi upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleAddCustomLink = () => {
    if (!customLinkInput.trim()) {
      toast({ title: '⚠️ Chưa nhập đường dẫn', description: 'Vui lòng dán liên kết Drive/URL ảnh!', variant: 'destructive' });
      return;
    }
    const cleanUrl = customLinkInput.trim();
    onSelect(cleanUrl);
    toast({ title: '✅ Đã áp dụng liên kết', description: 'Đã gán link thành công!' });
    onOpenChange(false);
  };

  const filteredAssets = assets.filter((asset) => {
    if (selectedType !== 'all' && asset.type !== selectedType) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return asset.name.toLowerCase().includes(q) || asset.url.toLowerCase().includes(q);
  });

  const handleConfirmSelect = (targetUrl?: string) => {
    const finalUrl = targetUrl || selectedUrl;
    if (!finalUrl) {
      toast({ title: 'Chưa chọn tệp', description: 'Vui lòng chọn 1 tệp trong danh sách hoặc dán link ở trên!' });
      return;
    }
    onSelect(finalUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[88vh] p-0 flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-border">
        {/* Modal Header */}
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between shrink-0 bg-gradient-to-r from-card to-muted/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                {title}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                  <HardDrive className="w-3.5 h-3.5" /> Dung lượng đã dùng: {formatFileSize(totalStorageBytes) || 'Đang tính...'}
                </span>
                <span className="mx-1">•</span>
                <span>{assets.length} tệp đã lưu</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input type="file" onChange={handleQuickUpload} disabled={uploading} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" />
              <Button size="sm" variant="default" className="h-9 text-xs font-bold rounded-xl shadow-sm" disabled={uploading}>
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                {uploading ? 'Đang upload...' : 'Upload tệp mới'}
              </Button>
            </label>
            <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl" onClick={fetchMediaAssets} title="Làm mới thư viện">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>

        {/* Tab & Link Input Area */}
        <div className="px-4 py-2.5 bg-card border-b flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 absolute left-3 top-2.5 text-primary" />
              <Input
                value={customLinkInput}
                onChange={(e) => setCustomLinkInput(e.target.value)}
                placeholder="Dán đường dẫn Google Drive / Link Ảnh / Nguồn bên ngoài (Vd: https://drive.google.com/...)..."
                className="pl-9 h-9 text-xs font-medium rounded-xl border-primary/30 focus-visible:ring-primary"
              />
            </div>
            <Button size="sm" onClick={handleAddCustomLink} className="h-9 text-xs font-bold rounded-xl px-4 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white">
              Gán Link
            </Button>
          </div>
        </div>

        {/* Toolbar Filter & Search */}
        <div className="p-3 border-b bg-muted/20 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tệp theo tên hoặc đường dẫn..."
              className="pl-9 h-9 text-xs font-medium rounded-lg"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Tất cả', icon: FolderOpen },
              { id: 'image', label: 'Hình ảnh', icon: Image },
              { id: 'video', label: 'Video', icon: Film },
              { id: 'document', label: 'Tài liệu', icon: FileText },
              { id: 'audio', label: 'Âm thanh', icon: Music },
            ].map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={selectedType === cat.id ? 'default' : 'outline'}
                onClick={() => setSelectedType(cat.id)}
                className="h-8 text-xs px-2.5 rounded-lg"
              >
                <cat.icon className="w-3.5 h-3.5 mr-1" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Assets Grid Gallery */}
        <div className="flex-1 p-4 overflow-y-auto bg-muted/10">
          {loading ? (
            <div className="h-full flex items-center justify-center text-center text-muted-foreground space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-xs">Đang đồng bộ và tính toán bộ nhớ khu media...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <FolderOpen className="w-12 h-12 mb-2 text-muted-foreground/50" />
              <p className="font-bold text-sm">Chưa tìm thấy tệp nào</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Thử chọn loại khác hoặc dùng ô dán link Google Drive / Upload tệp ở trên.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredAssets.map((asset) => {
                const isSelected = selectedUrl === asset.url;
                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedUrl(asset.url)}
                    onDoubleClick={() => handleConfirmSelect(asset.url)}
                    className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all bg-card ${
                      isSelected
                        ? 'border-primary ring-4 ring-primary/20 shadow-md scale-[1.02]'
                        : 'border-border hover:border-primary/50 hover:shadow-sm'
                    }`}
                  >
                    {/* Aspect Ratio Box */}
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
                      {asset.type === 'image' ? (
                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : asset.type === 'video' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white p-2">
                          <Film className="w-8 h-8 text-indigo-400" />
                          <span className="text-[10px] mt-1 line-clamp-1 opacity-80">Video</span>
                        </div>
                      ) : asset.type === 'audio' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-amber-950/20 text-amber-600 p-2">
                          <Music className="w-8 h-8" />
                          <span className="text-[10px] mt-1 line-clamp-1 opacity-80">Audio</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-950/20 text-blue-600 p-2">
                          <FileText className="w-8 h-8" />
                          <span className="text-[10px] mt-1 line-clamp-1 opacity-80">Tài liệu</span>
                        </div>
                      )}

                      {/* Selected Overlay Checkmark */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/30 flex items-center justify-center backdrop-blur-[1px]">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg animate-in zoom-in-50">
                            <Check className="w-5 h-5 stroke-[3]" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Info */}
                    <div className="p-2 bg-card">
                      <p className="text-[11px] font-bold text-foreground line-clamp-1 tracking-tight" title={asset.name}>
                        {asset.name}
                      </p>
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 font-bold">
                          {asset.size ? formatFileSize(asset.size) : asset.isExternal ? 'Nguồn Ngoài' : asset.type}
                        </Badge>
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary p-0.5"
                          title="Mở đường dẫn gốc"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t bg-card flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            {selectedUrl ? (
              <p className="text-xs text-muted-foreground truncate">
                Đã chọn: <span className="font-bold text-foreground truncate">{selectedUrl}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Nhấp vào một tệp/ảnh để chọn tái sử dụng (tránh upload trùng lặp)</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
              Hủy
            </Button>
            <Button onClick={() => handleConfirmSelect()} disabled={!selectedUrl} className="font-bold px-5 rounded-xl">
              <Check className="w-4 h-4 mr-1.5" />
              Sử dụng tệp này
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaLibraryModal;

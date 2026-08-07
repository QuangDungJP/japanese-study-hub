import { useState, useRef } from 'react';
import { Upload, X, Image, Film, Loader2, Check, AlertCircle, FileText, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { MediaLibraryModal } from './MediaLibraryModal';

interface MediaUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  accept?: 'image' | 'video' | 'document' | 'both' | 'any';
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
  placeholder?: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'banner' | 'auto';
  showLibraryBtn?: boolean;
}

const MediaUploader = ({
  value,
  onChange,
  accept = 'both',
  bucket = 'lesson-assets',
  folder = '',
  maxSizeMB = 50,
  placeholder = 'Kéo thả file hoặc click để upload',
  className,
  aspectRatio = 'auto',
  showLibraryBtn = true,
}: MediaUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const acceptTypes = {
    image: 'image/*',
    video: 'video/*',
    document: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt',
    both: 'image/*,video/*',
    any: 'image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt',
  };

  const isVideo = value?.match(/\.(mp4|webm|ogg|mov)$/i);
  const isImage = value?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
  const isDoc = value?.match(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|zip|txt)$/i);

  const handleFile = async (file: File) => {
    setError(null);

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      const errMsg = `⚠️ Tệp "${file.name}" vượt dung lượng (${sizeMB.toFixed(1)}MB > ${maxSizeMB}MB). Vui lòng nén file hoặc chia sẻ link Google Drive!`;
      setError(errMsg);
      toast({
        title: '⚠️ Tệp quá dung lượng cho phép',
        description: `Tệp ${sizeMB.toFixed(1)}MB lớn hơn giới hạn ${maxSizeMB}MB. Hãy nén file PDF hoặc tải lên Google Drive rồi dán link!`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast({
        title: 'Upload thành công',
        description: `Đã tải lên ${file.name}`,
      });
    } catch (err: any) {
      setError(err.message || 'Lỗi upload');
      toast({
        title: 'Lỗi upload',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = async () => {
    if (value) {
      try {
        const url = new URL(value);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(p => p === bucket);
        if (bucketIndex !== -1) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          await supabase.storage.from(bucket).remove([filePath]);
        }
      } catch (e) {
        // ignore if external url
      }
    }
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const aspectRatioClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    banner: 'aspect-[3/1]',
    auto: 'min-h-[140px]',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {value ? (
        <div className={cn(
          'relative border border-border rounded-xl overflow-hidden bg-muted/50 p-2',
          aspectRatioClass[aspectRatio]
        )}>
          {isVideo ? (
            <video
              src={value}
              controls
              className="w-full h-full object-contain max-h-[180px]"
            />
          ) : isImage ? (
            <img
              src={value}
              alt="Uploaded media"
              className="w-full h-full object-contain max-h-[180px]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center space-y-2">
              <FileText className="w-8 h-8 text-primary" />
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline break-all">
                {value.split('/').pop() || 'Xem tài liệu đính kèm'}
              </a>
            </div>
          )}

          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-full shadow-lg h-7 w-7"
            onClick={handleRemove}
          >
            <X className="w-3.5 h-3.5" />
          </Button>

          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-foreground border shadow-sm">
            <Check className="w-3 h-3 text-green-500" />
            Đã tải lên
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative rounded-xl border-2 border-dashed transition-all cursor-pointer p-4',
            'flex flex-col items-center justify-center gap-2',
            aspectRatioClass[aspectRatio],
            dragActive
              ? 'border-primary bg-primary/5'
              : error
              ? 'border-destructive bg-destructive/5'
              : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Đang upload file...</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {accept === 'image' && <Image className="w-6 h-6 text-muted-foreground" />}
                {accept === 'video' && <Film className="w-6 h-6 text-muted-foreground" />}
                {accept === 'document' && <FileText className="w-6 h-6 text-primary" />}
                {(accept === 'both' || accept === 'any') && (
                  <>
                    <Image className="w-5 h-5 text-muted-foreground" />
                    <Film className="w-5 h-5 text-muted-foreground" />
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </>
                )}
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-xs font-bold text-foreground">{placeholder}</p>
                <p className="text-[11px] text-muted-foreground">
                  {accept === 'image' && 'JPG, PNG, GIF, WebP'}
                  {accept === 'video' && 'MP4, WebM, MOV'}
                  {accept === 'document' && 'PDF, DOC, DOCX, PPTX, ZIP'}
                  {(accept === 'both' || accept === 'any') && 'Hình ảnh, Video, PDF hoặc DOC'}
                  {' • '}Tối đa {maxSizeMB}MB
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap justify-center" onClick={(e) => e.stopPropagation()}>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-3 rounded-lg" onClick={() => inputRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  Upload file mới
                </Button>
                {showLibraryBtn && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs px-3 bg-primary/10 text-primary hover:bg-primary/20 font-bold border border-primary/20 rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLibraryOpen(true);
                    }}
                  >
                    <FolderOpen className="w-3.5 h-3.5 mr-1 text-primary" />
                    Khu Media / Gán Link Drive
                  </Button>
                )}
              </div>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={acceptTypes[accept]}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      {/* Reusable Asset Media Library Modal */}
      {libraryOpen && (
        <MediaLibraryModal
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          filterType={accept === 'image' ? 'image' : accept === 'video' ? 'video' : accept === 'document' ? 'document' : 'all'}
          onSelect={(selectedUrl) => {
            onChange(selectedUrl);
            toast({ title: '✅ Đã chọn tệp từ thư viện', description: 'Tái sử dụng tệp thành công!' });
          }}
        />
      )}
    </div>
  );
};

export default MediaUploader;

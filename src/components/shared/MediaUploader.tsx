import { useState, useRef } from 'react';
import { Upload, X, Image, Film, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MediaUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  accept?: 'image' | 'video' | 'both';
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
  placeholder?: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'banner' | 'auto';
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
}: MediaUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const acceptTypes = {
    image: 'image/*',
    video: 'video/*',
    both: 'image/*,video/*',
  };

  const isVideo = value?.match(/\.(mp4|webm|ogg|mov)$/i);
  const isImage = value?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

  const handleFile = async (file: File) => {
    setError(null);

    // Validate file type
    const isValidImage = file.type.startsWith('image/');
    const isValidVideo = file.type.startsWith('video/');

    if (accept === 'image' && !isValidImage) {
      setError('Chỉ chấp nhận file hình ảnh');
      return;
    }
    if (accept === 'video' && !isValidVideo) {
      setError('Chỉ chấp nhận file video');
      return;
    }
    if (accept === 'both' && !isValidImage && !isValidVideo) {
      setError('File không hợp lệ');
      return;
    }

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`File quá lớn (tối đa ${maxSizeMB}MB)`);
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
      // Extract file path from URL
      const url = new URL(value);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex(p => p === bucket);
      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/');
        await supabase.storage.from(bucket).remove([filePath]);
      }
    }
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const aspectRatioClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    banner: 'aspect-[3/1]',
    auto: 'min-h-[180px]',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {value ? (
        <div className={cn(
          'relative border border-border overflow-hidden bg-muted/50',
          aspectRatioClass[aspectRatio]
        )}>
          {isVideo ? (
            <video
              src={value}
              controls
              className="w-full h-full object-contain"
            />
          ) : isImage ? (
            <img
              src={value}
              alt="Uploaded media"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Xem file đã upload
              </a>
            </div>
          )}

          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-full shadow-lg"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-muted-foreground">
            <Check className="w-3 h-3 text-green-500" />
            Đã upload
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative rounded-xl border-2 border-dashed transition-all cursor-pointer',
            'flex flex-col items-center justify-center gap-3 p-6',
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
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Đang upload...</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {accept === 'image' ? (
                  <Image className="w-8 h-8 text-muted-foreground" />
                ) : accept === 'video' ? (
                  <Film className="w-8 h-8 text-muted-foreground" />
                ) : (
                  <>
                    <Image className="w-6 h-6 text-muted-foreground" />
                    <Film className="w-6 h-6 text-muted-foreground" />
                  </>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{placeholder}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {accept === 'image' && 'JPG, PNG, GIF, WebP'}
                  {accept === 'video' && 'MP4, WebM, MOV'}
                  {accept === 'both' && 'Hình ảnh hoặc Video'}
                  {' • '}Tối đa {maxSizeMB}MB
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2">
                <Upload className="w-4 h-4 mr-2" />
                Chọn file
              </Button>
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
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;

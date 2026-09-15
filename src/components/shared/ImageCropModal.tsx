import { useState, useCallback, useEffect } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCw, Loader2, RotateCcw, Maximize, CheckCircle2 } from 'lucide-react';
import { Star } from 'lucide-react';

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (blob: Blob) => void;
  aspect?: number;
  title?: string;
  isAvatar?: boolean;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(data, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/jpeg', 0.95);
  });
}

const ImageCropModal = ({
  open, onClose, imageSrc, onCropComplete, aspect = 4 / 3, title = 'Chỉnh sửa ảnh', isAvatar = false
}: ImageCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  // Generate live preview when user stops interacting
  useEffect(() => {
    if (!croppedAreaPixels || !imageSrc || !open) return;
    
    const generatePreview = async () => {
      setGeneratingPreview(true);
      try {
        const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (e) {
        // Ignore preview errors
      } finally {
        setGeneratingPreview(false);
      }
    };
    
    const timeout = setTimeout(generatePreview, 300); // Debounce
    return () => clearTimeout(timeout);
  }, [croppedAreaPixels, imageSrc, rotation, open]);

  const onCropChange = useCallback((_: unknown, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(blob);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={`w-[95vw] p-0 gap-0 overflow-hidden bg-background rounded-3xl shadow-2xl border-none ${isAvatar ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <DialogHeader className="p-6 pb-4 bg-background">
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Sử dụng thanh trượt để thu phóng và xoay ảnh. Khung sáng (crop box) cố định ở giữa màn hình. Bạn hãy click vào ảnh để kéo di chuyển vị trí mong muốn.
          </p>
        </DialogHeader>

        <div className={`flex flex-col ${isAvatar ? 'lg:flex-row' : ''} border-y border-border`}>
          {/* Cột cắt ảnh */}
          <div className="flex-1 flex flex-col border-r border-border min-w-[50%]">
            <div className="relative w-full h-[50vh] sm:h-[55vh] bg-neutral-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropChange}
                cropShape={isAvatar ? 'rect' : (aspect === 1 ? 'round' : 'rect')}
                showGrid
                style={{
                  containerStyle: { background: '#171717' },
                  cropAreaStyle: { border: '2px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 0 0 9999em rgba(0, 0, 0, 0.6)' }
                }}
              />
            </div>
            
            <div className="p-6 bg-background space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-1.5"><ZoomIn className="w-4 h-4 text-primary" /> Thu phóng</span>
                    <span className="text-xs text-muted-foreground font-mono">{Math.round(zoom * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0 cursor-pointer hover:text-foreground" onClick={() => setZoom(Math.max(1, zoom - 0.1))} />
                    <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={([v]) => setZoom(v)} className="flex-1" />
                    <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0 cursor-pointer hover:text-foreground" onClick={() => setZoom(Math.min(3, zoom + 0.1))} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-1.5"><RotateCw className="w-4 h-4 text-primary" /> Xoay</span>
                    <span className="text-xs text-muted-foreground font-mono">{rotation}°</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <RotateCcw className="w-4 h-4 text-muted-foreground shrink-0 cursor-pointer hover:text-foreground" onClick={() => setRotation(rotation - 1)} />
                    <Slider value={[rotation]} min={0} max={360} step={1} onValueChange={([v]) => setRotation(v)} className="flex-1" />
                    <RotateCw className="w-4 h-4 text-muted-foreground shrink-0 cursor-pointer hover:text-foreground" onClick={() => setRotation(rotation + 1)} />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setRotation((prev) => (prev - 90 + 360) % 360)}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> -90°
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setRotation((prev) => (prev + 90) % 360)}>
                  <RotateCw className="w-3.5 h-3.5 mr-1" /> +90°
                </Button>
                <div className="flex-1" />
                <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
                  <Maximize className="w-3.5 h-3.5 mr-1" /> Mặc định
                </Button>
              </div>
            </div>
          </div>

          {/* Cột Live Preview (Chỉ hiện khi isAvatar = true) */}
          {isAvatar && (
            <div className="hidden lg:flex flex-col w-[380px] bg-muted/30 relative">
              <div className="p-6 border-b border-border bg-background/50">
                <h3 className="font-bold flex items-center gap-2">
                  Live Preview <span className="text-xs font-normal text-muted-foreground">(Trang Giáo Viên)</span>
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center space-y-8 bg-dot-pattern">
                {/* Mockup Teacher Card */}
                <div className="w-full max-w-[280px] bg-card rounded-2xl overflow-hidden border border-border shadow-xl">
                  <div className="aspect-[4/3] bg-gradient-to-br from-japanese/20 to-primary/20 flex items-center justify-center relative">
                    {generatingPreview ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" />
                    ) : previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover object-top" />
                    ) : null}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-japanese font-medium mb-0.5">Giảng viên Demo</p>
                    <h3 className="font-bold text-foreground">Nguyễn Văn A Sensei</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="text-sm font-semibold">5.0</span>
                    </div>
                  </div>
                </div>

                {/* Mockup Teacher Detail Avatar */}
                <div className="w-full space-y-3">
                  <p className="text-xs text-muted-foreground text-center font-medium">Trang Chi tiết giảng viên</p>
                  <div className="w-full max-w-[280px] mx-auto rounded-3xl overflow-hidden border-4 border-background shadow-2xl relative">
                    <div className="aspect-[4/3] bg-muted relative">
                      {generatingPreview ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" />
                        </div>
                      ) : previewUrl ? (
                        <img src={previewUrl} alt="Preview Detail" className="w-full h-full object-cover object-top" />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-0 mt-0 bg-background sm:justify-between items-center border-none lg:mt-6">
          <Button variant="ghost" onClick={onClose} className="hidden sm:inline-flex">Đóng</Button>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto sm:hidden">Hủy</Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto font-bold shadow-md h-11 px-8 text-base">
              {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
              Xác nhận & Lưu ảnh
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropModal;


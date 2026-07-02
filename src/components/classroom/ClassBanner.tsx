import { Copy, Check, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  cls: any;
  isTeacher?: boolean;
  onUpdated?: () => void;
}

const ClassBanner = ({ cls, isTeacher, onUpdated }: Props) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const color = cls?.color || '#4f46e5';

  const copyCode = () => {
    if (!cls?.join_code) return;
    navigator.clipboard.writeText(cls.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    toast({ title: 'Đã sao chép mã lớp' });
  };

  const uploadBanner = async (file: File) => {
    if (!cls?.id) return;
    setUploading(true);
    try {
      const path = `class-banners/${cls.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('website-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('website-assets').getPublicUrl(path);
      const { error: uerr } = await (supabase as any).from('classes').update({ banner_url: data.publicUrl }).eq('id', cls.id);
      if (uerr) throw uerr;
      toast({ title: 'Đã cập nhật banner' });
      onUpdated?.();
    } catch (e: any) {
      toast({ title: 'Lỗi tải ảnh', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl border shadow-elegant"
      style={{
        background: cls?.banner_url
          ? `linear-gradient(120deg, ${color}cc, ${color}66), url(${cls.banner_url}) center/cover`
          : `linear-gradient(120deg, ${color}, ${color}aa 40%, ${color}55)`,
      }}
    >
      {/* pattern */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)', backgroundSize: '40px 40px, 60px 60px' }} />

      <div className="relative p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-4 min-h-[200px] md:min-h-[240px]">
        <div className="flex-1 text-white drop-shadow">
          <p className="text-xs uppercase tracking-widest opacity-80 mb-2">Lớp học</p>
          <h1 className="text-3xl md:text-5xl font-black leading-tight">{cls?.name_vi || cls?.name}</h1>
          {cls?.description_vi && <p className="mt-2 text-sm md:text-base opacity-90 line-clamp-2 max-w-2xl">{cls.description_vi}</p>}
        </div>
        <div className="flex items-center gap-2">
          {cls?.join_code && (
            <button onClick={copyCode} className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 backdrop-blur text-foreground shadow hover:shadow-lg transition-all">
              <span className="text-xs uppercase text-muted-foreground">Mã lớp</span>
              <span className="font-mono font-bold tracking-wider">{cls.join_code}</span>
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 opacity-60 group-hover:opacity-100" />}
            </button>
          )}
          {isTeacher && (
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadBanner(e.target.files[0])} />
              <Button variant="secondary" size="sm" asChild disabled={uploading}>
                <span><ImageIcon className="w-4 h-4 mr-1" />{uploading ? 'Đang tải…' : 'Đổi ảnh'}</span>
              </Button>
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassBanner;
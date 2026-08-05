import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Layout, Sparkles, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export interface BannerStyle {
  height?: 'sm' | 'md' | 'lg' | 'full';
  align?: 'left' | 'center' | 'right';
  vertical?: 'top' | 'center' | 'bottom';
  overlay?: number;              // 0 - 100
  overlay_color?: string;        // hex
  overlay_direction?: 'none' | 'to-top' | 'to-right' | 'radial';
  focus?: string;                // object-position, e.g. "50% 50%"
  blur?: number;                 // px
  zoom?: number;                 // scale %, 100 - 150
  content_width?: 'narrow' | 'medium' | 'wide' | 'full';
  text_tone?: 'light' | 'dark';
  show_badge?: boolean;
  rounded?: boolean;
  kenburns?: boolean;
}

export const DEFAULT_BANNER_STYLE: Required<BannerStyle> = {
  height: 'md',
  align: 'left',
  vertical: 'center',
  overlay: 55,
  overlay_color: '#000000',
  overlay_direction: 'to-top',
  focus: '50% 50%',
  blur: 0,
  zoom: 100,
  content_width: 'medium',
  text_tone: 'light',
  show_badge: true,
  rounded: false,
  kenburns: false,
};

export const resolveBannerStyle = (raw: any): Required<BannerStyle> => ({
  ...DEFAULT_BANNER_STYLE,
  ...(raw && typeof raw === 'object' ? raw : {}),
});

export const BANNER_HEIGHT_CLASS: Record<string, string> = {
  sm: 'min-h-[380px] md:min-h-[420px]',
  md: 'min-h-[500px] md:min-h-[620px]',
  lg: 'min-h-[620px] md:min-h-[760px]',
  full: 'min-h-[100svh]',
};

export const BANNER_WIDTH_CLASS: Record<string, string> = {
  narrow: 'max-w-xl',
  medium: 'max-w-3xl',
  wide: 'max-w-5xl',
  full: 'max-w-none w-full',
};

const hexToRgba = (hex: string, alpha: number) => {
  const clean = (hex || '#000000').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full || '000000', 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

export const bannerOverlayStyle = (s: Required<BannerStyle>) => {
  const a = Math.max(0, Math.min(100, s.overlay)) / 100;
  const c = s.overlay_color || '#000000';
  switch (s.overlay_direction) {
    case 'none':
      return { background: hexToRgba(c, a) };
    case 'to-right':
      return { background: `linear-gradient(to right, ${hexToRgba(c, a)}, ${hexToRgba(c, a * 0.15)})` };
    case 'radial':
      return { background: `radial-gradient(ellipse at center, ${hexToRgba(c, a * 0.25)}, ${hexToRgba(c, a)})` };
    default:
      return { background: `linear-gradient(to top, ${hexToRgba(c, Math.min(1, a * 1.5))}, ${hexToRgba(c, a)}, ${hexToRgba(c, a * 0.4)})` };
  }
};

const OptionRow = ({
  label,
  hint,
  options,
  value,
  onSelect,
}: {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
}) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold">{label}</Label>
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onSelect(o.value)}
          className={cn(
            "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all",
            value === o.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted text-muted-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
    {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
  </div>
);

interface Props {
  value: any;
  onChange: (style: BannerStyle) => void;
  imageUrl?: string | null;
  title?: string;
}

const FOCUS_GRID = [
  ['0% 0%', '50% 0%', '100% 0%'],
  ['0% 50%', '50% 50%', '100% 50%'],
  ['0% 100%', '50% 100%', '100% 100%'],
];

const BannerStyleEditor = ({ value, onChange, imageUrl, title }: Props) => {
  const s = resolveBannerStyle(value);
  const set = (patch: Partial<BannerStyle>) => onChange({ ...s, ...patch });

  return (
    <div className="rounded-2xl border bg-background overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
        <Layout className="w-4 h-4 text-primary" />
        <div>
          <p className="text-sm font-bold">Layout trang bìa (nâng cao)</p>
          <p className="text-[11px] text-muted-foreground">Chiều cao, căn chữ, lớp phủ, tâm ảnh, hiệu ứng — xem trước ngay bên dưới</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Controls */}
        <div className="p-4 space-y-4 border-b lg:border-b-0 lg:border-r">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <OptionRow
              label="Chiều cao banner"
              value={s.height}
              onSelect={(v) => set({ height: v as any })}
              options={[
                { value: 'sm', label: 'Thấp' },
                { value: 'md', label: 'Vừa' },
                { value: 'lg', label: 'Cao' },
                { value: 'full', label: 'Full màn hình' },
              ]}
            />
            <OptionRow
              label="Độ rộng khối nội dung"
              value={s.content_width}
              onSelect={(v) => set({ content_width: v as any })}
              options={[
                { value: 'narrow', label: 'Hẹp' },
                { value: 'medium', label: 'Vừa' },
                { value: 'wide', label: 'Rộng' },
                { value: 'full', label: 'Tràn' },
              ]}
            />
            <OptionRow
              label="Căn chữ ngang"
              value={s.align}
              onSelect={(v) => set({ align: v as any })}
              options={[
                { value: 'left', label: 'Trái' },
                { value: 'center', label: 'Giữa' },
                { value: 'right', label: 'Phải' },
              ]}
            />
            <OptionRow
              label="Căn chữ dọc"
              value={s.vertical}
              onSelect={(v) => set({ vertical: v as any })}
              options={[
                { value: 'top', label: 'Trên' },
                { value: 'center', label: 'Giữa' },
                { value: 'bottom', label: 'Dưới' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t">
            <div className="space-y-2 pt-3">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Độ đậm lớp phủ</span>
                <span className="font-mono text-primary">{s.overlay}%</span>
              </Label>
              <Slider value={[s.overlay]} min={0} max={100} step={5} onValueChange={([v]) => set({ overlay: v })} />
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={s.overlay_color}
                  onChange={(e) => set({ overlay_color: e.target.value })}
                  className="h-8 w-14 p-1 cursor-pointer"
                />
                <span className="text-[11px] text-muted-foreground">Màu lớp phủ</span>
              </div>
            </div>
            <div className="pt-3">
              <OptionRow
                label="Kiểu lớp phủ"
                value={s.overlay_direction}
                onSelect={(v) => set({ overlay_direction: v as any })}
                options={[
                  { value: 'to-top', label: 'Mờ dần lên' },
                  { value: 'to-right', label: 'Mờ dần sang phải' },
                  { value: 'radial', label: 'Vignette' },
                  { value: 'none', label: 'Phủ đều' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tâm ảnh (điểm lấy nét khi cắt)</Label>
              <div className="grid grid-cols-3 gap-1 w-fit">
                {FOCUS_GRID.flat().map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => set({ focus: f })}
                    className={cn(
                      "w-8 h-8 rounded-md border transition-all",
                      s.focus === f ? "border-primary bg-primary/20" : "border-border hover:bg-muted"
                    )}
                  />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">{s.focus}</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Làm mờ ảnh nền</span>
                  <span className="font-mono text-primary">{s.blur}px</span>
                </Label>
                <Slider value={[s.blur]} min={0} max={20} step={1} onValueChange={([v]) => set({ blur: v })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Phóng to ảnh</span>
                  <span className="font-mono text-primary">{s.zoom}%</span>
                </Label>
                <Slider value={[s.zoom]} min={100} max={150} step={5} onValueChange={([v]) => set({ zoom: v })} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t">
            <div className="flex items-center justify-between rounded-lg border p-2.5">
              <Label className="text-xs font-semibold">Chữ sáng trên nền tối</Label>
              <Switch checked={s.text_tone === 'light'} onCheckedChange={(c) => set({ text_tone: c ? 'light' : 'dark' })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-2.5">
              <Label className="text-xs font-semibold">Hiện nhãn badge phụ đề</Label>
              <Switch checked={s.show_badge} onCheckedChange={(c) => set({ show_badge: c })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-2.5">
              <Label className="text-xs font-semibold">Bo góc banner</Label>
              <Switch checked={s.rounded} onCheckedChange={(c) => set({ rounded: c })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-2.5">
              <Label className="text-xs font-semibold">Hiệu ứng Ken Burns</Label>
              <Switch checked={s.kenburns} onCheckedChange={(c) => set({ kenburns: c })} />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="p-4 space-y-2 bg-muted/20">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Xem trước
          </Label>
          <div
            className={cn(
              "relative w-full h-48 overflow-hidden border bg-slate-900",
              s.rounded ? "rounded-2xl" : "rounded-md"
            )}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: s.focus, filter: s.blur ? `blur(${s.blur}px)` : undefined, transform: `scale(${s.zoom / 100})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-slate-800" />
            )}
            <div className="absolute inset-0" style={bannerOverlayStyle(s)} />
            <div
              className={cn(
                "absolute inset-0 flex flex-col p-4 gap-1.5",
                s.vertical === 'top' ? 'justify-start' : s.vertical === 'bottom' ? 'justify-end' : 'justify-center',
                s.align === 'center' ? 'items-center text-center' : s.align === 'right' ? 'items-end text-right' : 'items-start text-left',
                s.text_tone === 'light' ? 'text-white' : 'text-slate-900'
              )}
            >
              {s.show_badge && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/25 backdrop-blur-sm">BADGE</span>
              )}
              <p className="text-sm font-black leading-tight line-clamp-2">{title || 'Tiêu đề banner của bạn'}</p>
              <p className="text-[10px] opacity-80 line-clamp-2">Đoạn mô tả ngắn hiển thị dưới tiêu đề.</p>
              <div className={cn("flex gap-1.5 mt-1", s.align === 'center' && 'justify-center')}>
                <span className="text-[9px] font-bold px-2 py-1 rounded bg-primary text-primary-foreground">Nút chính</span>
                <span className="text-[9px] font-bold px-2 py-1 rounded bg-white/20 backdrop-blur-sm">Nút phụ</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Preview mô phỏng tương đối. Chiều cao thực tế: <b>{s.height === 'full' ? '100% màn hình' : s.height === 'lg' ? '620–760px' : s.height === 'sm' ? '380–420px' : '500–620px'}</b>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BannerStyleEditor;
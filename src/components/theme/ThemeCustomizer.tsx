import { useTheme, ThemeColor, ThemeMode, ThemeFont, ThemeScale } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, Sun, Moon, Monitor, Palette, Type, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';

const themeColorOptions: { value: ThemeColor; label: string; color: string }[] = [
  { value: 'blue', label: 'Xanh dương', color: 'bg-blue-600' },
  { value: 'green', label: 'Xanh lá', color: 'bg-green-600' },
  { value: 'purple', label: 'Tím', color: 'bg-purple-600' },
  { value: 'orange', label: 'Cam', color: 'bg-orange-500' },
  { value: 'rose', label: 'Hồng', color: 'bg-rose-500' },
  { value: 'teal', label: 'Xanh ngọc', color: 'bg-teal-500' },
];

const themeModeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Sáng', icon: <Sun className="w-4 h-4" /> },
  { value: 'dark', label: 'Tối', icon: <Moon className="w-4 h-4" /> },
  { value: 'system', label: 'Hệ thống', icon: <Monitor className="w-4 h-4" /> },
];

const fontOptions: { value: ThemeFont; label: string; sample: string }[] = [
  { value: 'system', label: 'Hệ thống', sample: 'Aa' },
  { value: 'inter', label: 'Inter', sample: 'Aa' },
  { value: 'noto-sans', label: 'Noto Sans', sample: 'Aa' },
  { value: 'roboto', label: 'Roboto', sample: 'Aa' },
  { value: 'merriweather', label: 'Merriweather', sample: 'Aa' },
  { value: 'source-code', label: 'Source Code', sample: '</>' },
];

const fontFamilyMap: Record<ThemeFont, string> = {
  system: 'inherit',
  inter: '"Inter", sans-serif',
  'noto-sans': '"Noto Sans", sans-serif',
  roboto: '"Roboto", sans-serif',
  merriweather: '"Merriweather", serif',
  'source-code': '"Source Code Pro", monospace',
};

const scaleOptions: { value: ThemeScale; label: string; desc: string }[] = [
  { value: 'compact', label: 'Nhỏ gọn', desc: '14px' },
  { value: 'medium', label: 'Tiêu chuẩn', desc: '16px' },
  { value: 'large', label: 'Lớn', desc: '18px' },
];

interface ThemeCustomizerProps {
  compact?: boolean;
}

const ThemeCustomizer = ({ compact = false }: ThemeCustomizerProps) => {
  const { themeColor, themeMode, themeFont, themeScale, setThemeColor, setThemeMode, setThemeFont, setThemeScale } = useTheme();

  if (compact) {
    return (
      <div className="space-y-5">
        {/* Color */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Màu giao diện</Label>
          <div className="flex flex-wrap gap-2">
            {themeColorOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setThemeColor(option.value)}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                  option.color,
                  themeColor === option.value
                    ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                    : 'hover:scale-105'
                )}
                title={option.label}
              >
                {themeColor === option.value && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Chế độ</Label>
          <div className="flex gap-2">
            {themeModeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setThemeMode(option.value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                  themeMode === option.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                )}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Font chữ</Label>
          <div className="grid grid-cols-3 gap-2">
            {fontOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setThemeFont(option.value)}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all border',
                  themeFont === option.value
                    ? 'bg-primary/10 border-primary text-foreground'
                    : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                )}
              >
                <span className="text-base" style={{ fontFamily: fontFamilyMap[option.value] }}>{option.sample}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scale */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Kích thước</Label>
          <div className="flex gap-2">
            {scaleOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setThemeScale(option.value)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                  themeScale === option.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                )}
              >
                <span>{option.label}</span>
                <span className="text-xs opacity-70">{option.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Tùy chỉnh giao diện
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Theme Color */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-4 block">
            Chọn màu chủ đạo
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {themeColorOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setThemeColor(option.value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  themeColor === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', option.color)}>
                  {themeColor === option.value && <Check className="w-5 h-5 text-white" />}
                </div>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme Mode */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-4 block">
            Chế độ hiển thị
          </Label>
          <RadioGroup
            value={themeMode}
            onValueChange={(v) => setThemeMode(v as ThemeMode)}
            className="grid grid-cols-3 gap-3"
          >
            {themeModeOptions.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  themeMode === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <RadioGroupItem value={option.value} className="sr-only" />
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  themeMode === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {option.icon}
                </div>
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Font */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <Type className="w-4 h-4" />
            Font chữ
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {fontOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setThemeFont(option.value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  themeFont === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <span
                  className="text-2xl font-semibold text-foreground"
                  style={{ fontFamily: fontFamilyMap[option.value] }}
                >
                  {option.sample}
                </span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scale */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <Maximize className="w-4 h-4" />
            Kích thước giao diện
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {scaleOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setThemeScale(option.value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  themeScale === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  themeScale === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  <span className="font-bold text-xs">{option.desc}</span>
                </div>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Thay đổi kích thước cơ sở của toàn bộ giao diện. Phù hợp cho màn hình lớn hoặc người dùng cần chữ to hơn.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeCustomizer;

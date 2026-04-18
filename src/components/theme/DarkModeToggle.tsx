import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const DarkModeToggle = ({ variant = 'default' }: { variant?: 'default' | 'compact' }) => {
  const { themeMode, setThemeMode, resolvedMode } = useTheme();

  const getIcon = () => {
    switch (themeMode) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Sáng';
      case 'dark':
        return 'Tối';
      default:
        return 'Hệ thống';
    }
  };

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          const nextMode = themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
          setThemeMode(nextMode);
        }}
        className="relative overflow-hidden group"
        title={`Chế độ: ${getLabel()}`}
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          <Sun className={cn(
            "absolute transition-all duration-300",
            themeMode === 'light' 
              ? "opacity-100 scale-100 rotate-0" 
              : "opacity-0 scale-50 rotate-90"
          )} />
          <Moon className={cn(
            "absolute transition-all duration-300",
            themeMode === 'dark' 
              ? "opacity-100 scale-100 rotate-0" 
              : "opacity-0 scale-50 -rotate-90"
          )} />
          <Monitor className={cn(
            "absolute transition-all duration-300",
            themeMode === 'system' 
              ? "opacity-100 scale-100" 
              : "opacity-0 scale-50"
          )} />
        </div>
        <span className="sr-only">Chuyển đổi chế độ tối</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative overflow-hidden group"
          title={`Chế độ: ${getLabel()}`}
        >
          <div className="relative w-4 h-4 flex items-center justify-center">
            <Sun className={cn(
              "absolute transition-all duration-300 text-yellow-500",
              themeMode === 'light' 
                ? "opacity-100 scale-100 rotate-0" 
                : "opacity-0 scale-50 rotate-90"
            )} />
            <Moon className={cn(
              "absolute transition-all duration-300 text-blue-400",
              themeMode === 'dark' 
                ? "opacity-100 scale-100 rotate-0" 
                : "opacity-0 scale-50 -rotate-90"
            )} />
            <Monitor className={cn(
              "absolute transition-all duration-300 text-muted-foreground",
              themeMode === 'system' 
                ? "opacity-100 scale-100" 
                : "opacity-0 scale-50"
            )} />
          </div>
          <span className="sr-only">Chuyển đổi chế độ tối</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={() => setThemeMode('light')}
          className={cn(
            "flex items-center gap-3 cursor-pointer",
            themeMode === 'light' && "bg-accent text-accent-foreground"
          )}
        >
          <Sun className="w-4 h-4 text-yellow-500" />
          <div className="flex-1">
            <div className="font-medium">Sáng</div>
            <div className="text-xs text-muted-foreground">Luôn sử dụng giao diện sáng</div>
          </div>
          {themeMode === 'light' && (
            <div className="w-2 h-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setThemeMode('dark')}
          className={cn(
            "flex items-center gap-3 cursor-pointer",
            themeMode === 'dark' && "bg-accent text-accent-foreground"
          )}
        >
          <Moon className="w-4 h-4 text-blue-400" />
          <div className="flex-1">
            <div className="font-medium">Tối</div>
            <div className="text-xs text-muted-foreground">Luôn sử dụng giao diện tối</div>
          </div>
          {themeMode === 'dark' && (
            <div className="w-2 h-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setThemeMode('system')}
          className={cn(
            "flex items-center gap-3 cursor-pointer",
            themeMode === 'system' && "bg-accent text-accent-foreground"
          )}
        >
          <Monitor className="w-4 h-4" />
          <div className="flex-1">
            <div className="font-medium">Hệ thống</div>
            <div className="text-xs text-muted-foreground">
              Theo cài đặt hệ thống ({resolvedMode === 'dark' ? 'Tối' : 'Sáng'})
            </div>
          </div>
          {themeMode === 'system' && (
            <div className="w-2 h-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DarkModeToggle;

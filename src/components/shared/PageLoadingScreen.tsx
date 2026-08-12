import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoadingScreenProps {
  text?: string;
}

const PageLoadingScreen: React.FC<PageLoadingScreenProps> = ({ text = "Đang tải dữ liệu..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="relative flex flex-col items-center space-y-4 p-8 rounded-3xl bg-card border shadow-2xl max-w-xs text-center">
        {/* Animated Brand Glow Ring */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-indigo-500 to-amber-500 animate-spin blur-xs opacity-75" />
          <div className="w-14 h-14 rounded-full bg-card flex items-center justify-center relative z-10">
            <span className="text-2xl animate-bounce">🎌</span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-extrabold text-base text-foreground tracking-tight">Quang Dũng Nihongo</h3>
          <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            {text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageLoadingScreen;

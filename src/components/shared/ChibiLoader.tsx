import { useEffect, useState } from 'react';
import chibi1 from '@/assets/chibi-run-1.png';
import chibi2 from '@/assets/chibi-run-2.png';

interface ChibiLoaderProps {
  label?: string;
  fullScreen?: boolean;
  size?: number;
}

/**
 * Lightweight chibi running loader.
 * - 2 frames alternate via CSS animation (steps(2)) for smooth, GPU-friendly playback.
 * - Admin can override frames/label by writing to localStorage:
 *     chibi_loader_frame1, chibi_loader_frame2, chibi_loader_label
 */
const ChibiLoader = ({ label, fullScreen = true, size = 140 }: ChibiLoaderProps) => {
  const [frame1, setFrame1] = useState<string>(chibi1);
  const [frame2, setFrame2] = useState<string>(chibi2);
  const [text, setText] = useState<string>(label || 'Đang tải...');

  useEffect(() => {
    try {
      const f1 = localStorage.getItem('chibi_loader_frame1');
      const f2 = localStorage.getItem('chibi_loader_frame2');
      const lb = localStorage.getItem('chibi_loader_label');
      if (f1) setFrame1(f1);
      if (f2) setFrame2(f2);
      if (!label && lb) setText(lb);
    } catch { /* ignore */ }
  }, [label]);

  return (
    <div className={fullScreen ? 'min-h-screen flex flex-col items-center justify-center gap-4 bg-background' : 'flex flex-col items-center justify-center gap-3 py-12'}>
      <div
        className="chibi-loader-stage relative"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <img
          src={frame1}
          alt=""
          className="chibi-frame chibi-frame-1 absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
        <img
          src={frame2}
          alt=""
          className="chibi-frame chibi-frame-2 absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
      </div>
      <div className="chibi-shadow" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">{text}</p>
      <style>{`
        @keyframes chibi-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes chibi-swap-1 {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes chibi-swap-2 {
          0%, 49% { opacity: 0; }
          50%, 100% { opacity: 1; }
        }
        .chibi-loader-stage { animation: chibi-bob 0.5s ease-in-out infinite; will-change: transform; }
        .chibi-frame-1 { animation: chibi-swap-1 0.4s steps(1) infinite; will-change: opacity; }
        .chibi-frame-2 { animation: chibi-swap-2 0.4s steps(1) infinite; will-change: opacity; }
        .chibi-shadow {
          width: 70px; height: 8px; border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.25), rgba(0,0,0,0));
          margin-top: -8px;
          animation: chibi-shadow 0.5s ease-in-out infinite;
        }
        @keyframes chibi-shadow {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(0.7); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default ChibiLoader;
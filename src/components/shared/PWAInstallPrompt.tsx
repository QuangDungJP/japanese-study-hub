import { useState, useEffect } from "react";
import { Download, Share, PlusSquare, X, Sparkles, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. Check if user dismissed recently (last 5 days)
    const dismissedUntil = localStorage.getItem("pwa_prompt_dismissed_until");
    if (dismissedUntil && parseInt(dismissedUntil, 10) > Date.now()) {
      return;
    }

    // 3. Detect iOS
    const isIosDevice =
      /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // 4. Listen for Chrome/Android install prompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait a little before showing to avoid interrupting immediate page load
      setTimeout(() => setIsVisible(true), 2500);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // If iOS and not standalone, show prompt after 3s
    if (isIosDevice) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSTip(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for 5 days
    localStorage.setItem(
      "pwa_prompt_dismissed_until",
      (Date.now() + 5 * 24 * 60 * 60 * 1000).toString()
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 lg:hidden animate-slide-up pointer-events-auto">
      <div className="bg-card/95 dark:bg-slate-900/95 backdrop-blur-xl border border-border/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xl">
        <div className="flex items-start gap-3">
          {/* App Icon */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shadow-md shrink-0">
            <img
              src="/pwa-192x192.png"
              alt="Quang Dũng Nihongo"
              className="w-full h-full rounded-[10px] object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-xs font-bold text-foreground truncate">
                Quang Dũng Nihongo App
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-600 text-[9px] font-bold">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
              Cài vào màn hình chính để mở toàn màn hình, học mượt mà không thanh địa chỉ!
            </p>

            {/* iOS Helper Instructions */}
            {showIOSTip && (
              <div className="mt-2.5 p-2 rounded-xl bg-muted/70 text-[11px] text-foreground space-y-1 animate-fade-in border border-border">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <Share className="w-3.5 h-3.5 text-blue-500" />
                  <span>Bước 1: Chạm nút Chia sẻ ở thanh dưới Safari</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <PlusSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Bước 2: Chọn &quot;Thêm vào MH chính&quot; (Add to Home Screen)</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-2.5">
              <Button
                size="sm"
                onClick={handleInstall}
                className="h-8 px-3.5 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-xs active:scale-95 transition-transform"
              >
                {isIOS ? (
                  <>
                    <Share className="w-3.5 h-3.5 mr-1" />
                    Cách cài đặt
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Cài đặt 1 chạm
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 px-2.5 text-xs text-muted-foreground rounded-xl"
              >
                Để sau
              </Button>
            </div>
          </div>

          {/* Close [X] Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2.5 right-2.5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;

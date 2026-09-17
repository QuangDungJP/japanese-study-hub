import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

// Check for SW updates every 60 seconds
const UPDATE_CHECK_INTERVAL_MS = 60 * 1000;

// Pages where auto-reload is dangerous (user might be editing)
const EDITING_PATH_PREFIXES = ['/admin', '/teacher'];

// Xóa toàn bộ cache cũ của Service Worker
async function cleanOldCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((name) => {
        // Xóa tất cả cache workbox cũ (các phiên bản trước)
        return caches.delete(name);
      })
    );
    console.log(`[ReloadPrompt] Cleared ${cacheNames.length} caches`);
  } catch (e) {
    // Bỏ qua lỗi nếu browser không hỗ trợ
  }
}

export function ReloadPrompt() {
  const location = useLocation();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (!registration) return;
      
      // Periodic check for SW updates
      setInterval(() => {
        registration.update().catch(() => {
          // Silent fail on update check
        });
      }, UPDATE_CHECK_INTERVAL_MS);
      
      console.log('[ReloadPrompt] SW registered, periodic update check enabled');
    },
    onRegisterError(_error) {
      console.warn('[ReloadPrompt] SW registration error');
    },
  });

  // Smart auto-update handler
  const performUpdate = useCallback(async () => {
    try {
      await cleanOldCaches();
      await updateServiceWorker(true);
      setNeedRefresh(false);
    } catch (err) {
      console.warn('[ReloadPrompt] Update failed, reloading...', err);
      window.location.reload();
    }
  }, [updateServiceWorker, setNeedRefresh]);

  useEffect(() => {
    if (offlineReady) {
      // Don't show offline ready toast — it's confusing for users
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (!needRefresh) return;

    const isEditing = EDITING_PATH_PREFIXES.some((p) => location.pathname.startsWith(p));

    if (isEditing) {
      // User is on admin/teacher page — show confirmation toast
      toast('🆕 Có phiên bản mới!', {
        description: 'Cập nhật ngay để nhận giao diện & tính năng mới nhất.',
        action: {
          label: '🔄 Cập nhật ngay',
          onClick: performUpdate,
        },
        cancel: {
          label: 'Để sau',
          onClick: () => setNeedRefresh(false),
        },
        duration: 15000, // 15 seconds then auto-dismiss
      });
    } else {
      // User is on public/learn page — show brief notice then auto-update
      toast.info('🔄 Đang cập nhật phiên bản mới...', {
        description: 'Trang sẽ tự tải lại trong giây lát.',
        duration: 2000,
      });
      
      // Auto-update after 2 seconds
      const timer = setTimeout(performUpdate, 2000);
      return () => clearTimeout(timer);
    }
  }, [needRefresh, location.pathname, performUpdate, setNeedRefresh]);

  return null;
}

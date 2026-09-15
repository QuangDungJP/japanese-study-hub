import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

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
  } catch (e) {
    // Bỏ qua lỗi nếu browser không hỗ trợ
  }
}

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(_r) {
      // SW registered silently
    },
    onRegisterError(_error) {
      // SW registration error - silent fail
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast.success('Ứng dụng sẵn sàng hoạt động ngoại tuyến 🎉');
    }
  }, [offlineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast('🆕 Có phiên bản mới của ứng dụng!', {
        description: 'Cập nhật để nhận tính năng mới nhất và dọn dẹp bộ nhớ cũ.',
        action: {
          label: 'Cập nhật & Làm sạch',
          onClick: async () => {
            // 1. Xóa cache cũ trước khi cập nhật
            await cleanOldCaches();
            // 2. Kích hoạt Service Worker mới (tải trang mới)
            await updateServiceWorker(true);
            setNeedRefresh(false);
          },
        },
        cancel: {
          label: 'Để sau',
          onClick: () => setNeedRefresh(false),
        },
        duration: Infinity,
      });
    }
  }, [needRefresh, updateServiceWorker, setNeedRefresh]);

  return null;
}

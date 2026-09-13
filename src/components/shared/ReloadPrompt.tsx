import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast.success('Ứng dụng đã sẵn sàng hoạt động ngoại tuyến');
    }
  }, [offlineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast('Có phiên bản mới của ứng dụng!', {
        action: {
          label: 'Cập nhật ngay',
          onClick: () => updateServiceWorker(true),
        },
        duration: Infinity,
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}

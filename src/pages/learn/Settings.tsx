import ThemeCustomizer from '@/components/theme/ThemeCustomizer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings as SettingsIcon, User, Bell, Shield, Download, Smartphone } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      navigate('/huong-dan-cai-dat');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-primary" />
          </div>
          Cài đặt
        </h1>
        <p className="text-muted-foreground mt-1">Tùy chỉnh trải nghiệm học tập của bạn</p>
      </div>

      <div className="grid gap-6">
        {/* App Installation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Ứng dụng JP Hub
            </CardTitle>
            <CardDescription>
              Cài đặt ứng dụng trực tiếp lên thiết bị của bạn để trải nghiệm tốt hơn với biểu tượng đầy đủ và thông báo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAppInstalled ? (
              <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Ứng dụng đã được cài đặt</p>
                  <p className="text-sm text-muted-foreground">Bạn có thể mở JP Hub từ màn hình chính hoặc danh sách ứng dụng.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <p className="font-medium flex items-center gap-2">
                    Tải app xuống thiết bị
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">Khuyên dùng</span>
                  </p>
                  <p className="text-sm text-muted-foreground">Tạo lối tắt trên màn hình và nhận thông báo đẩy nhanh chóng.</p>
                </div>
                <Button onClick={handleInstallClick} variant={deferredPrompt ? "default" : "outline"}>
                  <Download className="w-4 h-4 mr-2" />
                  {deferredPrompt ? "Cài đặt ngay" : "Xem hướng dẫn cài"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <ThemeCustomizer />

        {/* Seasonal Theme Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🎊</span>
              Giao diện Lễ hội / Theo Mùa
            </CardTitle>
            <CardDescription>Bật/tắt các hiệu ứng lễ hội đặc biệt (do Admin cấu hình)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Hiệu ứng theo mùa</Label>
                <p className="text-sm text-muted-foreground">
                  Cho phép thay đổi giao diện và hiển thị hiệu ứng (Tuyết rơi, pháo hoa...) vào các dịp lễ
                </p>
              </div>
              <Switch
                checked={JSON.parse(localStorage.getItem('enable-seasonal-theme') || 'true')}
                onCheckedChange={(checked) => {
                  localStorage.setItem('enable-seasonal-theme', JSON.stringify(checked));
                  window.location.reload(); // Reload to re-mount context and clear old classes easily
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Thông báo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Thông báo email</Label>
                <p className="text-sm text-muted-foreground">
                  Nhận thông báo qua email về bài học và lịch học
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Thông báo đẩy</Label>
                <p className="text-sm text-muted-foreground">
                  Nhận thông báo trên thiết bị/trình duyệt
                </p>
              </div>
              <Switch
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Bảo mật
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <p className="font-medium">Đổi mật khẩu</p>
                <p className="text-sm text-muted-foreground">
                  Cập nhật mật khẩu đăng nhập của bạn
                </p>
              </div>
              <button className="text-primary text-sm font-medium hover:underline">
                Thay đổi
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCircle2, Clock, Info, AlertTriangle, BookOpen, Trash2, Check, ExternalLink } from 'lucide-react';
import { formatWithJST } from '@/lib/dateUtils';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const StudentNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      fetchNotifications();

      const channel = supabase
        .channel(`student-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching student notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({ title: 'Thành công', description: 'Đã đánh dấu tất cả thông báo là đã đọc' });
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật trạng thái', variant: 'destructive' });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({ title: 'Đã xóa thông báo' });
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể xóa thông báo', variant: 'destructive' });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'academic') return n.type === 'grade' || n.type === 'achievement' || n.type === 'success';
    if (activeTab === 'schedule') return n.type === 'info' || n.type === 'warning' || n.type === 'reminder';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'success': return <Badge className="bg-green-500/10 text-green-600 border-green-200">Thành công</Badge>;
      case 'warning': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Cảnh báo</Badge>;
      case 'grade': return <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">Điểm số</Badge>;
      case 'achievement': return <Badge className="bg-orange-500/10 text-orange-600 border-orange-200">Thành tích</Badge>;
      default: return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Thông báo</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-7 h-7 text-primary" /> Hộp thư thông báo
          </h1>
          <p className="text-muted-foreground mt-1">Cập nhật tin tức học tập, điểm số và lịch học của bạn</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-1.5 shrink-0">
            <Check className="w-4 h-4 text-green-600" /> Đánh dấu tất cả là đã đọc
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg text-xs sm:text-sm">
            Tất cả ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread" className="rounded-lg text-xs sm:text-sm">
            Chưa đọc ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="academic" className="rounded-lg text-xs sm:text-sm">
            Học tập & Điểm số
          </TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-lg text-xs sm:text-sm">
            Lịch học & Báo vắng
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
                Không có thông báo nào trong mục này.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((n) => (
                <Card 
                  key={n.id} 
                  className={`hover:shadow-md transition-all duration-200 cursor-pointer border ${
                    !n.is_read ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div className="flex gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        !n.is_read ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-foreground text-sm sm:text-base">{n.title}</h3>
                          {getTypeBadge(n.type)}
                          {!n.is_read && (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0.5">Mới</Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatWithJST(n.created_at, true)}
                          </span>
                          {n.link && (
                            <span className="text-primary font-semibold flex items-center gap-0.5 hover:underline">
                              Mở xem chi tiết <ExternalLink className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {!n.is_read && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground" 
                          onClick={() => markAsRead(n.id)}
                          title="Đánh dấu đã đọc"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                        onClick={() => deleteNotification(n.id)}
                        title="Xóa thông báo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentNotifications;

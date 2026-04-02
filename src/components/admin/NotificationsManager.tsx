import { useState, useEffect } from 'react';
import { Bell, Send, Users, User, Loader2, Trash2, Info, CheckCircle2, AlertTriangle, Trophy, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

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

interface UserProfile {
  user_id: string;
  full_name: string | null;
}

const notificationTypes = [
  { value: 'info', label: 'Thông báo', icon: Info, color: 'bg-blue-500/10 text-blue-500' },
  { value: 'success', label: 'Thành công', icon: CheckCircle2, color: 'bg-green-500/10 text-green-500' },
  { value: 'warning', label: 'Cảnh báo', icon: AlertTriangle, color: 'bg-yellow-500/10 text-yellow-500' },
  { value: 'grade', label: 'Chấm điểm', icon: FileText, color: 'bg-purple-500/10 text-purple-500' },
  { value: 'achievement', label: 'Thành tích', icon: Trophy, color: 'bg-orange-500/10 text-orange-500' },
];

const NotificationsManager = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    user_id: 'all',
    title: '',
    message: '',
    type: 'info',
    link: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifications(notifData || []);

      // Fetch users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!formData.title || !formData.message) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập tiêu đề và nội dung', variant: 'destructive' });
      return;
    }

    setSending(true);

    try {
      if (formData.user_id === 'all') {
        // Send to all users
        const notifications = users.map(user => ({
          user_id: user.user_id,
          title: formData.title,
          message: formData.message,
          type: formData.type,
          link: formData.link || null
        }));

        const { error } = await supabase.from('notifications').insert(notifications);
        if (error) throw error;
        
        toast({ title: 'Thành công', description: `Đã gửi thông báo đến ${users.length} người dùng` });
      } else {
        // Send to specific user
        const { error } = await supabase.from('notifications').insert({
          user_id: formData.user_id,
          title: formData.title,
          message: formData.message,
          type: formData.type,
          link: formData.link || null
        });
        if (error) throw error;
        
        toast({ title: 'Thành công', description: 'Đã gửi thông báo' });
      }

      setIsDialogOpen(false);
      setFormData({ user_id: 'all', title: '', message: '', type: 'info', link: '' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setNotifications(notifications.filter(n => n.id !== id));
      toast({ title: 'Đã xóa thông báo' });
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    }
  };

  const getTypeInfo = (type: string) => {
    return notificationTypes.find(t => t.value === type) || notificationTypes[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Quản lý thông báo
          </h2>
          <p className="text-muted-foreground">Gửi thông báo đến học viên</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Send className="w-4 h-4 mr-2" />
              Gửi thông báo mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Gửi thông báo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Gửi đến</label>
                <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Tất cả học viên ({users.length})
                      </div>
                    </SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {user.full_name || 'Chưa có tên'}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Loại thông báo</label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Tiêu đề</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tiêu đề thông báo..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Nội dung</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Nhập nội dung thông báo..."
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Link (tùy chọn)</label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="/learn/reading"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button variant="hero" onClick={handleSend} disabled={sending}>
                  {sending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Gửi thông báo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Thông báo gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có thông báo nào.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => {
                const typeInfo = getTypeInfo(notification.type);
                const TypeIcon = typeInfo.icon;
                return (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg ${typeInfo.color} flex items-center justify-center`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{notification.title}</span>
                        {!notification.is_read && (
                          <Badge variant="secondary" className="text-xs">Chưa đọc</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(notification.id)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsManager;

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bug, Plus, Clock, Check, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface BugReport {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const TeacherBugReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium'
  });

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching bug reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập tiêu đề và mô tả',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('bug_reports')
        .insert({
          ...formData,
          user_id: user?.id
        });

      if (error) throw error;

      toast({ title: 'Thành công', description: 'Đã gửi báo lỗi' });
      setIsDialogOpen(false);
      resetForm();
      fetchReports();
    } catch (error) {
      console.error('Error creating bug report:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi báo lỗi',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'other',
      priority: 'medium'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600"><Clock className="w-3 h-3 mr-1" />Đang chờ</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><AlertTriangle className="w-3 h-3 mr-1" />Đang xử lý</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600"><Check className="w-3 h-3 mr-1" />Đã giải quyết</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-600">Đã đóng</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600">Thấp</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">Trung bình</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600">Cao</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600">Khẩn cấp</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      lesson: 'Bài học',
      zoom: 'Zoom',
      submission: 'Bài nộp',
      other: 'Khác'
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Báo lỗi</h1>
          <p className="text-muted-foreground mt-1">Gửi báo cáo lỗi hoặc yêu cầu hỗ trợ</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo báo lỗi
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bug className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Chưa có báo lỗi nào</h3>
            <p className="text-muted-foreground mb-4">Gặp vấn đề? Hãy tạo báo lỗi để được hỗ trợ</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo báo lỗi đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{report.title}</h3>
                      {getStatusBadge(report.status)}
                    </div>
                    <p className="text-muted-foreground">{report.description}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">Danh mục: {getCategoryLabel(report.category)}</span>
                      <span>·</span>
                      <span className="text-muted-foreground">Độ ưu tiên:</span>
                      {getPriorityBadge(report.priority)}
                      <span>·</span>
                      <span className="text-muted-foreground">
                        {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </span>
                    </div>
                  </div>
                </div>
                
                {report.admin_notes && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-1">
                      <Info className="w-4 h-4" />
                      Phản hồi từ Admin
                    </div>
                    <p className="text-sm">{report.admin_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Bug Report Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo báo lỗi mới</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Mô tả ngắn gọn vấn đề"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">Bài học</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="submission">Bài nộp</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Độ ưu tiên</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Thấp</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="high">Cao</SelectItem>
                    <SelectItem value="critical">Khẩn cấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mô tả chi tiết</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết vấn đề bạn gặp phải, các bước tái hiện lỗi..."
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit}>
              <Bug className="w-4 h-4 mr-2" />
              Gửi báo lỗi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherBugReports;

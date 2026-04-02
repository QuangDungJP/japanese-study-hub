import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Send, Users, User, Clock, CheckCircle, FileText, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ClassData {
  id: string;
  name_vi: string;
}

interface Student {
  student_id: string;
  full_name: string;
  class_name: string;
}

interface SentNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  recipient_count: number;
}

const QUICK_TEMPLATES = [
  { title: 'Nhắc nhở bài tập', message: 'Các bạn nhớ hoàn thành bài tập được giao trước buổi học tiếp theo nhé!', type: 'reminder' },
  { title: 'Thông báo lịch học', message: 'Lịch học tuần này có thay đổi, các bạn chú ý kiểm tra lịch mới.', type: 'info' },
  { title: 'Chúc mừng', message: 'Chúc mừng các bạn đã hoàn thành xuất sắc bài kiểm tra!', type: 'success' },
  { title: 'Tài liệu mới', message: 'Đã có tài liệu học tập mới, các bạn vào phần bài học để xem nhé.', type: 'info' },
];

const TeacherNotifications = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all', // all, class, individual
    targetClass: '',
    targetStudents: [] as string[]
  });

  useEffect(() => {
    if (user) {
      fetchClassesAndStudents();
      fetchSentNotifications();
    }
  }, [user]);

  const fetchClassesAndStudents = async () => {
    try {
      // Fetch teacher's classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name_vi')
        .eq('teacher_id', user?.id);

      setClasses(classesData || []);

      // Fetch all students from teacher's classes
      if (classesData && classesData.length > 0) {
        const classIds = classesData.map(c => c.id);
        const { data: enrollments } = await supabase
          .from('class_students')
          .select('student_id, class_id')
          .in('class_id', classIds);

        if (enrollments) {
          const studentProfiles = await Promise.all(
            enrollments.map(async (enroll) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', enroll.student_id)
                .single();

              const classInfo = classesData.find(c => c.id === enroll.class_id);
              return {
                student_id: enroll.student_id,
                full_name: profile?.full_name || 'N/A',
                class_name: classInfo?.name_vi || ''
              };
            })
          );

          setStudents(studentProfiles);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentNotifications = async () => {
    // We'll track sent notifications by querying recent ones
    // In a real app, you might have a separate table for tracking sent batches
    try {
      const { data } = await supabase
        .from('notifications')
        .select('id, title, message, type, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      // Group by title and timestamp to get unique sends
      const grouped: { [key: string]: SentNotification } = {};
      data?.forEach(n => {
        const key = `${n.title}-${n.created_at.slice(0, 16)}`;
        if (!grouped[key]) {
          grouped[key] = {
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            created_at: n.created_at,
            recipient_count: 1
          };
        } else {
          grouped[key].recipient_count++;
        }
      });

      setSentNotifications(Object.values(grouped).slice(0, 10));
    } catch (error) {
      console.error('Error fetching sent notifications:', error);
    }
  };

  const handleSend = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập tiêu đề và nội dung thông báo',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSending(true);

      let targetStudentIds: string[] = [];

      if (formData.targetType === 'all') {
        targetStudentIds = students.map(s => s.student_id);
      } else if (formData.targetType === 'class' && formData.targetClass) {
        // Get students from selected class
        const { data: enrollments } = await supabase
          .from('class_students')
          .select('student_id')
          .eq('class_id', formData.targetClass);

        targetStudentIds = enrollments?.map(e => e.student_id) || [];
      } else if (formData.targetType === 'individual') {
        targetStudentIds = formData.targetStudents;
      }

      if (targetStudentIds.length === 0) {
        toast({
          title: 'Không có người nhận',
          description: 'Vui lòng chọn ít nhất một học viên để gửi thông báo',
          variant: 'destructive'
        });
        return;
      }

      // Create notifications for all target students
      const notifications = targetStudentIds.map(studentId => ({
        user_id: studentId,
        title: formData.title,
        message: formData.message,
        type: formData.type
      }));

      const { error } = await supabase.from('notifications').insert(notifications);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: `Đã gửi thông báo đến ${targetStudentIds.length} học viên`
      });

      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all',
        targetClass: '',
        targetStudents: []
      });

      // Refresh sent notifications
      fetchSentNotifications();
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi thông báo',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    if (formData.targetStudents.includes(studentId)) {
      setFormData({
        ...formData,
        targetStudents: formData.targetStudents.filter(id => id !== studentId)
      });
    } else {
      setFormData({
        ...formData,
        targetStudents: [...formData.targetStudents, studentId]
      });
    }
  };

  const selectAllStudents = () => {
    setFormData({
      ...formData,
      targetStudents: students.map(s => s.student_id)
    });
  };

  const deselectAllStudents = () => {
    setFormData({
      ...formData,
      targetStudents: []
    });
  };

  const applyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setFormData({
      ...formData,
      title: template.title,
      message: template.message,
      type: template.type
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'success': return <Badge className="bg-green-500/10 text-green-600 border-green-200">Thành công</Badge>;
      case 'warning': return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Cảnh báo</Badge>;
      case 'reminder': return <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">Nhắc nhở</Badge>;
      default: return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Thông tin</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gửi thông báo</h1>
        <p className="text-muted-foreground mt-1">Gửi thông báo đến học viên trong các lớp của bạn</p>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compose" className="gap-2">
            <Send className="w-4 h-4" />
            Soạn thông báo
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="w-4 h-4" />
            Lịch sử gửi
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="w-4 h-4" />
            Mẫu nhanh
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compose Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Soạn thông báo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tiêu đề</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nhập tiêu đề thông báo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nội dung</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Nhập nội dung thông báo..."
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Loại thông báo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Thông tin</SelectItem>
                        <SelectItem value="success">Thành công</SelectItem>
                        <SelectItem value="warning">Cảnh báo</SelectItem>
                        <SelectItem value="reminder">Nhắc nhở</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Gửi đến</Label>
                    <Select
                      value={formData.targetType}
                      onValueChange={(value) => setFormData({ ...formData, targetType: value, targetStudents: [] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả học viên</SelectItem>
                        <SelectItem value="class">Theo lớp</SelectItem>
                        <SelectItem value="individual">Chọn từng người</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.targetType === 'class' && (
                  <div className="space-y-2">
                    <Label>Chọn lớp</Label>
                    <Select
                      value={formData.targetClass}
                      onValueChange={(value) => setFormData({ ...formData, targetClass: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn lớp học" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name_vi}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.targetType === 'individual' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Chọn học viên</Label>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={selectAllStudents}>
                          Chọn tất cả
                        </Button>
                        <Button variant="ghost" size="sm" onClick={deselectAllStudents}>
                          Bỏ chọn
                        </Button>
                      </div>
                    </div>
                    <div className="border rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-2">
                      {students.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Chưa có học viên nào</p>
                      ) : (
                        students.map((student) => (
                          <div key={student.student_id} className="flex items-center space-x-2">
                            <Checkbox
                              id={student.student_id}
                              checked={formData.targetStudents.includes(student.student_id)}
                              onCheckedChange={() => toggleStudent(student.student_id)}
                            />
                            <label
                              htmlFor={student.student_id}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {student.full_name}
                              <span className="text-muted-foreground ml-2">({student.class_name})</span>
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <Button onClick={handleSend} disabled={sending} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? 'Đang gửi...' : 'Gửi thông báo'}
                </Button>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Thống kê</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{classes.length}</p>
                    <p className="text-sm text-muted-foreground">Lớp học</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{students.length}</p>
                    <p className="text-sm text-muted-foreground">Học viên</p>
                  </div>
                </div>

                {formData.targetType === 'individual' && (
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/10">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formData.targetStudents.length}</p>
                      <p className="text-sm text-muted-foreground">Đã chọn</p>
                    </div>
                  </div>
                )}

                {formData.targetType === 'all' && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm text-primary font-medium">
                      Sẽ gửi đến tất cả {students.length} học viên
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Lịch sử thông báo đã gửi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sentNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Chưa có thông báo nào được gửi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{notification.title}</h3>
                            {getTypeBadge(notification.type)}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant="outline" className="mb-1">
                            <User className="w-3 h-3 mr-1" />
                            {notification.recipient_count} người
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Mẫu thông báo nhanh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {QUICK_TEMPLATES.map((template, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => applyTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{template.title}</h3>
                      {getTypeBadge(template.type)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {template.message}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Sử dụng mẫu này
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Click vào mẫu để sử dụng, sau đó chỉnh sửa nội dung theo ý muốn
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherNotifications;

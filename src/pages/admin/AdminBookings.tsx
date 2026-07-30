import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, 
  Video, Link as LinkIcon, Copy, Search, Sparkles, RefreshCw, Eye
} from 'lucide-react';
import { addMinutes } from 'date-fns';
import { formatWithJST } from '@/lib/dateUtils';
import { useToast } from '@/hooks/use-toast';

interface Meeting {
  id: string;
  booking_id: string;
  meet_link: string;
  start_time: string;
  end_time: string;
}

const AdminBookings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [meetDialogOpen, setMeetDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [meetLink, setMeetLink] = useState('');
  const [savingMeet, setSavingMeet] = useState(false);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('public:admin-bookings-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-meetings'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: meetings } = useQuery({
    queryKey: ['admin-meetings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*');

      if (error) throw error;
      return data as Meeting[];
    },
  });

  const getMeetingForBooking = (bookingId: string) => {
    return meetings?.find(m => m.booking_id === bookingId);
  };

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast({
        title: 'Cập nhật thành công',
        description: 'Trạng thái lịch học Meeting đã được cập nhật.',
      });
    },
    onError: () => {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật lịch học.',
        variant: 'destructive',
      });
    },
  });

  const handleAddMeetLink = async () => {
    if (!selectedBooking || !meetLink.trim()) return;

    setSavingMeet(true);

    try {
      const bookingDate = new Date(selectedBooking.booking_date);
      const [hours, minutes] = selectedBooking.booking_time.split(':');
      bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const endTime = addMinutes(bookingDate, selectedBooking.duration_minutes);

      const existingMeeting = getMeetingForBooking(selectedBooking.id);

      if (existingMeeting) {
        const { error } = await supabase
          .from('meetings')
          .update({ meet_link: meetLink })
          .eq('id', existingMeeting.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('meetings')
          .insert({
            booking_id: selectedBooking.id,
            meet_link: meetLink,
            start_time: bookingDate.toISOString(),
            end_time: endTime.toISOString(),
          });

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['admin-meetings'] });
      toast({
        title: 'Đã lưu link Google Meet',
        description: 'Học viên & Giảng viên sẽ thấy link này khi vào lịch học.',
      });
      setMeetDialogOpen(false);
      setMeetLink('');
      setSelectedBooking(null);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể lưu link Google Meet.',
        variant: 'destructive',
      });
    } finally {
      setSavingMeet(false);
    }
  };

  const openMeetDialog = (booking: any) => {
    setSelectedBooking(booking);
    const existingMeeting = getMeetingForBooking(booking.id);
    setMeetLink(existingMeeting?.meet_link || '');
    setMeetDialogOpen(true);
  };

  const generateMeetLinkTemplate = () => {
    const meetId = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    setMeetLink(`https://meet.google.com/${meetId}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Đã sao chép link',
      description: 'Link Google Meet đã được lưu vào clipboard.',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30"><AlertCircle className="w-3 h-3 mr-1" />Chờ xác nhận</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" />Đã xác nhận</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30"><XCircle className="w-3 h-3 mr-1" />Đã hủy</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30"><CheckCircle className="w-3 h-3 mr-1" />Hoàn thành</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredBookings = bookings?.filter(booking => {
    const studentName = (booking.profiles as any)?.full_name || '';
    const teacherName = booking.teacher_name || '';
    const matchesSearch = !searchTerm || 
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacherName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'all') return true;
    return booking.status === activeTab;
  }) || [];

  const stats = {
    total: bookings?.length || 0,
    pending: bookings?.filter(b => b.status === 'pending').length || 0,
    confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
    completed: bookings?.filter(b => b.status === 'completed').length || 0,
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary via-indigo-600 to-accent p-6 md:p-8 text-white shadow-2xl overflow-hidden border border-white/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-md border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> Meeting Management · 1-on-1 Sessions
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Quản lý Đặt lịch Meeting 📹
            </h1>
            <p className="text-white/90 text-sm md:text-base max-w-xl font-medium leading-relaxed">
              Duyệt lịch dạy 1:1, cấp link Google Meet trực tiếp & theo dõi tiến độ các buổi học của học viên với giảng viên.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              onClick={() => refetch()}
              className="gap-2 font-bold shadow-lg hover:scale-105 transition-transform"
            >
              <RefreshCw className="w-4 h-4 text-primary" /> Làm mới dữ liệu
            </Button>
          </div>
        </div>
      </div>

      {/* Glassmorphic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-border/80 shadow-soft bg-card hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tổng lượt đặt</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{isLoading ? '...' : stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-amber-500/30 bg-amber-50/20 dark:bg-amber-500/5 shadow-soft hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Chờ xác nhận</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{isLoading ? '...' : stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-500/5 shadow-soft hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đã xác nhận</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{isLoading ? '...' : stats.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-blue-500/30 bg-blue-50/20 dark:bg-blue-500/5 shadow-soft hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/30">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Đã hoàn thành</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{isLoading ? '...' : stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Section */}
      <Card className="border-border shadow-soft">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Danh sách lịch đặt Meeting</CardTitle>
              <CardDescription>Quản lý toàn bộ lịch hẹn học 1:1 trực tiếp giữa học viên và giáo viên</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên học viên, GV..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tất cả ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                Chờ duyệt {stats.pending > 0 && <Badge className="ml-1 bg-amber-500 text-white text-[10px]">{stats.pending}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="confirmed">Đã xác nhận ({stats.confirmed})</TabsTrigger>
              <TabsTrigger value="completed">Hoàn thành ({stats.completed})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Video className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-semibold text-foreground">Không có lịch đặt Meeting nào</p>
                  <p className="text-xs">Chưa có dữ liệu đặt lịch thỏa mãn bộ lọc hiện tại.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Học viên</TableHead>
                        <TableHead>Giảng viên</TableHead>
                        <TableHead>Thời gian</TableHead>
                        <TableHead>Thời lượng</TableHead>
                        <TableHead>Google Meet</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => {
                        const meeting = getMeetingForBooking(booking.id);
                        return (
                          <TableRow key={booking.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  <User className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-sm text-foreground">
                                  {(booking.profiles as any)?.full_name || 'Học viên'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-sm text-primary">
                                {booking.teacher_name}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5 text-xs">
                                <div className="flex items-center gap-1.5 font-medium">
                                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                  {formatWithJST(booking.booking_date, false)}
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Clock className="w-3.5 h-3.5" />
                                  {booking.booking_time.slice(0, 5)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {booking.duration_minutes} phút
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {meeting ? (
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs font-semibold">
                                    <Video className="w-3 h-3 mr-1" />
                                    Đã cấp link
                                  </Badge>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                    onClick={() => copyToClipboard(meeting.meet_link)}
                                    title="Sao chép link"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs font-bold gap-1 text-primary border-primary/30"
                                  onClick={() => openMeetDialog(booking)}
                                >
                                  <LinkIcon className="w-3 h-3" />
                                  Tạo link Meet
                                </Button>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {meeting && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs gap-1"
                                    onClick={() => openMeetDialog(booking)}
                                    title="Sửa link Meet"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {booking.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="hero"
                                      className="h-8 text-xs font-bold"
                                      onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'confirmed' })}
                                      disabled={updateBookingMutation.isPending}
                                    >
                                      Duyệt
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 text-xs text-rose-600 hover:text-rose-700"
                                      onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'cancelled' })}
                                      disabled={updateBookingMutation.isPending}
                                    >
                                      Hủy
                                    </Button>
                                  </>
                                )}
                                {booking.status === 'confirmed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs text-blue-600 hover:text-blue-700"
                                    onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'completed' })}
                                    disabled={updateBookingMutation.isPending}
                                  >
                                    Hoàn thành
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Google Meet Link Modal */}
      <Dialog open={meetDialogOpen} onOpenChange={setMeetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              Cấp Link Google Meet Buổi Học
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase">Buổi học 1-on-1</p>
                <p className="font-bold text-foreground text-sm">
                  {(selectedBooking.profiles as any)?.full_name || 'Học viên'} ↔ {selectedBooking.teacher_name}
                </p>
                <p className="text-xs text-muted-foreground pt-1">
                  📅 {formatWithJST(selectedBooking.booking_date, false)} lúc {selectedBooking.booking_time.slice(0, 5)} ({selectedBooking.duration_minutes} phút)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meet-link" className="text-xs font-bold">Địa chỉ Google Meet URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="meet-link"
                    placeholder="https://meet.google.com/abc-defg-hij"
                    value={meetLink}
                    onChange={(e) => setMeetLink(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateMeetLinkTemplate}
                    title="Tạo link tự động"
                    className="shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Học viên & Giáo viên sẽ nhận được link này trên Bảng điều khiển và Email.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setMeetDialogOpen(false)}>
                  Hủy
                </Button>
                <Button variant="hero" onClick={handleAddMeetLink} disabled={!meetLink.trim() || savingMeet}>
                  {savingMeet ? 'Đang lưu...' : 'Lưu link Meeting'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;


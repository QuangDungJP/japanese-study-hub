import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Video, Link as LinkIcon, Copy } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { vi } from 'date-fns/locale';
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
  const [activeTab, setActiveTab] = useState('pending');
  const [meetDialogOpen, setMeetDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [meetLink, setMeetLink] = useState('');
  const [savingMeet, setSavingMeet] = useState(false);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

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
        description: 'Trạng thái booking đã được cập nhật.',
      });
    },
    onError: () => {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật booking.',
        variant: 'destructive',
      });
    },
  });

  const handleAddMeetLink = async () => {
    if (!selectedBooking || !meetLink.trim()) return;

    setSavingMeet(true);

    try {
      // Calculate start and end times
      const bookingDate = new Date(selectedBooking.booking_date);
      const [hours, minutes] = selectedBooking.booking_time.split(':');
      bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const endTime = addMinutes(bookingDate, selectedBooking.duration_minutes);

      // Check if meeting already exists
      const existingMeeting = getMeetingForBooking(selectedBooking.id);

      if (existingMeeting) {
        // Update existing meeting
        const { error } = await supabase
          .from('meetings')
          .update({ meet_link: meetLink })
          .eq('id', existingMeeting.id);

        if (error) throw error;
      } else {
        // Create new meeting
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
        description: 'Học viên sẽ thấy link này khi xem lịch học.',
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
    // Generate a simple template - in real app you'd use Google Calendar API
    const meetId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    setMeetLink(`https://meet.google.com/${meetId}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Đã sao chép',
      description: 'Link đã được sao chép vào clipboard.',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Chờ xác nhận</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Đã xác nhận</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Đã hủy</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Hoàn thành</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredBookings = bookings?.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.status === activeTab;
  }) || [];

  const stats = {
    total: bookings?.length || 0,
    pending: bookings?.filter(b => b.status === 'pending').length || 0,
    confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
    completed: bookings?.filter(b => b.status === 'completed').length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Quản lý đặt lịch</h1>
        <p className="text-muted-foreground mt-1">Xem và xác nhận các lịch học Zoom của học viên</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Tổng booking</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Chờ xác nhận</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
                <p className="text-sm text-muted-foreground">Đã xác nhận</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Hoàn thành</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đặt lịch</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tất cả ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Chờ xác nhận ({stats.pending})</TabsTrigger>
              <TabsTrigger value="confirmed">Đã xác nhận ({stats.confirmed})</TabsTrigger>
              <TabsTrigger value="completed">Hoàn thành ({stats.completed})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Không có booking nào
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Học viên</TableHead>
                      <TableHead>Giáo viên</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Giờ</TableHead>
                      <TableHead>Thời lượng</TableHead>
                      <TableHead>Google Meet</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => {
                      const meeting = getMeetingForBooking(booking.id);
                      return (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{(booking.profiles as any)?.full_name || 'Không rõ'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{booking.teacher_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {format(new Date(booking.booking_date), 'dd/MM/yyyy', { locale: vi })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              {booking.booking_time.slice(0, 5)}
                            </div>
                          </TableCell>
                          <TableCell>{booking.duration_minutes} phút</TableCell>
                          <TableCell>
                            {meeting ? (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                                  <Video className="w-3 h-3 mr-1" />
                                  Đã có link
                                </Badge>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => copyToClipboard(meeting.meet_link)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openMeetDialog(booking)}
                              >
                                <LinkIcon className="w-3 h-3 mr-1" />
                                Thêm link
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {meeting && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openMeetDialog(booking)}
                                >
                                  <Video className="w-4 h-4" />
                                </Button>
                              )}
                              {booking.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 hover:bg-green-50"
                                    onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'confirmed' })}
                                    disabled={updateBookingMutation.isPending}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Xác nhận
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:bg-red-50"
                                    onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'cancelled' })}
                                    disabled={updateBookingMutation.isPending}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Hủy
                                  </Button>
                                </>
                              )}
                              {booking.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 hover:bg-blue-50"
                                  onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'completed' })}
                                  disabled={updateBookingMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
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
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Google Meet Dialog */}
      <Dialog open={meetDialogOpen} onOpenChange={setMeetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              Google Meet
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Buổi học với</p>
                <p className="font-semibold">{(selectedBooking.profiles as any)?.full_name}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {format(new Date(selectedBooking.booking_date), 'EEEE, dd/MM/yyyy', { locale: vi })} lúc {selectedBooking.booking_time.slice(0, 5)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meet-link">Link Google Meet</Label>
                <div className="flex gap-2">
                  <Input
                    id="meet-link"
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    value={meetLink}
                    onChange={(e) => setMeetLink(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={generateMeetLinkTemplate}
                    title="Tạo link mẫu"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dán link Google Meet từ Google Calendar hoặc tạo link mới từ meet.google.com
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setMeetDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleAddMeetLink} disabled={!meetLink.trim() || savingMeet}>
                  {savingMeet ? 'Đang lưu...' : 'Lưu link'}
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

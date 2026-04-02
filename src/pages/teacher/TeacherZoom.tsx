import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Video, Clock, Calendar, ExternalLink, Link } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Booking {
  id: string;
  user_id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  profiles?: { full_name: string };
  meetings?: { meet_link: string };
}

const TeacherZoom = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [meetLink, setMeetLink] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('teacher_id', user?.id)
        .gte('booking_date', today)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) throw error;

      // Fetch profiles and meetings
      const bookingsWithDetails = await Promise.all(
        (data || []).map(async (booking) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', booking.user_id)
            .single();

          const { data: meeting } = await supabase
            .from('meetings')
            .select('meet_link')
            .eq('booking_id', booking.id)
            .single();

          return {
            ...booking,
            profiles: profile || { full_name: 'N/A' },
            meetings: meeting || undefined
          };
        })
      );

      setBookings(bookingsWithDetails);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddMeetingDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setMeetLink(booking.meetings?.meet_link || '');
    setIsDialogOpen(true);
  };

  const handleSaveMeetLink = async () => {
    if (!selectedBooking || !meetLink.trim()) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập link Google Meet',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Check if meeting exists
      const { data: existing } = await supabase
        .from('meetings')
        .select('id')
        .eq('booking_id', selectedBooking.id)
        .single();

      if (existing) {
        // Update
        await supabase
          .from('meetings')
          .update({ meet_link: meetLink })
          .eq('id', existing.id);
      } else {
        // Create new
        const bookingDate = new Date(`${selectedBooking.booking_date}T${selectedBooking.booking_time}`);
        const endTime = new Date(bookingDate.getTime() + selectedBooking.duration_minutes * 60000);

        await supabase.from('meetings').insert({
          booking_id: selectedBooking.id,
          meet_link: meetLink,
          start_time: bookingDate.toISOString(),
          end_time: endTime.toISOString()
        });
      }

      // Send notification
      await supabase.from('notifications').insert({
        user_id: selectedBooking.user_id,
        title: 'Link Zoom đã được thêm',
        message: `Giảng viên đã thêm link cho buổi học ngày ${format(new Date(selectedBooking.booking_date), 'dd/MM/yyyy', { locale: vi })} lúc ${selectedBooking.booking_time}`,
        type: 'info',
        link: '/learn/zoom'
      });

      toast({ title: 'Thành công', description: 'Đã cập nhật link meeting' });
      setIsDialogOpen(false);
      fetchBookings();
    } catch (error) {
      console.error('Error saving meet link:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu link meeting',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">Chờ xác nhận</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600">Đã xác nhận</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600">Hoàn thành</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Lịch Zoom của tôi</h1>
        <p className="text-muted-foreground mt-1">Quản lý các buổi học trực tuyến được giao</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Chưa có lịch Zoom nào</h3>
            <p className="text-muted-foreground">Các buổi học sẽ hiển thị ở đây khi được Admin giao cho bạn</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-japanese-primary/10">
                      <Video className="w-6 h-6 text-japanese-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{booking.profiles?.full_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(booking.booking_date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {booking.booking_time} ({booking.duration_minutes} phút)
                        </div>
                      </div>
                      {booking.notes && (
                        <p className="text-sm text-muted-foreground mt-2">Ghi chú: {booking.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(booking.status)}
                    
                    {booking.meetings?.meet_link ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={booking.meetings.meet_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Vào phòng
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openAddMeetingDialog(booking)}>
                          <Link className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => openAddMeetingDialog(booking)}>
                        <Link className="w-4 h-4 mr-1" />
                        Thêm link
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Meet Link Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm link Google Meet</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedBooking && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">{selectedBooking.profiles?.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedBooking.booking_date), 'dd/MM/yyyy', { locale: vi })} - {selectedBooking.booking_time}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Link Google Meet</Label>
              <Input
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveMeetLink}>
              Lưu link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherZoom;

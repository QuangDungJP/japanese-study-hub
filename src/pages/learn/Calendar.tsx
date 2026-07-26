import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar, Plus, FileText, UserX, Video } from 'lucide-react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { LeaveRequestForm } from '@/components/calendar/LeaveRequestForm';
import { LeaveRequestList } from '@/components/calendar/LeaveRequestList';
import { ExamList } from '@/components/calendar/ExamList';
import { MyBookings } from '@/components/booking/MyBookings';
import { BookingForm } from '@/components/booking/BookingForm';

const StudentCalendarPage = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLeaveSuccess = () => {
    setLeaveDialogOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleBookingSuccess = () => {
    setBookingDialogOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lịch học của tôi</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý lịch học, kiểm tra và yêu cầu nghỉ phép
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Video className="w-4 h-4 mr-2" />
                Đặt lịch học
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Đặt lịch học với giáo viên</DialogTitle>
              </DialogHeader>
              <BookingForm onSuccess={handleBookingSuccess} />
            </DialogContent>
          </Dialog>

          <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserX className="w-4 h-4 mr-2" />
                Xin nghỉ/Dời lịch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gửi yêu cầu nghỉ/dời lịch</DialogTitle>
              </DialogHeader>
              <LeaveRequestForm onSuccess={handleLeaveSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Lịch</span>
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2">
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">Lịch học</span>
          </TabsTrigger>
          <TabsTrigger value="exams" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Kiểm tra</span>
          </TabsTrigger>
          <TabsTrigger value="leaves" className="gap-2">
            <UserX className="w-4 h-4" />
            <span className="hidden sm:inline">Nghỉ phép</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <CalendarView />
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lịch học Zoom</CardTitle>
              <Button size="sm" onClick={() => setBookingDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Đặt lịch mới
              </Button>
            </CardHeader>
            <CardContent>
              <MyBookings key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="space-y-6">
          <Tabs defaultValue="registered">
            <TabsList>
              <TabsTrigger value="registered">Đã đăng ký</TabsTrigger>
              <TabsTrigger value="available">Có thể đăng ký</TabsTrigger>
            </TabsList>
            <TabsContent value="registered" className="mt-4">
              <ExamList showRegistered={true} />
            </TabsContent>
            <TabsContent value="available" className="mt-4">
              <ExamList showRegistered={false} onRegister={() => setRefreshKey(prev => prev + 1)} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Yêu cầu nghỉ/dời lịch</CardTitle>
              <Button size="sm" onClick={() => setLeaveDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Tạo yêu cầu
              </Button>
            </CardHeader>
            <CardContent>
              <LeaveRequestList refreshKey={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentCalendarPage;

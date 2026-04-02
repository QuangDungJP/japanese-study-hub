import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface LeaveRequest {
  id: string;
  user_id: string;
  request_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  reviewer_notes: string | null;
  created_at: string;
  profiles?: { full_name: string };
}

export const LeaveRequestManager = () => {
  const { user, isAdmin } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, isAdmin]);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // If not admin, teachers can only see their students' requests
      if (!isAdmin) {
        // Get class students first
        const { data: classes } = await supabase
          .from('classes')
          .select('id')
          .eq('teacher_id', user?.id);

        if (classes && classes.length > 0) {
          const classIds = classes.map(c => c.id);
          const { data: students } = await supabase
            .from('class_students')
            .select('student_id')
            .in('class_id', classIds);

          if (students && students.length > 0) {
            const studentIds = students.map(s => s.student_id);
            query = query.in('user_id', studentIds);
          } else {
            setRequests([]);
            setLoading(false);
            return;
          }
        } else {
          setRequests([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles for each request
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (req) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', req.user_id)
            .single();
          return { ...req, profiles: profile || { full_name: 'N/A' } };
        })
      );

      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReviewDialog = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setReviewNotes(request.reviewer_notes || '');
    setIsDialogOpen(true);
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status,
          reviewer_notes: reviewNotes || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Send notification to user
      await supabase.from('notifications').insert({
        user_id: selectedRequest.user_id,
        title: status === 'approved' ? 'Yêu cầu đã được duyệt' : 'Yêu cầu bị từ chối',
        message: `Yêu cầu ${selectedRequest.request_type === 'leave' ? 'nghỉ phép' : 'dời lịch'} của bạn đã ${status === 'approved' ? 'được duyệt' : 'bị từ chối'}.${reviewNotes ? ` Ghi chú: ${reviewNotes}` : ''}`,
        type: status === 'approved' ? 'success' : 'warning',
        link: '/learn/zoom',
      });

      toast.success(status === 'approved' ? 'Đã duyệt yêu cầu' : 'Đã từ chối yêu cầu');
      setIsDialogOpen(false);
      fetchRequests();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">Chờ duyệt</Badge>;
      case 'approved':
        return <Badge className="bg-primary text-primary-foreground">Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Từ chối</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Duyệt yêu cầu nghỉ/dời lịch</h2>
        <p className="text-muted-foreground">Xem và phê duyệt các yêu cầu từ học viên</p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Không có yêu cầu nào</h3>
            <p className="text-muted-foreground">
              Các yêu cầu xin nghỉ/dời lịch sẽ hiển thị ở đây
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{request.profiles?.full_name}</span>
                      <Badge variant="outline">
                        {request.request_type === 'leave' ? 'Xin nghỉ' : 'Dời lịch'}
                      </Badge>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(request.start_date), 'dd/MM/yyyy')} - {format(new Date(request.end_date), 'dd/MM/yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm bg-muted/50 p-2 rounded-lg">{request.reason}</p>

                    {request.reviewer_notes && (
                      <p className="text-sm text-muted-foreground italic">
                        Ghi chú: {request.reviewer_notes}
                      </p>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <Button variant="outline" onClick={() => openReviewDialog(request)}>
                      Xem xét
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xem xét yêu cầu</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">{selectedRequest.profiles?.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.request_type === 'leave' ? 'Xin nghỉ' : 'Dời lịch'}:{' '}
                  {format(new Date(selectedRequest.start_date), 'dd/MM/yyyy')} - {format(new Date(selectedRequest.end_date), 'dd/MM/yyyy')}
                </p>
                <p className="text-sm mt-2">{selectedRequest.reason}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Ghi chú (tùy chọn)</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Nhập ghi chú cho học viên..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => handleReview('rejected')}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
              Từ chối
            </Button>
            <Button
              onClick={() => handleReview('approved')}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              Duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, Clock, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface LeaveRequest {
  id: string;
  request_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  reviewer_notes: string | null;
  created_at: string;
}

interface LeaveRequestListProps {
  refreshKey?: number;
}

export const LeaveRequestList = ({ refreshKey }: LeaveRequestListProps) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, refreshKey]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', id)
        .eq('status', 'pending');

      if (error) throw error;

      setRequests(prev => prev.filter(r => r.id !== id));
      toast.success('Đã hủy yêu cầu');
    } catch (error: any) {
      toast.error('Không thể hủy yêu cầu');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">Chờ duyệt</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Từ chối</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Chưa có yêu cầu nào</h3>
          <p className="text-muted-foreground">
            Tạo yêu cầu xin nghỉ hoặc dời lịch để bắt đầu
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
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
                  <div className={`text-sm p-2 rounded-lg ${request.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <span className="font-medium">Ghi chú từ quản lý: </span>
                    {request.reviewer_notes}
                  </div>
                )}
              </div>

              {request.status === 'pending' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hủy yêu cầu?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn có chắc muốn hủy yêu cầu {request.request_type === 'leave' ? 'nghỉ phép' : 'dời lịch'} này?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Không</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(request.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Hủy yêu cầu
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

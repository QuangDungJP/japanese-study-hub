import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, Check, X, Clock, Eye, DollarSign, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Order {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string | null;
  bank_transfer_proof: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  courses?: {
    title: string;
    title_vi: string;
  };
  profiles?: {
    full_name: string;
    email?: string;
  };
}

interface OrderStats {
  total: number;
  pending: number;
  completed: number;
  revenue: number;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrderStats>({ total: 0, pending: 0, completed: 0, revenue: 0 });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          courses:course_id (title, title_vi)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('payment_status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch profiles separately
      const ordersWithProfiles = await Promise.all(
        (data || []).map(async (order) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', order.user_id)
            .single();
          
          return {
            ...order,
            profiles: profileData || { full_name: 'N/A' }
          } as Order;
        })
      );

      setOrders(ordersWithProfiles);
      
      // Calculate stats
      setStats({
        total: ordersWithProfiles.length,
        pending: ordersWithProfiles.filter(o => o.payment_status === 'pending').length,
        completed: ordersWithProfiles.filter(o => o.payment_status === 'completed').length,
        revenue: ordersWithProfiles.filter(o => o.payment_status === 'completed').reduce((sum, o) => sum + Number(o.amount), 0)
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách đơn hàng',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: newStatus,
          notes: adminNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // If order is completed, add user to user_courses
      if (newStatus === 'completed') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const { error: enrollError } = await supabase
            .from('user_courses')
            .insert({
              user_id: order.user_id,
              course_id: order.course_id
            });

          if (enrollError && !enrollError.message.includes('duplicate')) {
            console.error('Error enrolling user:', enrollError);
          }

          // Send notification to user
          await supabase.from('notifications').insert({
            user_id: order.user_id,
            title: 'Đơn hàng đã được duyệt',
            message: `Đơn hàng khóa học "${order.courses?.title_vi}" đã được xác nhận. Bạn có thể bắt đầu học ngay!`,
            type: 'success',
            link: '/learn/courses'
          });
        }
      }

      toast({
        title: 'Thành công',
        description: `Đã cập nhật trạng thái đơn hàng thành "${getStatusLabel(newStatus)}"`,
      });

      setIsViewDialogOpen(false);
      setSelectedOrder(null);
      setAdminNotes('');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật đơn hàng',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Chờ duyệt</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><Check className="w-3 h-3 mr-1" />Hoàn thành</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><X className="w-3 h-3 mr-1" />Đã hủy</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">Hoàn tiền</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'refunded': return 'Hoàn tiền';
      default: return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'Chuyển khoản';
      case 'momo': return 'MoMo';
      case 'zalopay': return 'ZaloPay';
      case 'stripe': return 'Thẻ quốc tế';
      default: return method;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const openViewDialog = (order: Order) => {
    setSelectedOrder(order);
    setAdminNotes(order.notes || '');
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý đơn hàng</h1>
          <p className="text-muted-foreground mt-1">Xem và duyệt các đơn hàng mua khóa học</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hoàn thành</p>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-japanese-primary/10">
                <TrendingUp className="w-6 h-6 text-japanese-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Doanh thu</p>
                <p className="text-2xl font-bold text-foreground">{formatPrice(stats.revenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Danh sách đơn hàng</CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
                <SelectItem value="refunded">Hoàn tiền</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Không có đơn hàng nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Khóa học</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {order.profiles?.full_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {order.courses?.title_vi || 'N/A'}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(order.amount)}
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodLabel(order.payment_method)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.payment_status)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(order)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View/Edit Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
                  <p className="font-mono">{selectedOrder.id}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  {getStatusBadge(selectedOrder.payment_status)}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Khách hàng</p>
                  <p className="font-medium">{selectedOrder.profiles?.full_name || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Khóa học</p>
                  <p className="font-medium">{selectedOrder.courses?.title_vi || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Số tiền</p>
                  <p className="font-bold text-lg text-primary">{formatPrice(selectedOrder.amount)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Phương thức thanh toán</p>
                  <p>{getPaymentMethodLabel(selectedOrder.payment_method)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p>{format(new Date(selectedOrder.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Mã giao dịch</p>
                  <p className="font-mono">{selectedOrder.transaction_id || 'Chưa có'}</p>
                </div>
              </div>

              {selectedOrder.bank_transfer_proof && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Ảnh chứng từ</p>
                  <img 
                    src={selectedOrder.bank_transfer_proof} 
                    alt="Bank transfer proof" 
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Ghi chú admin</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Thêm ghi chú cho đơn hàng này..."
                  rows={3}
                />
              </div>

              <DialogFooter className="flex gap-2">
                {selectedOrder.payment_status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Từ chối
                    </Button>
                    <Button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Duyệt đơn
                    </Button>
                  </>
                )}
                {selectedOrder.payment_status === 'completed' && (
                  <Button
                    variant="outline"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'refunded')}
                  >
                    Hoàn tiền
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setIsViewDialogOpen(false)}>
                  Đóng
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;

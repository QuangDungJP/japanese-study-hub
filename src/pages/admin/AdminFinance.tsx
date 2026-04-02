import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subMonths, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Users, ShoppingCart, RefreshCw, ArrowUpRight, ArrowDownRight, Download, RotateCcw } from 'lucide-react';

interface Order {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  courses?: { title_vi: string };
  profiles?: { full_name: string };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminFinance = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [refundDialog, setRefundDialog] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const { toast } = useToast();

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*, courses:course_id (title_vi)')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const withProfiles = await Promise.all(
        (data || []).map(async (order) => {
          const { data: p } = await supabase.from('profiles').select('full_name').eq('user_id', order.user_id).single();
          return { ...order, profiles: p || { full_name: 'N/A' } } as Order;
        })
      );
      setOrders(withProfiles);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    switch (timeRange) {
      case '7days': startDate = subDays(now, 7); break;
      case '30days': startDate = subDays(now, 30); break;
      case '90days': startDate = subDays(now, 90); break;
      case '12months': startDate = subMonths(now, 12); break;
      default: startDate = subDays(now, 30);
    }
    return orders.filter(o => new Date(o.created_at) >= startDate);
  }, [orders, timeRange]);

  const kpi = useMemo(() => {
    const completed = filteredOrders.filter(o => o.payment_status === 'completed');
    const refunded = filteredOrders.filter(o => o.payment_status === 'refunded');
    const totalRevenue = completed.reduce((s, o) => s + Number(o.amount), 0);
    const refundedAmount = refunded.reduce((s, o) => s + Number(o.amount), 0);
    const avgOrderValue = completed.length > 0 ? totalRevenue / completed.length : 0;
    const conversionRate = filteredOrders.length > 0 ? (completed.length / filteredOrders.length) * 100 : 0;
    const uniqueCustomers = new Set(completed.map(o => o.user_id)).size;
    
    // Compare with previous period
    const now = new Date();
    let days = 30;
    switch (timeRange) {
      case '7days': days = 7; break;
      case '90days': days = 90; break;
      case '12months': days = 365; break;
    }
    const prevStart = subDays(now, days * 2);
    const prevEnd = subDays(now, days);
    const prevOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= prevStart && d < prevEnd;
    });
    const prevCompleted = prevOrders.filter(o => o.payment_status === 'completed');
    const prevRevenue = prevCompleted.reduce((s, o) => s + Number(o.amount), 0);
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : totalRevenue > 0 ? 100 : 0;

    return { totalRevenue, refundedAmount, avgOrderValue, conversionRate, uniqueCustomers, revenueGrowth, totalOrders: filteredOrders.length, completedOrders: completed.length, pendingOrders: filteredOrders.filter(o => o.payment_status === 'pending').length };
  }, [filteredOrders, orders, timeRange]);

  const revenueChartData = useMemo(() => {
    const now = new Date();
    const completed = filteredOrders.filter(o => o.payment_status === 'completed');
    
    if (timeRange === '12months') {
      const months = eachMonthOfInterval({ start: subMonths(now, 11), end: now });
      return months.map(month => {
        const monthEnd = endOfMonth(month);
        const monthStart = startOfMonth(month);
        const revenue = completed
          .filter(o => isWithinInterval(new Date(o.created_at), { start: monthStart, end: monthEnd }))
          .reduce((s, o) => s + Number(o.amount), 0);
        return { name: format(month, 'MM/yyyy'), revenue };
      });
    }

    let days = 30;
    if (timeRange === '7days') days = 7;
    if (timeRange === '90days') days = 90;

    const interval = eachDayOfInterval({ start: subDays(now, days - 1), end: now });
    return interval.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const revenue = completed
        .filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === dayStr)
        .reduce((s, o) => s + Number(o.amount), 0);
      return { name: format(day, 'dd/MM'), revenue };
    });
  }, [filteredOrders, timeRange]);

  const courseRevenueData = useMemo(() => {
    const completed = filteredOrders.filter(o => o.payment_status === 'completed');
    const byCourseName: Record<string, number> = {};
    completed.forEach(o => {
      const name = o.courses?.title_vi || 'Khác';
      byCourseName[name] = (byCourseName[name] || 0) + Number(o.amount);
    });
    return Object.entries(byCourseName).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredOrders]);

  const paymentMethodData = useMemo(() => {
    const completed = filteredOrders.filter(o => o.payment_status === 'completed');
    const methods: Record<string, number> = {};
    const labels: Record<string, string> = { bank_transfer: 'Chuyển khoản', momo: 'MoMo', zalopay: 'ZaloPay', stripe: 'Thẻ quốc tế' };
    completed.forEach(o => {
      const label = labels[o.payment_method] || o.payment_method;
      methods[label] = (methods[label] || 0) + Number(o.amount);
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const formatPrice = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const handleRefund = async () => {
    if (!refundDialog) return;
    try {
      const { error } = await supabase.from('orders').update({
        payment_status: 'refunded',
        notes: refundReason || 'Hoàn tiền',
        updated_at: new Date().toISOString(),
      }).eq('id', refundDialog.id);
      if (error) throw error;

      // Remove enrollment
      await supabase.from('user_courses').delete().eq('user_id', refundDialog.user_id).eq('course_id', refundDialog.course_id);

      // Notify user
      await supabase.from('notifications').insert({
        user_id: refundDialog.user_id,
        title: 'Đơn hàng đã được hoàn tiền',
        message: `Đơn hàng "${refundDialog.courses?.title_vi}" đã được hoàn tiền. Lý do: ${refundReason || 'Theo yêu cầu'}`,
        type: 'warning',
      });

      toast({ title: 'Đã hoàn tiền', description: `Đơn hàng ${refundDialog.id.slice(0, 8)} đã được hoàn tiền.` });
      setRefundDialog(null);
      setRefundReason('');
      fetchOrders();
    } catch (e) {
      toast({ title: 'Lỗi', description: 'Không thể hoàn tiền', variant: 'destructive' });
    }
  };

  const refundedOrders = useMemo(() => filteredOrders.filter(o => o.payment_status === 'refunded'), [filteredOrders]);
  const completedEligibleForRefund = useMemo(() => filteredOrders.filter(o => o.payment_status === 'completed'), [filteredOrders]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý tài chính</h1>
          <p className="text-muted-foreground">Theo dõi doanh thu, báo cáo và quản lý hoàn tiền</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 ngày</SelectItem>
              <SelectItem value="30days">30 ngày</SelectItem>
              <SelectItem value="90days">90 ngày</SelectItem>
              <SelectItem value="12months">12 tháng</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchOrders}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-primary/10"><DollarSign className="w-5 h-5 text-primary" /></div>
              {kpi.revenueGrowth >= 0 ? <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs"><ArrowUpRight className="w-3 h-3 mr-0.5" />{kpi.revenueGrowth.toFixed(1)}%</Badge> : <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 text-xs"><ArrowDownRight className="w-3 h-3 mr-0.5" />{Math.abs(kpi.revenueGrowth).toFixed(1)}%</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Tổng doanh thu</p>
            <p className="text-xl font-bold text-foreground">{formatPrice(kpi.totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="p-2.5 rounded-xl bg-accent/10 w-fit"><ShoppingCart className="w-5 h-5 text-accent-foreground" /></div>
            <p className="text-xs text-muted-foreground mt-3">Đơn hoàn thành</p>
            <p className="text-xl font-bold text-foreground">{kpi.completedOrders}/{kpi.totalOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="p-2.5 rounded-xl bg-green-500/10 w-fit"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            <p className="text-xs text-muted-foreground mt-3">Giá trị trung bình</p>
            <p className="text-xl font-bold text-foreground">{formatPrice(kpi.avgOrderValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 w-fit"><Users className="w-5 h-5 text-blue-600" /></div>
            <p className="text-xs text-muted-foreground mt-3">Khách hàng mới</p>
            <p className="text-xl font-bold text-foreground">{kpi.uniqueCustomers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="p-2.5 rounded-xl bg-orange-500/10 w-fit"><TrendingUp className="w-5 h-5 text-orange-600" /></div>
            <p className="text-xs text-muted-foreground mt-3">Tỷ lệ chuyển đổi</p>
            <p className="text-xl font-bold text-foreground">{kpi.conversionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="reports">Báo cáo chi tiết</TabsTrigger>
          <TabsTrigger value="refunds">Hoàn tiền ({refundedOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Biểu đồ doanh thu</CardTitle>
              <CardDescription>Doanh thu theo thời gian</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value: number) => [formatPrice(value), 'Doanh thu']} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Course */}
            <Card>
              <CardHeader>
                <CardTitle>Doanh thu theo khóa học</CardTitle>
              </CardHeader>
              <CardContent>
                {courseRevenueData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={courseRevenueData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis type="category" dataKey="name" width={150} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => [formatPrice(value), 'Doanh thu']} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethodData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
                ) : (
                  <div className="h-[300px] flex items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {paymentMethodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => [formatPrice(value), 'Doanh thu']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo chi tiết đơn hàng</CardTitle>
              <CardDescription>Tổng số: {filteredOrders.length} đơn hàng | Hoàn thành: {kpi.completedOrders} | Chờ duyệt: {kpi.pendingOrders} | Hoàn tiền: {refundedOrders.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Khóa học</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Phương thức</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                      <TableCell>{order.profiles?.full_name || 'N/A'}</TableCell>
                      <TableCell>{order.courses?.title_vi || 'N/A'}</TableCell>
                      <TableCell className="font-semibold">{formatPrice(order.amount)}</TableCell>
                      <TableCell>{order.payment_method === 'bank_transfer' ? 'Chuyển khoản' : order.payment_method}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          order.payment_status === 'completed' ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                          order.payment_status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' :
                          order.payment_status === 'refunded' ? 'bg-purple-500/10 text-purple-600 border-purple-500/30' :
                          'bg-red-500/10 text-red-600 border-red-500/30'
                        }>
                          {order.payment_status === 'completed' ? 'Hoàn thành' : order.payment_status === 'pending' ? 'Chờ duyệt' : order.payment_status === 'refunded' ? 'Hoàn tiền' : 'Đã hủy'}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(order.created_at), 'dd/MM/yyyy', { locale: vi })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredOrders.length === 0 && <p className="text-center py-8 text-muted-foreground">Không có đơn hàng trong khoảng thời gian này</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-6">
          {/* Refund eligible */}
          <Card>
            <CardHeader>
              <CardTitle>Đơn hàng có thể hoàn tiền</CardTitle>
              <CardDescription>Các đơn hàng đã hoàn thành có thể được hoàn tiền</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Khóa học</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedEligibleForRefund.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                      <TableCell>{order.profiles?.full_name || 'N/A'}</TableCell>
                      <TableCell>{order.courses?.title_vi || 'N/A'}</TableCell>
                      <TableCell className="font-semibold">{formatPrice(order.amount)}</TableCell>
                      <TableCell>{format(new Date(order.created_at), 'dd/MM/yyyy', { locale: vi })}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setRefundDialog(order)} className="text-orange-600 hover:text-orange-700">
                          <RotateCcw className="w-3 h-3 mr-1" />Hoàn tiền
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {completedEligibleForRefund.length === 0 && <p className="text-center py-8 text-muted-foreground">Không có đơn hàng nào</p>}
            </CardContent>
          </Card>

          {/* Refund history */}
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử hoàn tiền</CardTitle>
              <CardDescription>Tổng hoàn tiền: {formatPrice(kpi.refundedAmount)}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Khóa học</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead>Ngày</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refundedOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                      <TableCell>{order.profiles?.full_name || 'N/A'}</TableCell>
                      <TableCell>{order.courses?.title_vi || 'N/A'}</TableCell>
                      <TableCell className="font-semibold text-orange-600">{formatPrice(order.amount)}</TableCell>
                      <TableCell>{order.notes || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(order.created_at), 'dd/MM/yyyy', { locale: vi })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {refundedOrders.length === 0 && <p className="text-center py-8 text-muted-foreground">Chưa có hoàn tiền nào</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refund Dialog */}
      <Dialog open={!!refundDialog} onOpenChange={() => { setRefundDialog(null); setRefundReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hoàn tiền</DialogTitle>
          </DialogHeader>
          {refundDialog && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                <p><strong>Khách hàng:</strong> {refundDialog.profiles?.full_name}</p>
                <p><strong>Khóa học:</strong> {refundDialog.courses?.title_vi}</p>
                <p><strong>Số tiền hoàn:</strong> <span className="text-orange-600 font-bold">{formatPrice(refundDialog.amount)}</span></p>
              </div>
              <div>
                <label className="text-sm font-medium">Lý do hoàn tiền</label>
                <Textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Nhập lý do hoàn tiền..." rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialog(null)}>Hủy</Button>
            <Button onClick={handleRefund} className="bg-orange-600 hover:bg-orange-700 text-white">
              <RotateCcw className="w-4 h-4 mr-1" />Xác nhận hoàn tiền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFinance;

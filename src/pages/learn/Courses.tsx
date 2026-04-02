import { useState, useEffect } from 'react';
import { BookOpen, Clock, Star, CheckCircle, ShoppingCart, CreditCard, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  title_vi: string;
  description: string | null;
  description_vi: string | null;
  price: number;
  original_price: number | null;
  thumbnail_url: string | null;
  duration_weeks: number;
  level: string;
  language: string;
  features: unknown[];
}

interface UserCourse {
  course_id: string;
  enrolled_at: string;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'stripe'>('bank_transfer');
  const [processingOrder, setProcessingOrder] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchUserCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCourses(data.map(c => ({
        ...c,
        features: Array.isArray(c.features) ? c.features : []
      })));
    }
    setLoading(false);
  };

  const fetchUserCourses = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_courses')
      .select('course_id, enrolled_at')
      .eq('user_id', user.id);

    if (!error && data) {
      setUserCourses(data);
    }
  };

  const isEnrolled = (courseId: string) => {
    return userCourses.some(uc => uc.course_id === courseId);
  };

  const handlePurchase = async () => {
    if (!selectedCourse || !user) return;

    setProcessingOrder(true);

    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          course_id: selectedCourse.id,
          amount: selectedCourse.price,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'bank_transfer' ? 'pending' : 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Đơn hàng đã được tạo!',
        description: paymentMethod === 'bank_transfer' 
          ? 'Vui lòng chuyển khoản theo thông tin bên dưới.' 
          : 'Đang chuyển đến trang thanh toán...',
      });

      setShowPaymentDialog(false);
      setSelectedCourse(null);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo đơn hàng. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setProcessingOrder(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price * 1000); // Assuming price is in thousands
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      beginner: 'Cơ bản',
      intermediate: 'Trung cấp',
      advanced: 'Nâng cao',
    };
    return labels[level] || level;
  };

  const getLanguageLabel = (language: string) => {
    const labels: Record<string, string> = {
      english: 'Tiếng Anh',
      german: 'Tiếng Đức',
      chinese: 'Tiếng Trung',
    };
    return labels[language] || language;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Khóa học</h1>
        <p className="text-muted-foreground mt-2">
          Khám phá các khóa học chất lượng cao để nâng cao kỹ năng ngôn ngữ của bạn
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Tất cả khóa học</TabsTrigger>
          <TabsTrigger value="my-courses">Khóa học của tôi</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-40 bg-muted rounded-t-lg" />
                  <CardContent className="p-6 space-y-4">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Chưa có khóa học nào
              </h3>
              <p className="text-muted-foreground">
                Các khóa học mới sẽ sớm được cập nhật!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-40 bg-gradient-primary relative">
                    {course.thumbnail_url ? (
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title_vi}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="w-16 h-16 text-primary-foreground/50" />
                      </div>
                    )}
                    {course.original_price && course.original_price > course.price && (
                      <Badge className="absolute top-3 right-3 bg-destructive">
                        -{Math.round((1 - course.price / course.original_price) * 100)}%
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex gap-2 mb-2">
                      <Badge variant="secondary">{getLevelLabel(course.level)}</Badge>
                      <Badge variant="outline">{getLanguageLabel(course.language)}</Badge>
                    </div>
                    <h3 className="font-bold text-lg text-foreground line-clamp-2">
                      {course.title_vi}
                    </h3>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description_vi}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration_weeks} tuần
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(course.price)}
                      </span>
                      {course.original_price && course.original_price > course.price && (
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          {formatPrice(course.original_price)}
                        </span>
                      )}
                    </div>
                    {isEnrolled(course.id) ? (
                      <Button disabled variant="secondary">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Đã đăng ký
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => {
                          setSelectedCourse(course);
                          setShowPaymentDialog(true);
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Mua ngay
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-courses" className="mt-6">
          {userCourses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Bạn chưa đăng ký khóa học nào
              </h3>
              <p className="text-muted-foreground">
                Khám phá các khóa học để bắt đầu học ngay!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses
                .filter((course) => isEnrolled(course.id))
                .map((course) => (
                  <Card key={course.id} className="overflow-hidden">
                    <div className="h-40 bg-gradient-primary relative">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title_vi}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <BookOpen className="w-16 h-16 text-primary-foreground/50" />
                        </div>
                      )}
                      <Badge className="absolute top-3 right-3 bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đã đăng ký
                      </Badge>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg text-foreground mb-2">
                        {course.title_vi}
                      </h3>
                      <Button className="w-full mt-4">
                        Vào học ngay
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thanh toán khóa học</DialogTitle>
          </DialogHeader>
          
          {selectedCourse && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold text-foreground">{selectedCourse.title_vi}</h4>
                <p className="text-2xl font-bold text-primary mt-2">
                  {formatPrice(selectedCourse.price)}
                </p>
              </div>

              <div className="space-y-3">
                <p className="font-medium text-foreground">Chọn phương thức thanh toán:</p>
                
                <button
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`w-full p-4 rounded-lg border-2 flex items-center gap-4 transition-colors ${
                    paymentMethod === 'bank_transfer' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Building className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">Chuyển khoản ngân hàng</p>
                    <p className="text-sm text-muted-foreground">Chuyển khoản trực tiếp qua ngân hàng</p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('stripe')}
                  className={`w-full p-4 rounded-lg border-2 flex items-center gap-4 transition-colors opacity-50 cursor-not-allowed ${
                    paymentMethod === 'stripe' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border'
                  }`}
                  disabled
                >
                  <CreditCard className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">Thẻ tín dụng/ghi nợ</p>
                    <p className="text-sm text-muted-foreground">Sắp ra mắt</p>
                  </div>
                </button>
              </div>

              {paymentMethod === 'bank_transfer' && (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 space-y-2">
                  <p className="font-medium text-foreground">Thông tin chuyển khoản:</p>
                  <p className="text-sm text-muted-foreground">Ngân hàng: Vietcombank</p>
                  <p className="text-sm text-muted-foreground">Số tài khoản: 1234567890</p>
                  <p className="text-sm text-muted-foreground">Chủ tài khoản: LINGUAVIET EDUCATION</p>
                  <p className="text-sm text-muted-foreground">
                    Nội dung: COURSE {selectedCourse.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              )}

              <Button 
                className="w-full" 
                onClick={handlePurchase}
                disabled={processingOrder}
              >
                {processingOrder ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Courses;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Video, 
  Users, 
  Calendar, 
  Clock, 
  MessageCircle, 
  Award,
  Star,
  Globe,
  BookOpen,
  Headphones,
  ChevronRight,
  CheckCircle2,
  Play,
  Plus
} from "lucide-react";
import { BookingForm } from "@/components/booking/BookingForm";
import { MyBookings } from "@/components/booking/MyBookings";

const teachers = [
  {
    id: 1,
    name: "Ms. Sarah Johnson",
    avatar: "👩‍🏫",
    specialty: "IELTS & Business English",
    rating: 4.9,
    students: 1250,
    lessons: 3500,
    languages: ["English", "Vietnamese"],
    available: true,
    price: "300,000₫/giờ",
  },
  {
    id: 2,
    name: "Mr. David Chen",
    avatar: "👨‍🏫",
    specialty: "Conversation & Pronunciation",
    rating: 4.8,
    students: 980,
    lessons: 2800,
    languages: ["English", "Chinese", "Vietnamese"],
    available: true,
    price: "280,000₫/giờ",
  },
  {
    id: 3,
    name: "Ms. Emily Watson",
    avatar: "👩‍💼",
    specialty: "TOEFL & Academic English",
    rating: 4.9,
    students: 850,
    lessons: 2100,
    languages: ["English"],
    available: false,
    price: "350,000₫/giờ",
  },
];

const upcomingClasses = [
  {
    id: 1,
    title: "IELTS Speaking Practice",
    teacher: "Ms. Sarah Johnson",
    date: "Hôm nay",
    time: "19:00 - 20:00",
    type: "1-1",
    status: "upcoming",
  },
  {
    id: 2,
    title: "Business English Vocabulary",
    teacher: "Mr. David Chen",
    date: "Ngày mai",
    time: "20:00 - 21:00",
    type: "group",
    students: 4,
    status: "upcoming",
  },
  {
    id: 3,
    title: "Pronunciation Workshop",
    teacher: "Ms. Emily Watson",
    date: "15/01/2026",
    time: "18:00 - 19:30",
    type: "group",
    students: 6,
    status: "scheduled",
  },
];

const packages = [
  {
    id: 1,
    name: "Starter",
    lessons: 4,
    price: "1,000,000₫",
    originalPrice: "1,200,000₫",
    features: ["4 buổi học 1-1", "Linh hoạt đổi lịch", "Tài liệu học tập"],
    popular: false,
  },
  {
    id: 2,
    name: "Standard",
    lessons: 12,
    price: "2,700,000₫",
    originalPrice: "3,600,000₫",
    features: ["12 buổi học 1-1", "Linh hoạt đổi lịch", "Tài liệu học tập", "Hỗ trợ 24/7", "Đánh giá tiến độ"],
    popular: true,
  },
  {
    id: 3,
    name: "Premium",
    lessons: 24,
    price: "4,800,000₫",
    originalPrice: "7,200,000₫",
    features: ["24 buổi học 1-1", "Linh hoạt đổi lịch", "Tài liệu học tập", "Hỗ trợ 24/7", "Đánh giá tiến độ", "Chứng chỉ hoàn thành"],
    popular: false,
  },
];

const Zoom = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBookingSuccess = () => {
    setBookingDialogOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 p-8 md:p-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">
              <Video className="w-3 h-3 mr-1" />
              Học Online với Zoom
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Kết nối trực tiếp với giáo viên bản ngữ
            </h1>
            <p className="text-muted-foreground text-lg mb-6 max-w-xl">
              Trải nghiệm lớp học trực tuyến chất lượng cao, tương tác trực tiếp như học offline.
              Công nghệ Zoom HD đảm bảo hình ảnh và âm thanh sắc nét.
            </p>
            <div className="flex flex-wrap gap-4">
              <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Đặt lịch học ngay
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Đặt lịch học với giáo viên</DialogTitle>
                  </DialogHeader>
                  <BookingForm onSuccess={handleBookingSuccess} />
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="lg" className="gap-2" onClick={() => setSelectedTab("schedule")}>
                <Calendar className="w-4 h-4" />
                Xem lịch học của tôi
              </Button>
            </div>
          </div>
          
          {/* Zoom Interface Preview */}
          <div className="w-full md:w-96 shrink-0">
            <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-muted-foreground">LinguaViet Class</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>45:23</span>
                </div>
              </div>
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-card mx-auto mb-2 flex items-center justify-center shadow-md">
                    <span className="text-3xl">👩‍🏫</span>
                  </div>
                  <p className="font-medium text-sm text-foreground">Ms. Sarah</p>
                </div>
                <div className="absolute bottom-3 right-3 w-20 h-14 bg-card rounded-lg shadow-md flex items-center justify-center border border-border">
                  <span className="text-xl">🧑‍🎓</span>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center justify-center gap-3 bg-muted/30">
                <button className="w-9 h-9 rounded-full bg-card shadow flex items-center justify-center hover:bg-muted transition-colors">
                  <Video className="w-4 h-4" />
                </button>
                <button className="w-9 h-9 rounded-full bg-card shadow flex items-center justify-center hover:bg-muted transition-colors">
                  <Headphones className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-full bg-destructive shadow flex items-center justify-center hover:bg-destructive/90 transition-colors">
                  <Video className="w-4 h-4 text-destructive-foreground" />
                </button>
                <button className="w-9 h-9 rounded-full bg-card shadow flex items-center justify-center hover:bg-muted transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button className="w-9 h-9 rounded-full bg-card shadow flex items-center justify-center hover:bg-muted transition-colors">
                  <Users className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="teachers">Giáo viên</TabsTrigger>
          <TabsTrigger value="schedule">Lịch học</TabsTrigger>
          <TabsTrigger value="packages">Gói học</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Video, title: "Lớp học 1-1", desc: "Học riêng với giáo viên, tập trung điểm yếu" },
              { icon: Users, title: "Lớp nhóm nhỏ", desc: "Tối đa 6 học viên, tương tác hiệu quả" },
              { icon: Calendar, title: "Lịch linh hoạt", desc: "Đặt lịch theo thời gian phù hợp" },
              { icon: Clock, title: "24/7 Support", desc: "Hỗ trợ kỹ thuật và học thuật mọi lúc" },
              { icon: MessageCircle, title: "Chat với giáo viên", desc: "Nhắn tin hỏi bài ngoài giờ học" },
              { icon: Award, title: "Giáo viên chứng chỉ", desc: "100% có chứng chỉ giảng dạy quốc tế" },
            ].map((feature) => (
              <Card key={feature.title} className="group hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Giáo viên", value: "50+", icon: Users },
              { label: "Học viên", value: "10,000+", icon: BookOpen },
              { label: "Buổi học", value: "100,000+", icon: Video },
              { label: "Đánh giá", value: "4.9/5", icon: Star },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-5 text-center">
                  <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher) => (
              <Card key={teacher.id} className="group hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl">
                      {teacher.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{teacher.name}</h3>
                        {teacher.available && (
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{teacher.specialty}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{teacher.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{teacher.students}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Video className="w-4 h-4" />
                      <span>{teacher.lessons}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {teacher.languages.map((lang) => (
                      <Badge key={lang} variant="secondary" className="text-xs">
                        <Globe className="w-3 h-3 mr-1" />
                        {lang}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary">{teacher.price}</span>
                    <Button size="sm" disabled={!teacher.available}>
                      {teacher.available ? "Đặt lịch" : "Hết lịch"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          {/* Booking Form Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Lịch học của tôi
              </CardTitle>
              <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Đặt lịch mới
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Đặt lịch học với giáo viên</DialogTitle>
                  </DialogHeader>
                  <BookingForm onSuccess={handleBookingSuccess} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <MyBookings key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card 
                key={pkg.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  pkg.popular ? "border-primary shadow-md" : ""
                }`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                    Phổ biến
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">{pkg.name}</h3>
                  <p className="text-muted-foreground mb-4">{pkg.lessons} buổi học</p>
                  
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-primary">{pkg.price}</span>
                    <span className="text-muted-foreground line-through ml-2">{pkg.originalPrice}</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full" 
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    Chọn gói này
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Zoom;

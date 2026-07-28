import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatWithJST, formatTimeWithJST } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
  CheckCircle2,
  Play,
  Plus,
  Radio,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  ChevronRight
} from "lucide-react";
import { BookingForm } from "@/components/booking/BookingForm";
import { MyBookings } from "@/components/booking/MyBookings";
import { Link } from "react-router-dom";

interface Teacher {
  id: string;
  user_id: string;
  name: string;
  role: string;
  avatar_url: string;
  video_url: string;
  bio: string;
  specializations: string[];
  certifications: string[];
  experience_years: number;
  rating: number;
  total_reviews: number;
  languages: string[];
  available: boolean;
  price_per_hour: string;
}

interface UpcomingSession {
  id: string;
  title: string;
  teacher_name: string;
  date: string;
  time: string;
  meet_link: string | null;
  type: string;
  notes: string | null;
}

interface CoursePackage {
  id: string;
  title: string;
  title_vi: string;
  price: number;
  original_price: number | null;
  duration_weeks: number | null;
  level: string;
  features: string[];
  slug: string | null;
}

const Zoom = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedTeacherForBooking, setSelectedTeacherForBooking] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Database States
  const [loading, setLoading] = useState(true);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [coursesList, setCoursesList] = useState<CoursePackage[]>([]);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalSessions: 0,
    averageRating: 4.9,
  });
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Fetch real data from Supabase
  const fetchRealData = async () => {
    try {
      setLoading(true);

      // 1. Fetch real teacher profiles
      const { data: tpData } = await supabase
        .from("teacher_profiles")
        .select("*")
        .eq("is_available", true)
        .order("order_index", { ascending: true });

      const teacherUserIds = (tpData || []).map((t) => t.user_id).filter(Boolean);
      const profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      
      if (teacherUserIds.length > 0) {
        const { data: profData } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", teacherUserIds);
        
        (profData || []).forEach((p) => {
          if (p.user_id) {
            profileMap[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
          }
        });
      }

      const mappedTeachers: Teacher[] = (tpData || []).map((t: any) => {
        const prof = profileMap[t.user_id] || {};
        const specs = Array.isArray(t.specializations) ? t.specializations : [];
        const langs = Array.isArray(t.languages) ? t.languages : ["日本語", "Tiếng Việt"];
        const certs = Array.isArray(t.certifications) ? t.certifications : [];

        return {
          id: t.id,
          user_id: t.user_id,
          name: prof.full_name || t.name || t.display_name || "Giảng viên Nhật ngữ",
          role: t.role || t.bio_vi || "Giảng viên JLPT N1-N2",
          avatar_url: t.avatar_url || prof.avatar_url || t.image_url || "",
          video_url: t.video_url || "",
          bio: t.bio || t.bio_vi || "Giảng viên kinh nghiệm luyện thi JLPT và giao tiếp tiếng Nhật.",
          specializations: specs.length > 0 ? specs : ["Luyện thi JLPT", "Giao tiếp"],
          certifications: certs,
          experience_years: t.experience_years || 3,
          rating: t.rating || 4.9,
          total_reviews: t.total_reviews || 120,
          languages: langs,
          available: t.is_available ?? true,
          price_per_hour: "300.000₫/giờ",
        };
      });

      setTeachersList(mappedTeachers);

      // 2. Fetch upcoming class sessions & bookings for current student
      const sessionList: UpcomingSession[] = [];

      if (user) {
        // Enrolled classes
        const { data: enrollments } = await supabase
          .from("class_students")
          .select("class_id")
          .eq("student_id", user.id)
          .eq("status", "active");

        if (enrollments && enrollments.length > 0) {
          const classIds = enrollments.map((e) => e.class_id);
          const { data: cSessions } = await supabase
            .from("class_sessions")
            .select("*, classes(name_vi, name)")
            .in("class_id", classIds)
            .order("session_date", { ascending: true })
            .limit(10);

          (cSessions || []).forEach((cs: any) => {
            sessionList.push({
              id: cs.id,
              title: cs.topic || cs.classes?.name_vi || "Buổi học trực tuyến",
              teacher_name: cs.classes?.name || "Giảng viên phụ trách",
              date: cs.session_date,
              time: `${formatTimeWithJST(cs.start_time)}${cs.end_time ? ` - ${formatTimeWithJST(cs.end_time)}` : ""}`,
              meet_link: cs.meet_link,
              type: "Lớp học trực tuyến",
              notes: cs.notes,
            });
          });
        }

        // 1-1 Bookings
        const { data: bData } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("booking_date", { ascending: true })
          .limit(10);

        if (bData && bData.length > 0) {
          const bIds = bData.map((b) => b.id);
          const { data: mData } = await supabase
            .from("meetings")
            .select("*")
            .in("booking_id", bIds);

          const meetingMap = new Map<string, string>();
          (mData || []).forEach((m) => {
            if (m.booking_id && m.meet_link) {
              meetingMap.set(m.booking_id, m.meet_link);
            }
          });

          (bData || []).forEach((b: any) => {
            sessionList.push({
              id: b.id,
              title: `Học 1-1: ${b.teacher_name}`,
              teacher_name: b.teacher_name,
              date: b.booking_date,
              time: formatTimeWithJST(b.booking_time),
              meet_link: meetingMap.get(b.id) || null,
              type: "Lớp 1-1",
              notes: b.notes,
            });
          });
        }
      }

      setUpcomingSessions(sessionList);

      // 3. Fetch real published courses from database
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("level", { ascending: true });

      const mappedCourses: CoursePackage[] = (coursesData || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        title_vi: c.title_vi,
        price: c.price,
        original_price: c.original_price,
        duration_weeks: c.duration_weeks,
        level: c.level,
        features: Array.isArray(c.features) ? c.features : ["Chuẩn JLPT", "Học Online Meeting", "Giảng viên chấm bài 1-1"],
        slug: c.slug,
      }));

      setCoursesList(mappedCourses);

      // 4. Calculate stats
      const { count: teacherCount } = await supabase.from("teacher_profiles").select("*", { count: "exact", head: true });
      const { count: studentCount } = await supabase.from("class_students").select("*", { count: "exact", head: true });
      const { count: sessionCount } = await supabase.from("class_sessions").select("*", { count: "exact", head: true });

      setStats({
        totalTeachers: teacherCount || mappedTeachers.length || 10,
        totalStudents: studentCount || 50,
        totalSessions: sessionCount || 100,
        averageRating: 4.9,
      });

    } catch (err) {
      console.error("Error fetching real Zoom page data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, [user, refreshKey]);

  // Set up Supabase Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel("zoom_page_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "class_sessions" },
        () => { fetchRealData(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => { fetchRealData(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetings" },
        () => { fetchRealData(); }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleBookingSuccess = () => {
    setBookingDialogOpen(false);
    setSelectedTeacherForBooking(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleOpenBooking = (teacherName?: string) => {
    setSelectedTeacherForBooking(teacherName || null);
    setBookingDialogOpen(true);
  };

  // Find next immediate session with a meet link
  const activeNextSession = upcomingSessions.find((s) => s.meet_link);

  const formatVND = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-japanese/15 via-primary/10 to-accent/10 p-8 md:p-12 border border-japanese/20 shadow-soft">
        <div className="absolute top-0 right-0 w-96 h-96 bg-japanese/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-japanese text-white border-0 font-bold px-3 py-1 gap-1.5 shadow-sm">
                <Video className="w-3.5 h-3.5" /> Học Online với Meeting HD
              </Badge>
              {isRealtimeConnected ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-xs gap-1 font-semibold">
                  <Radio className="w-3 h-3 text-green-500 animate-pulse" /> Realtime Live
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Đang đồng bộ DB...
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
              Lớp học tiếng Nhật trực tuyến tương tác cao
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
              Học 1-1 hoặc theo lớp nhóm cùng Giảng viên bản ngữ & Việt Nam giàu kinh nghiệm qua Google Meet / Zoom HD sắc nét.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="japanese" className="gap-2 font-bold shadow-md">
                    <Plus className="w-4.5 h-4.5" />
                    Đặt lịch học ngay
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Đặt lịch học với giảng viên</DialogTitle>
                  </DialogHeader>
                  <BookingForm onSuccess={handleBookingSuccess} initialTeacher={selectedTeacherForBooking || undefined} />
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="lg" className="gap-2 font-semibold" onClick={() => setSelectedTab("schedule")}>
                <Calendar className="w-4.5 h-4.5 text-primary" />
                Lịch học của tôi ({upcomingSessions.length})
              </Button>
            </div>
          </div>

          {/* Active Next Meeting Session Quick Join Box */}
          <div className="w-full md:w-96 shrink-0">
            {activeNextSession ? (
              <div className="bg-card rounded-2xl p-6 border-2 border-green-500/40 shadow-card-hover space-y-4 relative overflow-hidden bg-gradient-to-br from-green-500/5 via-card to-card">
                <div className="flex justify-between items-center">
                  <Badge className="bg-green-500 text-white font-bold gap-1 text-xs animate-pulse">
                    <Radio className="w-3 h-3" /> Buổi học sẵn sàng
                  </Badge>
                  <span className="text-xs text-muted-foreground font-semibold">{activeNextSession.type}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground line-clamp-1">{activeNextSession.title}</h3>
                  <p className="text-xs text-muted-foreground">GV: {activeNextSession.teacher_name}</p>
                  <div className="flex items-center gap-3 text-xs font-semibold text-primary mt-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatWithJST(activeNextSession.date, false)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {activeNextSession.time}</span>
                  </div>
                </div>
                <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold gap-2 shadow-md" asChild>
                  <a href={activeNextSession.meet_link} target="_blank" rel="noopener noreferrer">
                    <Video className="w-5 h-5" /> Vào phòng Meeting ngay
                  </a>
                </Button>
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-6 border border-border shadow-md space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center font-bold">
                  <Video className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Phòng học Online HD</h3>
                  <p className="text-xs text-muted-foreground mt-1">Kết nối âm thanh và hình ảnh trực tiếp với giảng viên</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenBooking()} className="w-full font-bold">
                  <Plus className="w-4 h-4 mr-1" /> Đặt lịch mới
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-2xl w-full md:w-auto grid grid-cols-4">
          <TabsTrigger value="overview" className="rounded-xl text-xs md:text-sm font-semibold">Tổng quan</TabsTrigger>
          <TabsTrigger value="teachers" className="rounded-xl text-xs md:text-sm font-semibold">Giảng viên ({teachersList.length})</TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-xl text-xs md:text-sm font-semibold">Lịch học</TabsTrigger>
          <TabsTrigger value="packages" className="rounded-xl text-xs md:text-sm font-semibold">Khóa học ({coursesList.length})</TabsTrigger>
        </TabsList>

        {/* 1. Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Giảng viên Nhật ngữ", value: `${stats.totalTeachers}+`, icon: Users },
              { label: "Học viên đăng ký", value: `${stats.totalStudents}+`, icon: BookOpen },
              { label: "Buổi học đã diễn ra", value: `${stats.totalSessions}+`, icon: Video },
              { label: "Đánh giá hài lòng", value: `${stats.averageRating}/5⭐`, icon: Star },
            ].map((stat) => (
              <Card key={stat.label} className="border shadow-soft">
                <CardContent className="p-5 text-center">
                  <stat.icon className="w-7 h-7 text-japanese mx-auto mb-2 opacity-90" />
                  <p className="text-2xl md:text-3xl font-extrabold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Video, title: "Lớp 1-1 Chuyên sâu", desc: "Học riêng với giảng viên, sửa phát âm và ngữ pháp cá nhân hóa" },
              { icon: Users, title: "Lớp học nhóm tương tác", desc: "Tối đa 8 học viên, thực hành nói tiếng Nhật theo phản xạ" },
              { icon: Calendar, title: "Lịch học linh hoạt", desc: "Đồng bộ realtime dữ liệu lịch học từ hệ thống trung tâm" },
              { icon: Headphones, title: "Hỗ trợ kỹ thuật 24/7", desc: "Hỗ trợ kết nối Google Meet / Zoom và giải đáp thắc mắc bài học" },
              { icon: MessageCircle, title: "Tương tác trực tiếp", desc: "Trao đổi với giảng viên và nhận bài nhận xét sau mỗi buổi học" },
              { icon: Award, title: "Đạt chuẩn JLPT N5 → N1", desc: "Lộ trình học bài bản kết hợp thực hành và bài kiểm tra hàng tuần" },
            ].map((feature) => (
              <Card key={feature.title} className="group hover:shadow-card-hover transition-all duration-300 border">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-japanese/10 flex items-center justify-center shrink-0 group-hover:bg-japanese/20 transition-colors">
                    <feature.icon className="w-5 h-5 text-japanese" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Featured Teachers Quick Showcase */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-japanese" /> Giảng viên nổi bật
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTab("teachers")} className="text-xs font-bold gap-1 text-japanese">
                Xem tất cả ({teachersList.length}) <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {teachersList.slice(0, 3).map((teacher) => (
                  <Card key={teacher.id} className="hover:shadow-card-hover transition-all duration-300 border flex flex-col justify-between">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted border overflow-hidden shrink-0">
                          {teacher.avatar_url ? (
                            <img src={teacher.avatar_url} alt={teacher.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">👩‍🏫</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-foreground truncate">{teacher.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{teacher.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 text-yellow-600 font-bold">
                          <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" /> {teacher.rating}
                        </span>
                        <span>• {teacher.experience_years} năm kinh nghiệm</span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {teacher.specializations.slice(0, 2).map((spec, sIdx) => (
                          <Badge key={sIdx} variant="secondary" className="text-[10px]">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>

                    <div className="p-4 bg-muted/20 border-t flex justify-end">
                      <Button size="sm" variant="japanese" onClick={() => handleOpenBooking(teacher.name)} className="text-xs font-bold">
                        Đặt lịch học
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 2. Teachers Tab (Real Data) */}
        <TabsContent value="teachers" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : teachersList.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                Đang cập nhật danh sách giảng viên...
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teachersList.map((teacher) => (
                <Card key={teacher.id} className="group hover:shadow-card-hover transition-all duration-300 border flex flex-col justify-between">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-muted border-2 border-primary/20 overflow-hidden shrink-0 shadow-sm">
                        {teacher.avatar_url ? (
                          <img src={teacher.avatar_url} alt={teacher.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">👩‍🏫</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-base text-foreground truncate">{teacher.name}</h3>
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" title="Đang mở lịch" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{teacher.role}</p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 italic bg-muted/30 p-2.5 rounded-xl border">
                      "{teacher.bio}"
                    </p>

                    <div className="flex items-center gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1 text-yellow-600 font-bold">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>{teacher.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Award className="w-4 h-4 text-primary" />
                        <span>{teacher.experience_years} năm kinh nghiệm</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Chuyên môn</p>
                      <div className="flex flex-wrap gap-1">
                        {teacher.specializations.map((spec, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>

                  <div className="p-4 bg-muted/30 border-t flex items-center justify-between gap-2">
                    <span className="font-extrabold text-sm text-japanese">{teacher.price_per_hour}</span>
                    <Button size="sm" variant="japanese" onClick={() => handleOpenBooking(teacher.name)} className="font-bold">
                      Đặt lịch 1-1
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 3. Schedule Tab (Realtime DB) */}
        <TabsContent value="schedule" className="space-y-6">
          <Card className="border shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-japanese" />
                  Lịch học trực tuyến của tôi
                </CardTitle>
                <CardDescription>Danh sách các buổi học 1-1 và lớp học trực tuyến được cập nhật Realtime</CardDescription>
              </div>

              <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="japanese" className="gap-1.5 font-bold">
                    <Plus className="w-4 h-4" /> Đặt lịch mới
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Đặt lịch học với giảng viên</DialogTitle>
                  </DialogHeader>
                  <BookingForm onSuccess={handleBookingSuccess} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-6">
              <MyBookings key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Packages / Courses Tab (Real Database Data) */}
        <TabsContent value="packages" className="space-y-4">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Các khóa học & Lộ trình tiếng Nhật</h2>
            <p className="text-sm text-muted-foreground">Đăng ký khóa học để tham gia các lớp trực tuyến tương tác qua Meeting</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {coursesList.map((course) => (
                <Card 
                  key={course.id} 
                  className="relative overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 border flex flex-col justify-between"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <Badge variant="hero" className="font-bold">
                        JLPT {course.level}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-semibold">{course.duration_weeks || 12} tuần học</span>
                    </div>

                    <div>
                      <h3 className="text-xl font-extrabold text-foreground mb-1">{course.title_vi}</h3>
                      <p className="text-xs text-muted-foreground">{course.title}</p>
                    </div>

                    <div className="py-2 border-y border-border">
                      <span className="text-2xl font-extrabold text-foreground">{formatVND(course.price)}</span>
                      {course.original_price && course.original_price > course.price && (
                        <span className="text-xs text-muted-foreground line-through ml-2">{formatVND(course.original_price)}</span>
                      )}
                    </div>

                    <ul className="space-y-2">
                      {course.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2 text-xs text-foreground">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <div className="p-4 bg-muted/20 border-t">
                    <Button className="w-full font-bold" variant="japanese" asChild>
                      <Link to={`/khoa-hoc/${course.slug || course.id}`}>
                        Chi tiết khóa học <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Zoom;

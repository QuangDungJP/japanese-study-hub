import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LearningProvider } from "@/contexts/LearningContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import About from "./pages/About";
import CoursesPage from "./pages/CoursesPage";
import TeachersPage from "./pages/TeachersPage";
import ZoomPage from "./pages/ZoomPage";
import Contact from "./pages/Contact";
import CourseDetail from "./pages/CourseDetail";
import TeacherDetail from "./pages/TeacherDetail";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import LearningLayout from "./components/learning/LearningLayout";
import Dashboard from "./pages/learn/Dashboard";
import Reading from "./pages/learn/Reading";
import Speaking from "./pages/learn/Speaking";
import Writing from "./pages/learn/Writing";
import Listening from "./pages/learn/Listening";
import Vocabulary from "./pages/learn/Vocabulary";
import Exercises from "./pages/learn/Exercises";
import Zoom from "./pages/learn/Zoom";
import Achievements from "./pages/learn/Achievements";
import Courses from "./pages/learn/Courses";
import StudentCalendar from "./pages/learn/Calendar";
import Settings from "./pages/learn/Settings";
import Profile from "./pages/learn/Profile";
import MyClasses from "./pages/learn/MyClasses";
import StudentClassDetail from "./pages/learn/StudentClassDetail";
import Lessons from "./pages/learn/Lessons";
import LessonViewer from "./pages/learn/LessonViewer";
import Exams from "./pages/learn/Exams";
import ExamRunner from "./pages/learn/ExamRunner";
import StudentNotifications from "./pages/learn/StudentNotifications";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminLessons from "./pages/admin/AdminLessons";
import AdminVocabulary from "./pages/admin/AdminVocabulary";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminWebsiteCMS from "./pages/admin/AdminWebsiteCMS";
import AdminBadges from "./pages/admin/AdminBadges";
import AdminStore from "./pages/admin/AdminStore";
import StorePage, { StoreContent } from "./pages/store/StorePage";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminContactForm from "./pages/admin/AdminContactForm";
import AdminFAQ from "./pages/admin/AdminFAQ";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminTeachers from "./pages/admin/AdminTeachers";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import TeacherLayout from "./pages/teacher/TeacherLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherLessons from "./pages/teacher/TeacherLessons";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherSubmissions from "./pages/teacher/TeacherSubmissions";
import TeacherZoom from "./pages/teacher/TeacherZoom";
import TeacherNotifications from "./pages/teacher/TeacherNotifications";
import TeacherBugReports from "./pages/teacher/TeacherBugReports";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import TeacherCalendar from "./pages/teacher/TeacherCalendar";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import UserGuide from "./pages/UserGuide";

import StudentGuide from "./pages/learn/StudentGuide";
import TeacherGuide from "./pages/teacher/TeacherGuide";
import AdminGuide from "./pages/admin/AdminGuide";

import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetail";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminPopups from "./pages/admin/AdminPopups";
import ScrollToTop from "./components/ScrollToTop";
import MeetingRoom from "./pages/meeting/MeetingRoom";

import BackgroundMusicPlayer from "./components/shared/BackgroundMusicPlayer";
import PromotionalPopupModal from "./components/shared/PromotionalPopupModal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <LearningProvider>
            <Toaster />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/gioi-thieu" element={<About />} />
                <Route path="/khoa-hoc" element={<CoursesPage />} />
                <Route path="/giao-vien" element={<TeachersPage />} />

                <Route path="/meeting" element={<ZoomPage />} />
                <Route path="/zoom" element={<ZoomPage />} />
                <Route path="/lien-he" element={<Contact />} />
                <Route path="/khoa-hoc/:slug" element={<CourseDetail />} />
              <Route path="/giao-vien/:slug" element={<TeacherDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/chinh-sach-bao-mat" element={<PrivacyPolicy />} />
              <Route path="/dieu-khoan" element={<Terms />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogDetail />} />
              <Route path="/su-kien" element={<EventsPage />} />
              <Route path="/su-kien/:slug" element={<EventDetailPage />} />
              <Route path="/phong-hoc" element={<MeetingRoom />} />
              <Route path="/learn" element={<LearningLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="my-classes" element={<MyClasses />} />
                <Route path="my-classes/:id" element={<StudentClassDetail />} />
                <Route path="lessons" element={<Lessons />} />
                <Route path="lessons/:id" element={<LessonViewer />} />
                <Route path="exams" element={<Exams />} />
                <Route path="exams/:id" element={<ExamRunner />} />
                <Route path="reading" element={<Reading />} />
                <Route path="speaking" element={<Speaking />} />
                <Route path="writing" element={<Writing />} />
                <Route path="listening" element={<Listening />} />
                <Route path="vocabulary" element={<Vocabulary />} />
                <Route path="exercises" element={<Exercises />} />
                <Route path="meeting" element={<Zoom />} />
                <Route path="zoom" element={<Zoom />} />
                <Route path="calendar" element={<StudentCalendar />} />
                <Route path="achievements" element={<Achievements />} />
                <Route path="store" element={<StoreContent />} />
                <Route path="courses" element={<Courses />} />
                <Route path="guide" element={<StudentGuide />} />
                <Route path="notifications" element={<StudentNotifications />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
              </Route>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="website" element={<AdminWebsiteCMS />} />
                <Route path="popups" element={<AdminPopups />} />
                <Route path="badges" element={<AdminBadges />} />
                <Route path="store" element={<AdminStore />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="teachers" element={<AdminTeachers />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="classes" element={<TeacherClasses />} />
                <Route path="lessons" element={<AdminLessons />} />
                <Route path="vocabulary" element={<AdminVocabulary />} />
                <Route path="finance" element={<AdminFinance />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="submissions" element={<AdminSubmissions />} />
                <Route path="contact" element={<AdminContactForm />} />
                <Route path="faq" element={<AdminFAQ />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="guide" element={<AdminGuide />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              <Route path="/teacher" element={<TeacherLayout />}>
                <Route index element={<TeacherDashboard />} />
                <Route path="lessons" element={<TeacherLessons />} />
                <Route path="classes" element={<TeacherClasses />} />
                <Route path="submissions" element={<TeacherSubmissions />} />
                <Route path="meeting" element={<TeacherZoom />} />
                <Route path="zoom" element={<TeacherZoom />} />
                <Route path="calendar" element={<TeacherCalendar />} />
                <Route path="attendance" element={<TeacherAttendance />} />
                <Route path="notifications" element={<TeacherNotifications />} />
                <Route path="bug-reports" element={<TeacherBugReports />} />
                <Route path="guide" element={<TeacherGuide />} />
                <Route path="profile" element={<TeacherProfile />} />
                <Route path="store" element={<StoreContent />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <PromotionalPopupModal />
            <BackgroundMusicPlayer />
          </BrowserRouter>
        </LearningProvider>
      </AuthProvider>
    </TooltipProvider>
  </ThemeProvider>
  </QueryClientProvider>
);

export default App;

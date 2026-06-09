import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { LearningProvider } from "@/contexts/LearningContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";

import FloatingChat from "./components/FloatingChat";
import BackToTop from "./components/BackToTop";

const queryClient = new QueryClient();

/* =========================
   PUBLIC PAGES
========================= */

const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const TeachersPage = lazy(() => import("./pages/TeachersPage"));
const Contact = lazy(() => import("./pages/Contact"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const TeacherDetail = lazy(() => import("./pages/TeacherDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const UserGuide = lazy(() => import("./pages/UserGuide"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetail"));

/* =========================
   STUDENT
========================= */

const LearningLayout = lazy(() => import("./components/learning/LearningLayout"));

const Dashboard = lazy(() => import("./pages/learn/Dashboard"));
const Reading = lazy(() => import("./pages/learn/Reading"));
const Speaking = lazy(() => import("./pages/learn/Speaking"));
const Writing = lazy(() => import("./pages/learn/Writing"));
const Listening = lazy(() => import("./pages/learn/Listening"));
const Vocabulary = lazy(() => import("./pages/learn/Vocabulary"));
const Exercises = lazy(() => import("./pages/learn/Exercises"));
const Zoom = lazy(() => import("./pages/learn/Zoom"));
const Achievements = lazy(() => import("./pages/learn/Achievements"));
const Courses = lazy(() => import("./pages/learn/Courses"));
const StudentCalendar = lazy(() => import("./pages/learn/Calendar"));
const Settings = lazy(() => import("./pages/learn/Settings"));
const Profile = lazy(() => import("./pages/learn/Profile"));
const MyClasses = lazy(() => import("./pages/learn/MyClasses"));
const StudentClassDetail = lazy(() => import("./pages/learn/StudentClassDetail"));
const ExamRunner = lazy(() => import("./pages/learn/ExamRunner"));

/* =========================
   ADMIN
========================= */

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCourses = lazy(() => import("./pages/admin/AdminCourses"));
const AdminLessons = lazy(() => import("./pages/admin/AdminLessons"));
const AdminVocabulary = lazy(() => import("./pages/admin/AdminVocabulary"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSubmissions = lazy(() => import("./pages/admin/AdminSubmissions"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminWebsiteCMS = lazy(() => import("./pages/admin/AdminWebsiteCMS"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminContactForm = lazy(() => import("./pages/admin/AdminContactForm"));
const AdminFAQ = lazy(() => import("./pages/admin/AdminFAQ"));
const AdminFinance = lazy(() => import("./pages/admin/AdminFinance"));
const AdminTeachers = lazy(() => import("./pages/admin/AdminTeachers"));
const AdminClasses = lazy(() => import("./pages/admin/AdminClasses"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));

/* =========================
   TEACHER
========================= */

const TeacherLayout = lazy(() => import("./pages/teacher/TeacherLayout"));
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const TeacherLessons = lazy(() => import("./pages/teacher/TeacherLessons"));
const TeacherClasses = lazy(() => import("./pages/teacher/TeacherClasses"));
const TeacherClassDetail = lazy(() => import("./pages/teacher/TeacherClassDetail"));
const TeacherSubmissions = lazy(() => import("./pages/teacher/TeacherSubmissions"));
const TeacherZoom = lazy(() => import("./pages/teacher/TeacherZoom"));
const TeacherNotifications = lazy(() => import("./pages/teacher/TeacherNotifications"));
const TeacherBugReports = lazy(() => import("./pages/teacher/TeacherBugReports"));
const TeacherProfile = lazy(() => import("./pages/teacher/TeacherProfile"));
const TeacherCalendar = lazy(() => import("./pages/teacher/TeacherCalendar"));
const TeacherAttendance = lazy(() => import("./pages/teacher/TeacherAttendance"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center text-muted-foreground">
    Loading...
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <LearningProvider>
              <Toaster />
              <Sonner />

              <BrowserRouter>
              
                <FloatingChat />
                <BackToTop />

                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* PUBLIC */}
                    <Route path="/" element={<Index />} />
                    <Route path="/gioi-thieu" element={<About />} />
                    <Route path="/khoa-hoc" element={<CoursesPage />} />
                    <Route path="/khoa-hoc/:slug" element={<CourseDetail />} />
                    <Route path="/giao-vien" element={<TeachersPage />} />
                    <Route path="/giao-vien/:slug" element={<TeacherDetail />} />
                    <Route path="/lien-he" element={<Contact />} />

                    <Route path="/auth" element={<Auth />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogDetail />} />

                    <Route path="/su-kien" element={<EventsPage />} />
                    <Route path="/su-kien/:slug" element={<EventDetailPage />} />

                    <Route path="/huong-dan" element={<UserGuide />} />
                    <Route path="/chinh-sach-bao-mat" element={<PrivacyPolicy />} />
                    <Route path="/dieu-khoan" element={<Terms />} />

                    <Route path="/learn/exams/:id" element={<ExamRunner />} />

                    {/* STUDENT */}
                    <Route path="/learn" element={<LearningLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="reading" element={<Reading />} />
                      <Route path="speaking" element={<Speaking />} />
                      <Route path="writing" element={<Writing />} />
                      <Route path="listening" element={<Listening />} />
                      <Route path="vocabulary" element={<Vocabulary />} />
                      <Route path="exercises" element={<Exercises />} />
                      <Route path="zoom" element={<Zoom />} />
                      <Route path="calendar" element={<StudentCalendar />} />
                      <Route path="achievements" element={<Achievements />} />
                      <Route path="courses" element={<Courses />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="classes" element={<MyClasses />} />
                      <Route path="classes/:id" element={<StudentClassDetail />} />
                    </Route>

                    {/* ADMIN */}
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="website" element={<AdminWebsiteCMS />} />
                      <Route path="blog" element={<AdminBlog />} />
                      <Route path="teachers" element={<AdminTeachers />} />
                      <Route path="courses" element={<AdminCourses />} />
                      <Route path="classes" element={<AdminClasses />} />
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
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>

                    {/* TEACHER */}
                    <Route path="/teacher" element={<TeacherLayout />}>
                      <Route index element={<TeacherDashboard />} />
                      <Route path="lessons" element={<TeacherLessons />} />
                      <Route path="classes" element={<TeacherClasses />} />
                      <Route path="classes/:id" element={<TeacherClassDetail />} />
                      <Route path="submissions" element={<TeacherSubmissions />} />
                      <Route path="zoom" element={<TeacherZoom />} />
                      <Route path="calendar" element={<TeacherCalendar />} />
                      <Route path="attendance" element={<TeacherAttendance />} />
                      <Route path="notifications" element={<TeacherNotifications />} />
                      <Route path="bug-reports" element={<TeacherBugReports />} />
                      <Route path="profile" element={<TeacherProfile />} />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </LearningProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
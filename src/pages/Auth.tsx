import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AuthHeader from "@/components/auth/AuthHeader";
import TeacherBranding from "@/components/auth/TeacherBranding";
import LoginForm from "@/components/auth/LoginForm";
import SignUpForm from "@/components/auth/SignUpForm";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { useTheme } from "@/contexts/ThemeContext";
const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [titles, setTitles] = useState({ login: 'Đăng nhập', signup: 'Đăng ký' });

  useEffect(() => {
    supabase
      .from('website_content')
      .select('content')
      .eq('section_key', 'auth_settings')
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.content && typeof data.content === 'object') {
          const c = data.content as Record<string, string>;
          setTitles({
            login: c.login_title || 'Đăng nhập',
            signup: c.signup_title || 'Đăng ký',
          });
        }
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col transition-colors duration-300">
      <Navbar />
      <AuthHeader />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="xl:col-span-7 space-y-6 lg:space-y-8"
            >
              <div className="text-center xl:text-left">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-4">
                  {isLogin ? titles.login : titles.signup}
                </h1>
                <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto xl:mx-0">
                  {isLogin 
                    ? "Chào mừng trở lại! Đăng nhập để tiếp tục hành trình học tiếng Nhật của bạn."
                    : "Bắt đầu hành trình chinh phục tiếng Nhật ngay hôm nay!"
                  }
                </p>
              </div>
              {isLogin ? (
                <LoginForm onSwitchToSignUp={() => setIsLogin(false)} />
              ) : (
                <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
              )}
            </motion.div>
            <TeacherBranding />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AuthHeader from "@/components/auth/AuthHeader";
import TeacherBranding from "@/components/auth/TeacherBranding";
import LoginForm from "@/components/auth/LoginForm";
import SignUpForm from "@/components/auth/SignUpForm";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
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
    
    <div className="min-h-screen bg-[#FEF9E7] flex flex-col text-[#1A1A1A]">
      <Navbar />
      <AuthHeader />
      <main className="flex-1 flex items-center justify-center px-4 md:px-8 py-10">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-center lg:text-left">
              {isLogin ? titles.login : titles.signup}
            </h1>
            {isLogin ? (
              <LoginForm onSwitchToSignUp={() => setIsLogin(false)} />
            ) : (
              <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
            )}
          </motion.div>
          <TeacherBranding />
        </div>
      </main>
    </div>
  );
};

export default Auth;

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const passwordSchema = z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự');

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const lastSubmit = useRef(0);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Liên kết không hợp lệ. Vui lòng yêu cầu liên kết đặt lại mới.');
        navigate('/forgot-password');
      }
    };
    checkSession();
  }, [navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    try { passwordSchema.parse(password); } catch (err) {
      if (err instanceof z.ZodError) newErrors.password = err.errors[0].message;
    }
    if (password !== confirmPassword) newErrors.confirmPassword = 'Mật khẩu không khớp';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const now = Date.now();
    if (now - lastSubmit.current < 4000) {
      toast.warning('Vui lòng chờ vài giây');
      return;
    }
    lastSubmit.current = now;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        setSuccess(true);
        toast.success('Mật khẩu đã được cập nhật!');
        setTimeout(() => navigate('/learn'), 2000);
      }
    } catch {
      toast.error('Lỗi kết nối mạng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-lg text-center"
        >
          <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-400 dark:from-green-600 dark:to-emerald-600 rounded-full mb-8 shadow-2xl">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
            <CheckCircle className="w-12 h-12 text-white relative z-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-green-700 to-emerald-700 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-4">
            Mật khẩu đã được cập nhật!
          </h1>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-green-200 dark:border-slate-700 mb-8">
            <div className="flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
              <p className="text-lg font-medium text-foreground">
                Tài khoản của bạn đã được bảo vệ
              </p>
            </div>
            <p className="text-muted-foreground">
              Đang chuyển hướng đến trang học tập trong <span className="font-bold text-green-600 dark:text-green-400">2 giây</span>...
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <div className="w-2 h-2 bg-green-400 dark:bg-green-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-emerald-400 dark:bg-emerald-600 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-green-400 dark:bg-green-600 rounded-full animate-pulse delay-150"></div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-lg">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-8 lg:mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 dark:from-amber-600 dark:to-orange-600 rounded-2xl mb-6 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-medium text-amber-800 dark:text-amber-200 italic leading-relaxed mb-4">
            Chào mừng bạn đến với mạng lưới đào tạo Nhật ngữ trực tuyến hàng đầu Việt Nam
          </h2>
          <div className="flex justify-center">
            <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-orange-400 dark:from-amber-600 dark:to-orange-600 rounded-full"></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-4">
              Đặt lại mật khẩu
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground max-w-md mx-auto">
              Tạo mật khẩu mới và mạnh cho tài khoản của bạn
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Mật khẩu mới
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu mới"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-slate-600 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-transparent rounded-xl transition-all duration-200 text-base pr-12 shadow-sm"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 dark:text-red-400 font-medium"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-14 bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-slate-600 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-transparent rounded-xl transition-all duration-200 text-base shadow-sm"
                />
                {errors.confirmPassword && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 dark:text-red-400 font-medium"
                  >
                    {errors.confirmPassword}
                  </motion.p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
                "text-white text-base font-bold py-4 rounded-xl shadow-lg",
                "transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang cập nhật mật khẩu...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Cập nhật mật khẩu</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold hover:text-amber-700 dark:hover:text-amber-300 transition-colors underline-offset-4 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại trang đăng nhập
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;

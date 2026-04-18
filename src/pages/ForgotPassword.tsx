import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle, MailOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const emailSchema = z.string().email('Email không hợp lệ');

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const lastSubmit = useRef(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Rate limiting
    const now = Date.now();
    if (now - lastSubmit.current < 5000) {
      toast.warning('Vui lòng chờ vài giây trước khi thử lại');
      return;
    }
    lastSubmit.current = now;

    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        setSent(true);
        toast.success('Email đã được gửi! Kiểm tra hộp thư của bạn.');
      }
    } catch {
      toast.error('Lỗi kết nối mạng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

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
            <MailOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-medium text-amber-800 dark:text-amber-200 italic leading-relaxed mb-4">
            Chào mừng bạn đến với mạng lưới đào tạo Nhật ngữ trực tuyến hàng đầu Việt Nam
          </h2>
          <div className="flex justify-center">
            <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-orange-400 dark:from-amber-600 dark:to-orange-600 rounded-full"></div>
          </div>
        </motion.div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center"
          >
            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-400 dark:from-green-600 dark:to-emerald-600 rounded-full mb-8 shadow-xl">
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
              <CheckCircle className="w-10 h-10 text-white relative z-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-green-700 to-emerald-700 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-4">
              Kiểm tra email của bạn
            </h1>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-amber-200 dark:border-slate-700 mb-8">
              <p className="text-muted-foreground mb-2">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến:
              </p>
              <div className="bg-amber-50 dark:bg-slate-700 rounded-xl p-4 border border-amber-200 dark:border-slate-600">
                <p className="font-mono text-amber-800 dark:text-amber-200 text-center break-all">{email}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Vui lòng kiểm tra hộp thư và làm theo hướng dẫn để đặt lại mật khẩu.
              </p>
            </div>
            <Link to="/auth">
              <Button className={cn(
                "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
                "text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all duration-200",
                "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              )}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại đăng nhập
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-4">
                Quên mật khẩu?
              </h1>
              <p className="text-base lg:text-lg text-muted-foreground max-w-md mx-auto">
                Đừng lo lắng! Nhập email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu ngay lập tức.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Địa chỉ email
                </label>
                <Input
                  type="email"
                  placeholder="Nhập địa chỉ email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-slate-600 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-transparent rounded-xl transition-all duration-200 text-base text-center shadow-sm"
                />
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 dark:text-red-400 font-medium text-center"
                  >
                    {error}
                  </motion.p>
                )}
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
                    <span>Đang gửi liên kết...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5" />
                    <span>Gửi liên kết đặt lại</span>
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
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

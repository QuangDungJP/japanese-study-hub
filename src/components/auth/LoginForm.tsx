import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthLogic } from '@/hooks/useAuthLogic';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PasswordInput from './PasswordInput';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  onSwitchToSignUp: () => void;
}

const LoginForm = ({ onSwitchToSignUp }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, errors, handleLogin } = useAuthLogic();
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleLogin(email, password);
    if (success) navigate('/learn');
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/learn` },
      });
      if (error) toast.error(error.message);
    } catch {
      toast.error('Không thể đăng nhập bằng Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground uppercase tracking-wide">E-mail</label>
          <Input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập địa chỉ email của bạn"
            className="h-12 bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-slate-600 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-transparent rounded-xl transition-all duration-200 text-base" 
          />
          {errors.email && (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium animate-slide-down">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground uppercase tracking-wide">Mật khẩu</label>
          <PasswordInput 
            value={password} 
            onChange={setPassword} 
            placeholder="Nhập mật khẩu của bạn"
            className="h-12 bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-slate-600 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-transparent rounded-xl transition-all duration-200 text-base" 
          />
          {errors.password && (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium animate-slide-down">{errors.password}</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
          <span className="text-muted-foreground">
            Chưa có tài khoản?{' '}
            <button 
              type="button" 
              onClick={onSwitchToSignUp} 
              className="text-amber-600 dark:text-amber-400 font-bold hover:text-amber-700 dark:hover:text-amber-300 transition-colors underline-offset-4 hover:underline"
            >
              Đăng ký ngay
            </button>
          </span>
          <Link 
            to="/forgot-password" 
            className="text-amber-600 dark:text-amber-400 font-bold hover:text-amber-700 dark:hover:text-amber-300 transition-colors underline-offset-4 hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            type="submit" 
            disabled={loading}
            className={cn(
              "flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
              "text-white text-base font-bold px-8 py-3 rounded-xl shadow-lg",
              "transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </div>
            ) : (
              'Đăng nhập'
            )}
          </Button>

          <Button 
            type="button" 
            variant="outline" 
            disabled={googleLoading} 
            onClick={handleGoogleLogin}
            className={cn(
              "flex-1 sm:flex-none bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-slate-600",
              "hover:bg-amber-50 dark:hover:bg-slate-700 text-foreground font-bold px-6 py-3 rounded-xl",
              "transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Google</span>
              )}
            </div>
          </Button>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;

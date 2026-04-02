import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
});

/* ── floating sakura petal ── */
const Petal = ({ style }: { style: React.CSSProperties }) => (
  <div
    className="absolute pointer-events-none select-none text-sakura/60"
    style={style}
  >
    🌸
  </div>
);

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) navigate('/learn');
  }, [user, navigate]);

  const validateForm = () => {
    try {
      if (isLogin) loginSchema.parse({ email, password });
      else signupSchema.parse({ email, password, fullName });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0] as string] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Lỗi đăng nhập',
            description: error.message.includes('Invalid login credentials')
              ? 'Email hoặc mật khẩu không đúng'
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Đăng nhập thành công!', description: 'おかえりなさい！' });
          navigate('/learn');
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: 'Lỗi đăng ký',
            description: error.message.includes('already registered')
              ? 'Email này đã được sử dụng'
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Đăng ký thành công!', description: 'ようこそ！Chào mừng bạn!' });
          navigate('/learn');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  /* generate random petals */
  const petals = Array.from({ length: 18 }, (_, i) => ({
    fontSize: `${Math.random() * 16 + 12}px`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    opacity: Math.random() * 0.5 + 0.2,
    animation: `float ${6 + Math.random() * 8}s ease-in-out infinite`,
    animationDelay: `${i * 0.4}s`,
    transform: `rotate(${Math.random() * 360}deg)`,
  }));

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-indigo-50 dark:from-background dark:via-background dark:to-background">
      {/* floating petals background */}
      {petals.map((s, i) => (
        <Petal key={i} style={s} />
      ))}

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* sakura gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-sakura/80 via-pink-400/70 to-indigo-500/80" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2080%2080%22%3E%3Ccircle%20cx%3D%2240%22%20cy%3D%2240%22%20r%3D%222%22%20fill%3D%22rgba(255%2C255%2C255%2C0.08)%22/%3E%3C/svg%3E')] bg-repeat" />

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          {/* large torii gate icon */}
          <div className="text-7xl mb-6 drop-shadow-lg">⛩️</div>
          <h1 className="text-5xl font-extrabold mb-3 tracking-tight text-center drop-shadow">
            NihonGo!
          </h1>
          <p className="text-lg opacity-90 text-center max-w-md leading-relaxed font-medium">
            日本語を学ぼう — Hành trình chinh phục tiếng Nhật bắt đầu từ đây
          </p>

          {/* decorative stats */}
          <div className="mt-14 grid grid-cols-3 gap-8">
            {[
              { value: 'N5→N1', label: 'Lộ trình JLPT' },
              { value: '10K+', label: 'Từ vựng' },
              { value: '95%', label: 'Tỷ lệ đỗ' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold drop-shadow">{s.value}</div>
                <div className="text-sm opacity-80 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* bottom wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" className="w-full text-rose-50 dark:text-background">
              <path
                fill="currentColor"
                d="M0,64L60,69.3C120,75,240,85,360,80C480,75,600,53,720,48C840,43,960,53,1080,58.7C1200,64,1320,64,1380,64L1440,64L1440,120L0,120Z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Right panel — Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <span className="text-5xl mb-3">⛩️</span>
            <h1 className="text-2xl font-extrabold text-foreground">NihonGo!</h1>
          </div>

          {/* Glass card */}
          <div className="bg-white/70 dark:bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-border p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">
                {isLogin ? 'おかえり！' : 'はじめまして！'}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {isLogin ? 'Đăng nhập để tiếp tục học' : 'Tạo tài khoản mới để bắt đầu'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Họ và tên"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-white/60 dark:bg-muted/40 border-border/50 focus:border-sakura focus:ring-sakura/30"
                    />
                  </div>
                  {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName}</p>}
                </div>
              )}

              <div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-white/60 dark:bg-muted/40 border-border/50 focus:border-sakura focus:ring-sakura/30"
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl bg-white/60 dark:bg-muted/40 border-border/50 focus:border-sakura focus:ring-sakura/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-sakura to-pink-500 hover:from-sakura/90 hover:to-pink-500/90 text-white font-bold shadow-lg shadow-sakura/25 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  isLogin ? '🌸 Đăng nhập' : '🌸 Đăng ký'
                )}
              </Button>
            </form>

            {isLogin && (
              <div className="mt-4 text-center">
                <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-sakura transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                <button
                  onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
                  className="ml-2 text-sakura font-semibold hover:underline"
                >
                  {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Bằng việc tiếp tục, bạn đồng ý với{' '}
            <Link to="/dieu-khoan" className="underline hover:text-sakura">Điều khoản</Link> và{' '}
            <Link to="/chinh-sach-bao-mat" className="underline hover:text-sakura">Chính sách bảo mật</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;

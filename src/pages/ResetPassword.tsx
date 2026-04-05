import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

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
      <div className="min-h-screen bg-[#FEF9E7] flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#1A1A1A] mb-2">
            Mật khẩu đã được cập nhật!
          </h2>
          <p className="text-gray-700">Đang chuyển hướng đến trang học tập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEF9E7] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-sm md:text-base italic text-gray-700 mb-4">
            Chào mừng bạn đến với mạng lưới đào tạo Nhật ngữ trực tuyến hàng đầu Việt Nam
          </h2>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] text-center mb-2">
          Đặt lại mật khẩu
        </h1>
        <p className="text-gray-700 text-center mb-8">
          Nhập mật khẩu mới cho tài khoản của bạn
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <label className="md:w-32 text-base md:text-lg font-bold shrink-0">Mật khẩu mới</label>
            <div className="flex-1 space-y-1">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu mới"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-white shadow-inner border-none focus-visible:ring-2 focus-visible:ring-blue-600 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <label className="md:w-32 text-base md:text-lg font-bold shrink-0">Xác nhận</label>
            <div className="flex-1 space-y-1">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 bg-white shadow-inner border-none focus-visible:ring-2 focus-visible:ring-blue-600"
              />
              {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white text-lg font-bold py-3 rounded-md shadow-lg transition active:scale-95"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" />Đang cập nhật...</>
            ) : (
              'Cập nhật mật khẩu'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

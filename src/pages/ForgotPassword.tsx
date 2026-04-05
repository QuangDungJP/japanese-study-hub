import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

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
    <div className="min-h-screen bg-[#FEF9E7] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-sm md:text-base italic text-gray-700 mb-4">
            Chào mừng bạn đến với mạng lưới đào tạo Nhật ngữ trực tuyến hàng đầu Việt Nam
          </h2>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#1A1A1A] mb-2">
              Kiểm tra email của bạn
            </h2>
            <p className="text-gray-700 mb-6">
              Chúng tôi đã gửi liên kết đặt lại mật khẩu đến <strong>{email}</strong>
            </p>
            <Link to="/auth">
              <Button className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-md shadow-lg gap-2">
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A1A1A] text-center mb-6">
              Quên mật khẩu?
            </h1>
            <p className="text-gray-700 text-center mb-8">
              Nhập email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <label className="md:w-24 text-base md:text-lg font-bold shrink-0">E-mail</label>
                <div className="flex-1 space-y-1">
                  <Input
                    type="email"
                    placeholder="Nhập e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-white shadow-inner border-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white text-lg font-bold py-3 rounded-md shadow-lg transition active:scale-95"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" />Đang gửi...</>
                ) : (
                  'Gửi liên kết đặt lại'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/auth"
                className="text-blue-700 font-bold hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthLogic } from '@/hooks/useAuthLogic';

interface LoginFormProps {
  onSwitchToSignUp: () => void;
}

const LoginForm = ({ onSwitchToSignUp }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, errors, handleLogin } = useAuthLogic();
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleLogin(email, password);
    if (success) navigate('/learn');
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <label className="md:w-40 text-base md:text-lg font-bold shrink-0">E-mail</label>
        <div className="flex-1 space-y-1">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập e-mail"
            className="h-12 bg-white shadow-inner border-none focus-visible:ring-2 focus-visible:ring-blue-600" />
          {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <label className="md:w-40 text-base md:text-lg font-bold shrink-0">Mật khẩu</label>
        <div className="flex-1 space-y-1">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            className="h-12 bg-white shadow-inner border-none focus-visible:ring-2 focus-visible:ring-blue-600" />
          {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
        </div>
      </div>

      <div className="md:pl-40 pt-4 space-y-4 text-center md:text-left">
        <div className="text-sm md:text-base space-y-2">
          <p>
            Bạn chưa có tài khoản?{' '}
            <button type="button" onClick={onSwitchToSignUp} className="text-blue-700 font-bold hover:underline">
              Đăng ký
            </button>
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <Link to="/forgot-password" className="text-blue-700 font-bold hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
        </div>

        <Button type="submit" disabled={loading}
          className="bg-blue-700 hover:bg-blue-800 text-white text-lg md:text-xl font-bold px-8 py-3 rounded-md shadow-lg transition active:scale-95 w-full sm:w-auto">
          {loading ? <Loader2 className="animate-spin" /> : 'Xác nhận'}
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;

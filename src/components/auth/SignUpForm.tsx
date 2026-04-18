import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthLogic } from '@/hooks/useAuthLogic';
import PasswordInput from './PasswordInput';
import Navbar from "@/components/Navbar";

<Navbar />
interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

const SignUpForm = ({ onSwitchToLogin }: SignUpFormProps) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { loading, errors, handleSignUp } = useAuthLogic();

  const fields = [
    { label: 'Họ tên', value: fullName, onChange: setFullName, key: 'fullName', type: 'text' },
    { label: 'E-mail', value: email, onChange: setEmail, type: 'email', key: 'email' },
    { label: 'SĐT', value: phone, onChange: setPhone, key: 'phone', type: 'text' },
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleSignUp(fullName, email, phone, password, confirmPassword);
    if (success) onSwitchToLogin();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <label className="md:w-40 text-base md:text-lg font-bold shrink-0">{field.label}</label>
          <div className="flex-1 space-y-1">
            <Input type={field.type || 'text'} value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={`Nhập ${field.label.toLowerCase()}`}
              className="h-12 bg-white shadow-inner border-none focus-visible:ring-2 focus-visible:ring-blue-600" />
            {errors[field.key] && <p className="text-sm text-red-600">{errors[field.key]}</p>}
          </div>
        </div>
      ))}

      {/* Password fields with show/hide */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <label className="md:w-40 text-base md:text-lg font-bold shrink-0">Mật khẩu</label>
        <div className="flex-1 space-y-1">
          <PasswordInput value={password} onChange={setPassword} placeholder="Nhập mật khẩu" />
          {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <label className="md:w-40 text-base md:text-lg font-bold shrink-0">Nhập lại mật khẩu</label>
        <div className="flex-1 space-y-1">
          <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Nhập lại mật khẩu" />
          {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
        </div>
      </div>

      <div className="md:pl-40 pt-4 space-y-4 text-center md:text-left">
        <p className="text-sm md:text-base">
          Bạn đã có tài khoản?{' '}
          <button type="button" onClick={onSwitchToLogin} className="text-blue-700 font-bold hover:underline">
            Đăng nhập
          </button>
        </p>

        <Button type="submit" disabled={loading}
          className="bg-blue-700 hover:bg-blue-800 text-white text-lg md:text-xl font-bold px-8 py-3 rounded-md shadow-lg transition active:scale-95 w-full sm:w-auto">
          {loading ? <Loader2 className="animate-spin" /> : 'Xác nhận'}
        </Button>
      </div>
    </form>
  );
};

export default SignUpForm;

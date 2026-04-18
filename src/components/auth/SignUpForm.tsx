import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthLogic } from '@/hooks/useAuthLogic';
import PasswordInput from './PasswordInput';
import { cn } from '@/lib/utils';

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
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-5">
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-semibold text-foreground uppercase tracking-wide">
              {field.label}
            </label>
            <Input 
              type={field.type || 'text'} 
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={`Nhập ${field.label.toLowerCase()}`}
              className="h-12 bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-slate-600 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-transparent rounded-xl transition-all duration-200 text-base" 
            />
            {errors[field.key] && (
              <p className="text-sm text-red-600 dark:text-red-400 font-medium animate-slide-down">{errors[field.key]}</p>
            )}
          </div>
        ))}

        {/* Password fields */}
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

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground uppercase tracking-wide">Nhập lại mật khẩu</label>
          <PasswordInput 
            value={confirmPassword} 
            onChange={setConfirmPassword} 
            placeholder="Xác nhận lại mật khẩu"
            className="h-12 bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-slate-600 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-transparent rounded-xl transition-all duration-200 text-base" 
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium animate-slide-down">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="text-sm text-muted-foreground">
          Đã có tài khoản?{' '}
          <button 
            type="button" 
            onClick={onSwitchToLogin} 
            className="text-amber-600 dark:text-amber-400 font-bold hover:text-amber-700 dark:hover:text-amber-300 transition-colors underline-offset-4 hover:underline"
          >
            Đăng nhập ngay
          </button>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className={cn(
            "w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
            "text-white text-base font-bold px-12 py-3 rounded-xl shadow-lg",
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
            'Tạo tài khoản'
          )}
        </Button>
      </div>
    </form>
  );
};

export default SignUpForm;

import { useState, useRef, useCallback } from 'react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

const signUpSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
});

export function useAuthLogic() {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const lastSubmit = useRef(0);

  const RATE_LIMIT_MS = 4000;

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    if (now - lastSubmit.current < RATE_LIMIT_MS) {
      toast.warning('Vui lòng chờ vài giây trước khi thử lại');
      return false;
    }
    lastSubmit.current = now;
    return true;
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    setErrors({});
    if (!checkRateLimit()) return false;

    const trimmedEmail = email.trim();
    const result = loginSchema.safeParse({ email: trimmedEmail, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => { fieldErrors[e.path[0] as string] = e.message; });
      setErrors(fieldErrors);
      return false;
    }

    setLoading(true);
    try {
      const { error } = await signIn(trimmedEmail, password);
      if (error) {
        const msg = error.message.includes('Invalid login')
          ? 'Email hoặc mật khẩu không đúng'
          : error.message.includes('Email not confirmed')
          ? 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.'
          : error.message || 'Đã có lỗi xảy ra';
        toast.error(msg);
        return false;
      }
      toast.success('Đăng nhập thành công!');
      return true;
    } catch {
      toast.error('Lỗi kết nối mạng. Vui lòng thử lại.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [signIn, checkRateLimit]);

  const handleSignUp = useCallback(async (
    fullName: string, email: string, phone: string, password: string, confirmPassword: string
  ) => {
    setErrors({});
    if (!checkRateLimit()) return false;

    const result = signUpSchema.safeParse({ fullName, email, phone, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => { fieldErrors[e.path[0] as string] = e.message; });
      setErrors(fieldErrors);
      return false;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        const msg = error.message.includes('already registered')
          ? 'Email này đã được đăng ký'
          : error.message || 'Đã có lỗi xảy ra';
        toast.error(msg);
        return false;
      }

      // Send Welcome Email via Resend API
      try {
        const { sendEmailViaResend, buildHTMLNotificationEmail } = await import('@/lib/resendEmailService');
        const htmlWelcome = buildHTMLNotificationEmail({
          title: 'Chào Mừng Bạn Đến Với Quang Dũng Nihongo',
          badgeText: 'CHÀO MỪNG THÀNH VIÊN MỚI',
          recipientName: fullName,
          mainContentHtml: `Chúc mừng bạn đã tạo thành công tài khoản học viên tại <b>Quang Dũng Nihongo</b>! Bạn có thể bắt đầu khám phá các khóa học tiếng Nhật JLPT N5 - N1, tài liệu ôn thi và phòng học meeting trực tuyến ngay hôm nay.`,
          infoItems: [
            { label: 'Họ tên', value: fullName, icon: '👤' },
            { label: 'Email tài khoản', value: email, icon: '📧' },
            { label: 'Số điện thoại', value: phone || 'Chưa cập nhật', icon: '📞' },
            { label: 'Quyền hạn', value: 'Học viên chính thức', icon: '🎓' },
          ],
          actionBtnText: '🚀 VÀO TRANG HỌC NGAY',
          actionBtnUrl: 'https://quangdungnihongo.com/auth',
          footerNote: 'Chúc bạn có một hành trình chinh phục tiếng Nhật hiệu quả và thành công rực rỡ!',
        });

        await sendEmailViaResend({
          to: email,
          subject: `🌸 [Chào Mừng] Tài khoản Quang Dũng Nihongo của bạn đã sẵn sàng!`,
          html: htmlWelcome,
        });
      } catch (emailErr) {
        console.warn('Welcome email error:', emailErr);
      }

      toast.success('Đăng ký thành công! Vui lòng kiểm tra email chào mừng.');
      return true;
    } catch {
      toast.error('Lỗi kết nối mạng. Vui lòng thử lại.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [signUp, checkRateLimit]);

  return { loading, errors, handleLogin, handleSignUp };
}

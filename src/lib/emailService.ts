import { supabase } from '@/integrations/supabase/client';
import { sendEmailViaResend, buildHTMLNotificationEmail } from './resendEmailService';

export interface AbsenceEmailPayload {
  studentName: string;
  studentEmail?: string;
  className: string;
  sessionDate: string;
  reason: string;
  teacherId?: string;
  teacherEmail?: string;
}

export interface MakeupEmailPayload {
  studentId: string;
  studentEmail?: string;
  studentName: string;
  className: string;
  sessionDate: string;
  startTime: string;
  meetLink?: string;
  topic?: string;
}

export interface GradingEmailPayload {
  studentId: string;
  studentEmail?: string;
  studentName?: string;
  examTitle: string;
  score: number;
  maxScore: number;
  feedback?: string;
}

/**
 * Sends absence notification to teacher and logs in notifications table
 */
export const sendAbsenceNotification = async (payload: AbsenceEmailPayload) => {
  try {
    // 1. Create in-app notification for teacher if teacherId is provided
    if (payload.teacherId) {
      await supabase.from('notifications').insert({
        user_id: payload.teacherId,
        title: `📌 Đơn xin nghỉ học: ${payload.studentName}`,
        message: `Học viên ${payload.studentName} thuộc lớp "${payload.className}" xin vắng học ngày ${payload.sessionDate}. Lý do: ${payload.reason}`,
        type: 'info',
        link: '/teacher/classes?tab=stream'
      });
    }

    // 2. Send email via Resend if email is available
    const recipientEmail = payload.teacherEmail || 'admin@quangdungnihongo.com';
    const htmlEmail = buildHTMLNotificationEmail({
      title: `Đơn xin nghỉ học từ học viên ${payload.studentName}`,
      badgeText: 'ĐƠN XIN NGHỈ HỌC',
      recipientName: 'Thầy/Cô Giáo Viên',
      mainContentHtml: `Học viên <b>${payload.studentName}</b> đã gửi đơn xin phép vắng mặt trong buổi học sắp tới. Kính mong Thầy/Cô nắm thông tin để sắp xếp nội dung bài giảng.`,
      infoItems: [
        { label: 'Học viên', value: payload.studentName, icon: '👤' },
        { label: 'Lớp học', value: payload.className, icon: '📚' },
        { label: 'Ngày xin nghỉ', value: payload.sessionDate, icon: '📅' },
        { label: 'Lý do xin nghỉ', value: payload.reason, icon: '📝' },
      ],
      actionBtnText: 'Quản Lý Lớp Học',
      actionBtnUrl: 'https://quangdungnihongo.com/teacher/classes',
    });

    await sendEmailViaResend({
      to: recipientEmail,
      subject: `📌 [Đơn xin nghỉ học] ${payload.studentName} - Lớp ${payload.className} (${payload.sessionDate})`,
      html: htmlEmail,
    });

    console.log('[EmailService] Absence notification sent via Resend:', payload);
    return { success: true };
  } catch (error) {
    console.error('[EmailService] Error sending absence notification:', error);
    return { success: false, error };
  }
};

/**
 * Sends makeup class invitation email & in-app notification to student
 */
export const sendMakeupClassInvitation = async (payload: MakeupEmailPayload) => {
  try {
    const directLink = `https://quangdungnihongo.com/learn/my-classes?tab=makeup&date=${encodeURIComponent(payload.sessionDate)}`;

    // 1. Insert in-app notification for the student
    await supabase.from('notifications').insert({
      user_id: payload.studentId,
      title: `📅 Lịch học bù lớp ${payload.className}`,
      message: `Bạn có lịch học bù vào ngày ${payload.sessionDate} lúc ${payload.startTime}.${payload.topic ? ` Chủ đề: ${payload.topic}.` : ''}`,
      type: 'success',
      link: '/learn/my-classes'
    });

    // 2. Send email via Resend if email is provided
    if (payload.studentEmail) {
      const htmlEmail = buildHTMLNotificationEmail({
        title: `Lịch Học Bù Mới - Lớp ${payload.className}`,
        badgeText: 'THÔNG BÁO LỊCH HỌC BÙ',
        recipientName: payload.studentName || 'Học Viên',
        mainContentHtml: `Trung tâm đã xếp lịch học bù cho bạn thuộc lớp <b>${payload.className}</b>. Vui lòng kiểm tra thời gian và vào phòng học Google Meet đúng giờ nhé!`,
        infoItems: [
          { label: 'Lớp học', value: payload.className, icon: '📚' },
          { label: 'Ngày học bù', value: payload.sessionDate, icon: '📅' },
          { label: 'Thời gian', value: payload.startTime, icon: '⏰' },
          { label: 'Chủ đề bài học', value: payload.topic || 'Học bù bài giảng', icon: '📖' },
        ],
        actionBtnText: 'VÀO PHÒNG HỌC MEETS',
        actionBtnUrl: payload.meetLink || directLink,
      });

      await sendEmailViaResend({
        to: payload.studentEmail,
        subject: `📅 [Lịch Học Bù] Lớp ${payload.className} - Ngày ${payload.sessionDate} lúc ${payload.startTime}`,
        html: htmlEmail,
      });
    }

    console.log('[EmailService] Makeup class invitation sent via Resend:', payload);
    return { success: true };
  } catch (error) {
    console.error('[EmailService] Error sending makeup invitation:', error);
    return { success: false, error };
  }
};

/**
 * Sends grading notification to student when teacher/admin grades submission or exam attempt
 */
export const sendGradingNotification = async (payload: GradingEmailPayload) => {
  try {
    const pct = Math.round((payload.score / (payload.maxScore || 100)) * 100);
    const feedbackText = payload.feedback ? ` · Góp ý: "${payload.feedback}"` : '';

    // 1. In-app notification
    await supabase.from('notifications').insert({
      user_id: payload.studentId,
      title: `📝 Đã có kết quả chấm bài: ${payload.examTitle}`,
      message: `Bạn đạt ${payload.score}/${payload.maxScore} điểm (${pct}%)${feedbackText}`,
      type: 'submission_graded',
      link: '/learn/my-classes?tab=exams'
    });

    // 2. Email via Resend
    if (payload.studentEmail) {
      const htmlEmail = buildHTMLNotificationEmail({
        title: `Kết Quả Chấm Bài: ${payload.examTitle}`,
        badgeText: 'KẾT QUẢ BÀI TẬP / THI',
        recipientName: payload.studentName || 'Học Viên',
        mainContentHtml: `Bài làm <b>"${payload.examTitle}"</b> của bạn đã được Thầy/Cô chấm điểm xong. Hãy xem kết quả và lời nhận xét chi tiết bên dưới nhé!`,
        infoItems: [
          { label: 'Bài kiểm tra', value: payload.examTitle, icon: '📝' },
          { label: 'Điểm số đạt được', value: `${payload.score} / ${payload.maxScore} (${pct}%)`, icon: '🌟' },
          { label: 'Đánh giá / Góp ý', value: payload.feedback || 'Hoàn thành tốt bài làm!', icon: '💬' },
        ],
        actionBtnText: 'Xem Báo Cáo Chi Tiết',
        actionBtnUrl: 'https://quangdungnihongo.com/learn/exams',
      });

      await sendEmailViaResend({
        to: payload.studentEmail,
        subject: `📝 [Kết Quả Chấm Bài] ${payload.examTitle} - Đạt ${payload.score}/${payload.maxScore} điểm`,
        html: htmlEmail,
      });
    }

    console.log('[EmailService] Grading notification sent via Resend:', payload);
    return { success: true };
  } catch (error) {
    console.error('[EmailService] Error sending grading notification:', error);
    return { success: false, error };
  }
};

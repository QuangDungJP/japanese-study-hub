import { supabase } from '@/integrations/supabase/client';

export interface AbsenceEmailPayload {
  studentName: string;
  studentEmail?: string;
  className: string;
  sessionDate: string;
  reason: string;
  teacherId?: string;
}

export interface MakeupEmailPayload {
  studentId: string;
  studentName: string;
  className: string;
  sessionDate: string;
  startTime: string;
  meetLink?: string;
  topic?: string;
}

export interface GradingEmailPayload {
  studentId: string;
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

    console.log('[EmailService] Absence notification sent:', payload);
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
    // Direct link to the student's classroom page
    const directLink = `/learn/my-classes?tab=makeup&date=${encodeURIComponent(payload.sessionDate)}`;

    // Insert in-app notification for the student
    await supabase.from('notifications').insert({
      user_id: payload.studentId,
      title: `📅 Lịch học bù lớp ${payload.className}`,
      message: `Bạn có lịch học bù vào ngày ${payload.sessionDate} lúc ${payload.startTime}.${payload.topic ? ` Chủ đề: ${payload.topic}.` : ''}`,
      type: 'success',
      link: directLink
    });

    console.log('[EmailService] Makeup class invitation sent:', payload);
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

    await supabase.from('notifications').insert({
      user_id: payload.studentId,
      title: `📝 Đã có kết quả chấm bài: ${payload.examTitle}`,
      message: `Bạn đạt ${payload.score}/${payload.maxScore} điểm (${pct}%)${feedbackText}`,
      type: 'submission_graded',
      link: '/learn/my-classes?tab=exams'
    });

    console.log('[EmailService] Grading notification sent:', payload);
    return { success: true };
  } catch (error) {
    console.error('[EmailService] Error sending grading notification:', error);
    return { success: false, error };
  }
};

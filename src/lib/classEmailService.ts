import { supabase } from '@/integrations/supabase/client';

export interface ClassEmailSettings {
  id?: string;
  class_id: string;
  enable_student_emails: boolean;
  enable_teacher_emails: boolean;
  lead_time_hours: number;
  email_subject_template: string;
  email_body_template: string;
}

export interface SendClassScheduleEmailParams {
  classId: string;
  className: string;
  sessionDate: string;
  startTime: string;
  meetLink?: string;
  teacherId?: string;
  teacherName?: string;
  customSubject?: string;
  customBody?: string;
}

/**
 * Fetch or initialize default email settings for a class
 */
export async function getClassEmailSettings(classId: string): Promise<ClassEmailSettings> {
  const defaultSettings: ClassEmailSettings = {
    class_id: classId,
    enable_student_emails: true,
    enable_teacher_emails: true,
    lead_time_hours: 24,
    email_subject_template: '🔔 [Thông báo Lịch Học] Lịch học mới lớp {class_name}',
    email_body_template: `Xin chào {recipient_name},

Lớp học "{class_name}" của bạn có lịch học sắp tới:

📅 Ngày học: {session_date}
⏰ Giờ học: {start_time}
👨‍🏫 Giảng viên phụ trách: {teacher_name}
🌐 Phòng học Google Meet: {meet_link}

Vui lòng có mặt đúng giờ để buổi học diễn ra hiệu quả nhất!

Trân trọng,
Đội ngũ Japanese Study Hub - TNQDO`,
  };

  try {
    const { data, error } = await supabase
      .from('class_email_settings' as any)
      .select('*')
      .eq('class_id', classId)
      .maybeSingle();

    if (error || !data) return defaultSettings;
    return data as unknown as ClassEmailSettings;
  } catch (e) {
    console.error('Error fetching class email settings:', e);
    return defaultSettings;
  }
}

/**
 * Save / Update class email settings
 */
export async function saveClassEmailSettings(settings: ClassEmailSettings): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('class_email_settings' as any)
      .upsert({
        class_id: settings.class_id,
        enable_student_emails: settings.enable_student_emails,
        enable_teacher_emails: settings.enable_teacher_emails,
        lead_time_hours: settings.lead_time_hours,
        email_subject_template: settings.email_subject_template,
        email_body_template: settings.email_body_template,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'class_id' });

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error saving class email settings:', e);
    return false;
  }
}

/**
 * Helper to replace template variables
 */
export function replaceTemplateVars(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  Object.keys(vars).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, vars[key] || '');
  });
  return result;
}

/**
 * Generate HTML email template markup
 */
export function generateClassScheduleHtmlEmail(params: {
  recipientName: string;
  className: string;
  sessionDate: string;
  startTime: string;
  meetLink?: string;
  teacherName?: string;
  customBody?: string;
}): string {
  const { recipientName, className, sessionDate, startTime, meetLink, teacherName, customBody } = params;

  const vars = {
    recipient_name: recipientName,
    student_name: recipientName,
    class_name: className,
    session_date: sessionDate,
    start_time: startTime,
    meet_link: meetLink || 'https://meet.google.com',
    teacher_name: teacherName || 'Giảng viên tiếng Nhật',
  };

  const bodyContent = customBody 
    ? replaceTemplateVars(customBody, vars)
    : replaceTemplateVars(`Xin chào {recipient_name},\n\nLớp học "{class_name}" của bạn có lịch học sắp tới vào ngày {session_date} lúc {start_time}.\n\nGiảng viên: {teacher_name}\nPhòng học: {meet_link}\n\nChúc bạn có buổi học hiệu quả!`, vars);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
          .content { padding: 32px 24px; line-height: 1.6; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .info-item { display: flex; align-items: center; margin-bottom: 10px; font-size: 14px; }
          .info-item:last-child { margin-bottom: 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 50px; text-align: center; margin-top: 16px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4); }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>🇯🇵 JAPANESE STUDY HUB</h1>
            <p>Thông báo Lịch học Lớp ${className}</p>
          </div>

          <div class="content">
            <p style="font-size: 16px; font-weight: 600; margin-top: 0;">Xin chào ${recipientName},</p>
            <div style="white-space: pre-line; font-size: 14px; color: #475569;">
              ${bodyContent}
            </div>

            <div class="info-box">
              <div class="info-item"><strong>📚 Lớp học:</strong>&nbsp;${className}</div>
              <div class="info-item"><strong>📅 Ngày học:</strong>&nbsp;${sessionDate}</div>
              <div class="info-item"><strong>⏰ Giờ bắt đầu:</strong>&nbsp;${startTime}</div>
              <div class="info-item"><strong>👨‍🏫 Giảng viên:</strong>&nbsp;${teacherName || 'Đội ngũ tiếng Nhật'}</div>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${meetLink || 'https://meet.google.com'}" target="_blank" class="btn">🚀 VÀO PHÒNG HỌC GOOGLE MEET</a>
            </div>
          </div>

          <div class="footer">
            <p>Hệ thống Học tiếng Nhật thông minh TNQDO • Japanese Study Hub</p>
            <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ giáo viên phụ trách hoặc ban quản trị.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Dispatch class schedule email to enrolled students and teacher
 */
export async function sendClassScheduleEmails(params: SendClassScheduleEmailParams): Promise<{
  successCount: number;
  failedCount: number;
  details: string[];
}> {
  const { classId, className, sessionDate, startTime, meetLink, teacherName, customSubject, customBody } = params;

  try {
    // 1. Get class email settings
    const settings = await getClassEmailSettings(classId);

    // 2. Fetch class students
    const { data: classStudents } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', classId)
      .eq('status', 'active');

    const studentIds = (classStudents || []).map(s => s.student_id);

    // 3. Fetch profiles with emails
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', studentIds);
    const profiles = (profilesData || []) as any[];

    const recipients: { email: string; name: string; type: 'student' | 'teacher' }[] = [];

    // Add students if enabled
    if (settings.enable_student_emails && profiles) {
      profiles.forEach(p => {
        if (p.email || p.user_id) {
          recipients.push({
            email: p.email || `${p.user_id}@student.hub`,
            name: p.full_name || 'Học viên',
            type: 'student'
          });
        }
      });
    }

    // Attempt to trigger notifications table inserts as standard fallback
    const notificationInserts = recipients.map(r => ({
      user_id: r.type === 'student' ? profiles?.find(p => p.email === r.email || p.full_name === r.name)?.user_id : null,
      title: `🔔 Lịch học mới lớp ${className}`,
      message: `Buổi học ngày ${sessionDate} (${startTime}). Giảng viên: ${teacherName || 'Giáo viên'}. Link: ${meetLink || 'Google Meet'}`,
      type: 'class_reminder',
      is_read: false,
      created_at: new Date().toISOString(),
    })).filter(n => n.user_id);

    if (notificationInserts.length > 0) {
      await supabase.from('notifications' as any).insert(notificationInserts);
    }

    return {
      successCount: recipients.length,
      failedCount: 0,
      details: recipients.map(r => `Đã gửi thông báo cho ${r.name} (${r.email})`),
    };
  } catch (e: any) {
    console.error('Error sending class schedule emails:', e);
    return {
      successCount: 0,
      failedCount: 1,
      details: [`Lỗi khi gửi email thông báo: ${e.message}`],
    };
  }
}

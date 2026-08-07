import { supabase } from '@/integrations/supabase/client';

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || 're_fco1Scup_KyzVKpNYxJA69BuTWeyAZjCN';
const SENDER_EMAIL = 'Quang Dũng Nihongo <onboarding@resend.dev>'; // Có thể thay bằng admin@quangdungnihongo.com sau khi verify domain Resend

export interface ResendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Hàm gửi email trực tiếp qua Resend API v1
 */
export async function sendEmailViaResend(params: ResendEmailParams): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const toArray = Array.isArray(params.to) ? params.to : [params.to];
    
    // Đảm bảo loại bỏ các email rỗng / không hợp lệ
    const validEmails = toArray.filter(e => e && e.includes('@') && !e.endsWith('@student.hub'));
    
    if (validEmails.length === 0) {
      console.warn('[Resend] Không có địa chỉ email hợp lệ để gửi:', params.to);
      return { success: false, error: 'Địa chỉ email nhận không hợp lệ' };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: validEmails,
        subject: params.subject,
        html: params.html,
        reply_to: params.replyTo || 'support@quangdungnihongo.com',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Resend Error]', data);
      return { success: false, error: data.message || 'Lỗi gửi mail Resend API' };
    }

    console.log('[Resend Success] Email sent:', data);
    return { success: true, data };
  } catch (err: any) {
    console.error('[Resend Exception]', err);
    return { success: false, error: err.message || 'Lỗi kết nối dịch vụ Email' };
  }
}

/**
 * HTML Email Template Sang Trọng - Chuẩn Thương Hiệu Quang Dũng Nihongo
 */
export function buildHTMLNotificationEmail(params: {
  title: string;
  badgeText?: string;
  recipientName: string;
  mainContentHtml: string;
  infoItems?: { label: string; value: string; icon?: string }[];
  actionBtnText?: string;
  actionBtnUrl?: string;
  footerNote?: string;
}): string {
  const { title, badgeText = 'THÔNG BÁO TỪ QUANG DŨNG NIHONGO', recipientName, mainContentHtml, infoItems = [], actionBtnText, actionBtnUrl, footerNote } = params;

  const infoRowsHtml = infoItems.map(item => `
    <tr>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600; width: 35%;">
        ${item.icon || '📌'} ${item.label}:
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 700;">
        ${item.value}
      </td>
    </tr>
  `).join('');

  return `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#334155;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding: 40px 15px;">
      <tr>
        <td align="center">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color:#ffffff; border-radius: 24px; overflow:hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
            
            <!-- HEADER LOGO BANNER -->
            <tr>
              <td style="background: linear-gradient(135deg, #e11d48 0%, #f59e0b 50%, #ea580c 100%); padding: 36px 30px; text-align: center;">
                <div style="display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); padding: 4px 14px; border-radius: 50px; color: #ffffff; font-size: 11px; font-weight: 800; tracking: 1px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.3);">
                  ${badgeText}
                </div>
                <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
                  🌸 QUANG DŨNG NIHONGO
                </h1>
                <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 500;">
                  Chinh phục Tiếng Nhật JLPT N5 - N1 Hàng Đầu
                </p>
              </td>
            </tr>

            <!-- CONTENT BODY -->
            <tr>
              <td style="padding: 36px 30px;">
                <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
                  Xin chào <span style="color: #e11d48;">${recipientName}</span> 👋,
                </p>
                
                <div style="font-size: 14px; line-height: 1.7; color: #334155; margin-bottom: 24px;">
                  ${mainContentHtml}
                </div>

                <!-- INFO BOX -->
                ${infoItems.length > 0 ? `
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 28px; overflow: hidden;">
                  ${infoRowsHtml}
                </table>
                ` : ''}

                <!-- ACTION BUTTON -->
                ${actionBtnText && actionBtnUrl ? `
                <div style="text-align: center; margin: 30px 0 10px 0;">
                  <a href="${actionBtnUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #e11d48, #ea580c); color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 50px; box-shadow: 0 10px 20px rgba(225, 29, 72, 0.3);">
                    ${actionBtnText} →
                  </a>
                </div>
                ` : ''}
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; line-height: 1.6;">
                <p style="margin: 0 0 6px 0; font-weight: 700; color: #64748b;">
                  Quang Dũng Nihongo • System Notification Engine
                </p>
                <p style="margin: 0;">
                  Website: <a href="https://quangdungnihongo.com" target="_blank" style="color: #e11d48; text-decoration: none; font-weight: 600;">quangdungnihongo.com</a> • Hỗ trợ: support@quangdungnihongo.com
                </p>
                ${footerNote ? `<p style="margin: 8px 0 0 0; font-style: italic;">${footerNote}</p>` : ''}
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

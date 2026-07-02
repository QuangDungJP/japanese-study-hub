import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) return json({ error: 'Missing LOVABLE_API_KEY' }, 500);

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === 'suggest_assignment') {
      const title = String(body.title || '').slice(0, 200);
      const current = String(body.current_instructions || '').slice(0, 500);
      const prompt = `Bạn là trợ lý giáo viên tiếng Nhật. Với tiêu đề bài tập: "${title}"${current ? `\nHướng dẫn hiện tại: ${current}` : ''}\n\nHãy trả JSON đúng schema:\n{\n  "instructions": "Hướng dẫn chi tiết (3-6 câu, tiếng Việt) mô tả yêu cầu, cách làm, tiêu chí đánh giá",\n  "rubric": [ { "title": "Tên tiêu chí", "max": số_điểm } ]\n}\nCó 3-5 tiêu chí rubric, tổng điểm ~100.`;

      const res = await fetch(GATEWAY, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Bạn là trợ lý AI cho giáo viên. Trả về CHỈ JSON hợp lệ, không markdown.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        return json({ error: `AI gateway ${res.status}: ${t}` }, res.status);
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      let parsed: any = {};
      try { parsed = JSON.parse(content); } catch { parsed = { instructions: content }; }
      return json(parsed);
    }

    if (action === 'suggest_feedback') {
      const rubric = body.rubric || [];
      const content = String(body.content || '').slice(0, 3000);
      const prompt = `Bài làm của học viên:\n"""${content}"""\n\nRubric: ${JSON.stringify(rubric)}\n\nTrả JSON:\n{ "feedback": "nhận xét chi tiết bằng tiếng Việt, 3-6 câu", "suggested_score": số_điểm_tổng }`;
      const res = await fetch(GATEWAY, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Bạn là trợ lý chấm bài. Trả CHỈ JSON.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) return json({ error: await res.text() }, res.status);
      const data = await res.json();
      let parsed: any = {};
      try { parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}'); } catch {}
      return json(parsed);
    }

    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
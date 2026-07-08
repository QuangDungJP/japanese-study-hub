import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';

async function callAI(key: string, systemPrompt: string, userPrompt: string) {
  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`AI gateway ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  try { return JSON.parse(content); } catch { return { raw: content }; }
}

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

    // ============ LESSON EDITOR AI COPILOT ============

    if (action === 'lesson_outline') {
      const topic = String(body.topic || '').slice(0, 200);
      const level = String(body.level || '').slice(0, 50);
      const sys = 'Bạn là chuyên gia thiết kế bài học tiếng Nhật. Trả về CHỈ JSON, không markdown.';
      const prompt = `Thiết kế outline bài học "${topic}"${level ? ` (trình độ ${level})` : ''}.\nTrả JSON:\n{ "sections": [ { "heading": "Tên phần", "intro": "Đoạn giới thiệu 2-3 câu tiếng Việt" } ] }\nCó 4-6 sections đi từ khởi động → nội dung chính → luyện tập → tổng kết.`;
      return json(await callAI(key, sys, prompt));
    }

    if (action === 'lesson_vocab') {
      const topic = String(body.topic || '').slice(0, 200);
      const level = String(body.level || 'N5').slice(0, 50);
      const sys = 'Bạn là giáo viên tiếng Nhật. Trả CHỈ JSON.';
      const prompt = `Sinh 10-12 từ vựng tiếng Nhật chủ đề "${topic}" trình độ ${level}.\nJSON:\n{ "items": [ { "term": "kanji/kana", "reading": "hiragana", "meaning": "nghĩa tiếng Việt" } ] }`;
      return json(await callAI(key, sys, prompt));
    }

    if (action === 'lesson_quiz') {
      const topic = String(body.topic || '').slice(0, 200);
      const level = String(body.level || 'N5').slice(0, 50);
      const sys = 'Bạn là giáo viên tiếng Nhật. Trả CHỈ JSON.';
      const prompt = `Sinh 4 câu trắc nghiệm ôn tập chủ đề "${topic}" trình độ ${level}.\nJSON:\n{ "questions": [ { "question": "…", "choices": ["A","B","C","D"], "answer": 0, "explanation": "giải thích ngắn tiếng Việt" } ] }\nĐáp án đa dạng, không luôn A.`;
      return json(await callAI(key, sys, prompt));
    }

    if (action === 'lesson_rewrite') {
      const source = String(body.source || '').slice(0, 2000);
      if (!source.trim()) return json({ error: 'Cần nội dung nguồn' }, 400);
      const sys = 'Bạn là biên tập viên. Trả CHỈ JSON.';
      const prompt = `Viết lại đoạn sau cho dễ hiểu, giữ nguyên ý:\n"""${source}"""\nJSON: { "text": "đoạn đã viết lại" }`;
      return json(await callAI(key, sys, prompt));
    }

    if (action === 'assignment_questions') {
      const title = String(body.title || '').slice(0, 200);
      const instructions = String(body.instructions || '').slice(0, 1000);
      const count = Math.min(Math.max(parseInt(body.count) || 5, 1), 10);
      const sys = 'Bạn là giáo viên tiếng Nhật. Trả CHỈ JSON hợp lệ.';
      const prompt = `Tạo ${count} câu hỏi/nhiệm vụ cho bài tập "${title}".\nHướng dẫn: ${instructions || '(không có)'}\nJSON:\n{ "questions": [ { "prompt": "nội dung câu hỏi tiếng Việt hoặc tiếng Nhật", "hint": "gợi ý ngắn (có thể để trống)" } ] }`;
      return json(await callAI(key, sys, prompt));
    }

    if (action === 'assignment_rubric') {
      const title = String(body.title || '').slice(0, 200);
      const instructions = String(body.instructions || '').slice(0, 1000);
      const sys = 'Bạn là giáo viên tiếng Nhật. Trả CHỈ JSON.';
      const prompt = `Đề xuất rubric chấm điểm cho bài tập "${title}".\nMô tả: ${instructions || '(không có)'}\nJSON:\n{ "rubric": [ { "title": "Tiêu chí", "max": số_điểm } ] }\n4-5 tiêu chí, tổng ~100 điểm.`;
      return json(await callAI(key, sys, prompt));
    }

    if (action === 'assignment_full') {
      const title = String(body.title || '').slice(0, 200);
      const level = String(body.level || 'N5').slice(0, 50);
      const sys = 'Bạn là giáo viên tiếng Nhật. Trả CHỈ JSON.';
      const prompt = `Thiết kế bài tập hoàn chỉnh "${title}" trình độ ${level}.\nJSON:\n{\n  "instructions": "hướng dẫn 4-6 câu tiếng Việt",\n  "questions": [ { "prompt": "...", "hint": "..." } ],\n  "rubric": [ { "title": "...", "max": 20 } ]\n}\n5 câu hỏi, 4 tiêu chí rubric, tổng ~100.`;
      return json(await callAI(key, sys, prompt));
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
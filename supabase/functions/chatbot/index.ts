import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Load chatbot config + light context (courses, teachers) for the system prompt
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: cfg } = await supabase
      .from("website_content")
      .select("content, description_vi")
      .eq("section_key", "chatbot")
      .maybeSingle();

    const cfgContent = (cfg?.content || {}) as Record<string, unknown>;
    const model = (cfgContent.model as string) || "google/gemini-3-flash-preview";
    const basePrompt =
      (cfgContent.system_prompt as string) ||
      "Bạn là Q-Bot, trợ lý AI thân thiện của trung tâm tiếng Nhật TNQDO. Trả lời ngắn gọn bằng tiếng Việt.";

    const [{ data: courses }, { data: teachers }] = await Promise.all([
      supabase.from("courses").select("title_vi, level, price, slug").eq("is_published", true).limit(8),
      supabase.from("website_content").select("content").eq("section_key", "teachers").maybeSingle().then(r => ({ data: (r.data?.content as any)?.teachers || [] })),
    ]);

    const ctx = `\n\nDữ liệu tham khảo:\n- Khóa học: ${(courses || []).map((c: any) => `${c.title_vi} (${c.level}) - ${c.price}đ -> /khoa-hoc/${c.slug}`).join("; ") || "chưa có"}\n- Số giáo viên hiển thị: ${(teachers as any[]).length}\n\nLuôn cố gắng dẫn link nội bộ: /khoa-hoc, /giao-vien, /lien-he, /gioi-thieu, /su-kien khi phù hợp.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: basePrompt + ctx }, ...messages],
        stream: true,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429)
        return new Response(JSON.stringify({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402)
        return new Response(JSON.stringify({ error: "Hết credit AI. Vui lòng liên hệ quản trị." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(resp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chatbot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
import { useEffect, useRef, useState } from "react";
import { Send, X, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import defaultBotImage from "@/assets/chatbot-robot.png";

type Msg = { role: "user" | "assistant"; content: string };

interface ChatbotConfig {
  title_vi?: string | null;
  subtitle_vi?: string | null;
  description_vi?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  content?: {
    welcome_message?: string;
    suggestions?: string[];
  };
}

const FloatingChat = () => {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("website_content")
      .select("title_vi, subtitle_vi, description_vi, image_url, is_active, content")
      .eq("section_key", "chatbot")
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        setConfig(data as ChatbotConfig);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (open && messages.length === 0 && config) {
      const welcome = config.content?.welcome_message || "Xin chào 👋 Mình là Q-Bot. Bạn cần hỗ trợ gì?";
      setMessages([{ role: "assistant", content: welcome }]);
    }
  }, [open, config]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  if (config?.is_active === false) return null;

  const botImage = config?.image_url || defaultBotImage;
  const title = config?.title_vi || "Trợ lý AI TNQDO";
  const subtitle = config?.subtitle_vi || "Q-Bot 🤖";
  const suggestions = config?.content?.suggestions || [];

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    let assistant = "";
    const upsert = (chunk: string) => {
      assistant += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && (prev.length > next.length)) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistant } : m);
        }
        return [...prev, { role: "assistant", content: assistant }];
      });
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        upsert(err.error || "Xin lỗi, mình đang gặp sự cố. Vui lòng thử lại.");
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      upsert("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Mở chatbot AI"
          className="fixed bottom-5 right-5 z-[60] group"
        >
          <span className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
          <span className="relative block w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shadow-2xl ring-4 ring-primary/30 hover:scale-110 transition-transform bg-gradient-to-br from-primary to-accent">
            <img src={botImage} alt="Q-Bot" className="w-full h-full object-cover" />
          </span>
          <span className="absolute -top-1 -right-1 flex items-center gap-1 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
            <Sparkles className="w-3 h-3" /> AI
          </span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-[60] w-[calc(100vw-2.5rem)] sm:w-96 h-[600px] max-h-[80vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-white/30 bg-white/10 flex-shrink-0">
              <img src={botImage} alt="bot" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm flex items-center gap-1.5">{title} <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /></div>
              <div className="text-xs opacity-90 truncate">{subtitle}</div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" aria-label="Đóng">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-1 ring-1 ring-border">
                    <img src={botImage} alt="bot" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border text-foreground rounded-bl-sm shadow-sm"
                }`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-0 [&_p+p]:mt-2 [&_a]:text-primary [&_ul]:my-1 [&_li]:my-0">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-border">
                  <img src={botImage} alt="bot" className="w-full h-full object-cover" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:120ms]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:240ms]" />
                </div>
              </div>
            )}

            {messages.length <= 1 && suggestions.length > 0 && !loading && (
              <div className="pt-2 space-y-2">
                <div className="text-xs text-muted-foreground font-medium">Gợi ý:</div>
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-xl bg-card border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="p-3 border-t border-border bg-card flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-transform"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
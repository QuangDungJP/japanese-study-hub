import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const FloatingChat = () => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("website_content")
      .select("description_vi, description, is_active")
      .eq("section_key", "floating_chat")
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data || data.is_active === false) return;
        const link = (data.description_vi || data.description || "").trim();
        if (link) setUrl(link);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat Messenger"
      className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 px-4 py-3"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline text-sm font-semibold">Chat ngay</span>
    </a>
  );
};

export default FloatingChat;
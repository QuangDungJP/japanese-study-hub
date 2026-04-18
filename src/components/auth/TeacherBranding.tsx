import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from "@/components/Navbar";

<Navbar />
interface AuthCmsData {
  image_url?: string;
  quote?: string;
  vertical_text?: string;
}

const defaults: AuthCmsData = {
  image_url: '/teachers/quang-dung.png',
  quote: '“Bạn đã có những ngày tháng làm việc mệt mỏi, bạn đã sợ rằng ngoài 30, 40 tuổi thì không theo kịp nữa, nhưng hãy nhớ rằng nếu hôm nay bạn không đầu tư cho bản thân, năm 50, 60 bạn sẽ rơi vào vòng lặp hối tiếc”',
  vertical_text: 'Tiếng Nhật Quang Dũng Online',
};

const TeacherBranding = () => {
  const [cms, setCms] = useState<AuthCmsData>(defaults);

  useEffect(() => {
    supabase
      .from('website_content')
      .select('content, image_url')
      .eq('section_key', 'auth_settings')
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.content && typeof data.content === 'object') {
          const c = data.content as Record<string, string>;
          setCms({
            image_url: data.image_url || c.image_url || defaults.image_url,
            quote: c.quote || defaults.quote,
            vertical_text: c.vertical_text || defaults.vertical_text,
          });
        }
      });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="lg:col-span-5 relative flex flex-col items-center"
    >
      <div className="relative flex justify-center">
        <img
          src={cms.image_url}
          alt="teacher"
          className="w-3/4 md:w-2/3 lg:w-full max-w-[420px] object-contain drop-shadow-2xl hover:scale-105 transition"
        />
        <div className="hidden md:flex absolute -right-10 top-0 h-full items-center">
          <span className="[writing-mode:vertical-rl] text-[#2D3E50] font-black text-xl lg:text-3xl uppercase whitespace-nowrap">
            {cms.vertical_text}
          </span>
        </div>
      </div>
      <div className="mt-6 max-w-lg px-4">
        <p className="text-[#1A3350] text-base md:text-lg font-bold italic text-center lg:text-right whitespace-pre-line">
          {cms.quote}
        </p>
      </div>
    </motion.div>
  );
};

export default TeacherBranding;

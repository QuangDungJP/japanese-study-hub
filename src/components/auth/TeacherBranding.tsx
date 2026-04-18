import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
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
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="xl:col-span-5 relative flex flex-col items-center justify-center"
    >
      <div className="relative">
        {/* Main image with enhanced styling */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-400 dark:from-amber-600 dark:to-orange-600 rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
          <img
            src={cms.image_url}
            alt="teacher"
            className="relative w-64 sm:w-72 lg:w-80 xl:w-96 object-cover rounded-2xl shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-3xl"
          />
        </div>
        
        {/* Vertical text for desktop */}
        <div className="hidden lg:flex absolute -right-16 xl:-right-20 top-0 h-full items-center">
          <span className="[writing-mode:vertical-rl] text-amber-800 dark:text-amber-200 font-black text-lg xl:text-2xl uppercase tracking-wider whitespace-nowrap opacity-90">
            {cms.vertical_text}
          </span>
        </div>
      </div>
      
      {/* Quote section with enhanced styling */}
      <div className="mt-8 lg:mt-12 max-w-md mx-auto px-4">
        <div className="relative">
          <div className="absolute -left-4 top-0 text-4xl text-amber-400 dark:text-amber-600 opacity-50">"</div>
          <blockquote className="relative text-amber-900 dark:text-amber-100 text-base lg:text-lg font-medium italic text-center leading-relaxed pl-6">
            {cms.quote}
          </blockquote>
          <div className="absolute -right-4 bottom-0 text-4xl text-amber-400 dark:text-amber-600 opacity-50 rotate-180">"</div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="mt-8 flex justify-center gap-2">
        <div className="w-2 h-2 bg-amber-400 dark:bg-amber-600 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-orange-400 dark:bg-orange-600 rounded-full animate-pulse delay-75"></div>
        <div className="w-2 h-2 bg-amber-400 dark:bg-amber-600 rounded-full animate-pulse delay-150"></div>
      </div>
    </motion.div>
  );
};

export default TeacherBranding;

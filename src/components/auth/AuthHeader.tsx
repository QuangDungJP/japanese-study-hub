import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const defaultText = 'Chào mừng bạn đến với mạng lưới đào tạo Nhật ngữ trực tuyến hàng đầu Việt Nam';

const AuthHeader = () => {
  const [headerText, setHeaderText] = useState(defaultText);

  useEffect(() => {
    supabase
      .from('website_content')
      .select('content')
      .eq('section_key', 'auth_settings')
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.content && typeof data.content === 'object') {
          const c = data.content as Record<string, string>;
          if (c.welcome_text) setHeaderText(c.welcome_text);
        }
      });
  }, []);

  return (
    <header className="w-full max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
      <h2 className="text-sm md:text-base lg:text-lg italic text-gray-700 text-center md:text-left max-w-xl">
        {headerText}
      </h2>
    </header>
  );
};

export default AuthHeader;

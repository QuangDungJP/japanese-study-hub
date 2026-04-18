import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';

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
    <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="text-center lg:text-left">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-medium text-amber-800 dark:text-amber-200 italic leading-relaxed">
          {headerText}
        </h2>
        <div className="mt-4 flex justify-center lg:justify-start">
          <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-orange-400 dark:from-amber-600 dark:to-orange-600 rounded-full"></div>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;

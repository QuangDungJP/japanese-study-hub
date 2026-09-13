import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { applyTheme, getSavedTheme } from '@/lib/themeUtils';

export function AppInit() {
  useEffect(() => {
    const fetchGlobalTheme = async () => {
      const { data, error } = await supabase
        .from('website_content')
        .select('content')
        .eq('section_key', 'app_theme')
        .maybeSingle();

      if (!error && data && data.content && typeof data.content === 'object') {
        const content = data.content as Record<string, string>;
        if (content.theme_id) {
          applyTheme(content.theme_id);
          return;
        }
      }
      
      // If no global theme is set in DB, fallback to local saved theme
      applyTheme(getSavedTheme());
    };

    fetchGlobalTheme();
  }, []);

  return null;
}

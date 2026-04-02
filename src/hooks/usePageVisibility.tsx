import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PageVisibilitySettings {
  public_pages: Record<string, boolean>;
  navbar_items: Record<string, boolean>;
  learn_sidebar: Record<string, boolean>;
}

const defaultSettings: PageVisibilitySettings = {
  public_pages: {
    about: true, courses: true, teachers: true, zoom: true,
    blog: true, faq: true, contact: true, events: true,
  },
  navbar_items: {
    about: true, courses: true, teachers: true, zoom: true,
    blog: true, faq: true, contact: true, events: true,
  },
  learn_sidebar: {
    dashboard: true, lessons: true, exercises: true, zoom: true,
    calendar: true, achievements: true, settings: true,
  },
};

export const usePageVisibility = () => {
  const [settings, setSettings] = useState<PageVisibilitySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('website_content')
        .select('content')
        .eq('section_key', 'page_visibility')
        .maybeSingle();

      if (!error && data?.content) {
        const content = data.content as unknown as PageVisibilitySettings;
        setSettings({
          public_pages: { ...defaultSettings.public_pages, ...content.public_pages },
          navbar_items: { ...defaultSettings.navbar_items, ...content.navbar_items },
          learn_sidebar: { ...defaultSettings.learn_sidebar, ...content.learn_sidebar },
        });
      }
    } catch (error) {
      console.error('Error fetching page visibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: PageVisibilitySettings) => {
    const { error } = await supabase
      .from('website_content')
      .update({ content: newSettings as any, updated_at: new Date().toISOString() })
      .eq('section_key', 'page_visibility');

    if (error) {
      // Try insert if no row exists
      await supabase.from('website_content').insert({
        section_key: 'page_visibility',
        title: 'Page Visibility Settings',
        content: newSettings as any,
        is_active: true,
      });
    }

    setSettings(newSettings);
  };

  return { settings, loading, saveSettings, refetch: fetchSettings };
};

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { applyTheme, getSavedTheme } from '@/lib/themeUtils';

export function AppInit() {
  useEffect(() => {
    const toAbsoluteUrl = (value: string) => {
      try {
        return new URL(value, window.location.origin).href;
      } catch {
        return value;
      }
    };

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

    const applyDynamicPwaSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('website_content')
          .select('content')
          .eq('section_key', 'pwa_settings')
          .maybeSingle();

        if (error || !data || !data.content) return;

        const pwaSettings = data.content as any;
        
        // Update Title if specified
        if (pwaSettings.appName) {
          document.title = pwaSettings.appName;
        }

        // Update Favicon and Apple Touch Icon if specified
        if (pwaSettings.iconUrl) {
          let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
          if (!faviconLink) {
            faviconLink = document.createElement('link');
            faviconLink.rel = 'icon';
            document.head.appendChild(faviconLink);
          }
          faviconLink.href = pwaSettings.iconUrl;

          let appleIconLink = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
          if (!appleIconLink) {
            appleIconLink = document.createElement('link');
            appleIconLink.rel = 'apple-touch-icon';
            document.head.appendChild(appleIconLink);
          }
          appleIconLink.href = pwaSettings.iconUrl;
        }

        // Dynamically override manifest
        try {
          const res = await fetch('/manifest.webmanifest');
          if (res.ok) {
            const manifest = await res.json();
            
            manifest.name = pwaSettings.appName || manifest.name;
            manifest.short_name = pwaSettings.shortName || manifest.short_name;
            manifest.id = toAbsoluteUrl(manifest.id || '/');
            manifest.start_url = toAbsoluteUrl(manifest.start_url || '/');
            manifest.scope = toAbsoluteUrl(manifest.scope || '/');
            if (pwaSettings.themeColor) {
              manifest.theme_color = pwaSettings.themeColor;
              manifest.background_color = pwaSettings.themeColor;
            }
            if (pwaSettings.iconUrl) {
              const iconUrl = toAbsoluteUrl(pwaSettings.iconUrl);
              manifest.icons = [
                { src: iconUrl, sizes: '192x192', type: 'image/png', purpose: 'any' },
                { src: iconUrl, sizes: '512x512', type: 'image/png', purpose: 'any' },
                { src: iconUrl, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
              ];
            } else if (Array.isArray(manifest.icons)) {
              manifest.icons = manifest.icons.map((icon: any) => ({
                ...icon,
                src: icon?.src ? toAbsoluteUrl(icon.src) : icon?.src,
              }));
            }
            if (Array.isArray(manifest.screenshots)) {
              manifest.screenshots = manifest.screenshots.map((screenshot: any) => ({
                ...screenshot,
                src: screenshot?.src ? toAbsoluteUrl(screenshot.src) : screenshot?.src,
              }));
            }
            
            const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
            const url = URL.createObjectURL(blob);
            
            let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
            if (manifestLink) {
              manifestLink.href = url;
            } else {
              manifestLink = document.createElement('link');
              manifestLink.rel = 'manifest';
              manifestLink.href = url;
              document.head.appendChild(manifestLink);
            }
          }
        } catch (manifestError) {
          console.error('Could not dynamically update manifest', manifestError);
        }
      } catch (err) {
        console.error('Error fetching PWA settings:', err);
      }
    };

    fetchGlobalTheme();
    applyDynamicPwaSettings();
  }, []);

  return null;
}

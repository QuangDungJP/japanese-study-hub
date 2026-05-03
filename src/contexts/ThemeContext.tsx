import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'rose' | 'teal';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeFont = 'system' | 'inter' | 'noto-sans' | 'roboto' | 'merriweather' | 'source-code';
export type ThemeScale = 'compact' | 'medium' | 'large';

interface ThemeContextType {
  themeColor: ThemeColor;
  themeMode: ThemeMode;
  themeFont: ThemeFont;
  themeScale: ThemeScale;
  setThemeColor: (color: ThemeColor) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeFont: (font: ThemeFont) => void;
  setThemeScale: (scale: ThemeScale) => void;
  resolvedMode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const themeColors: Record<ThemeColor, { primary: string; accent: string; ring: string }> = {
  blue: { primary: '215 65% 22%', accent: '32 95% 52%', ring: '215 65% 22%' },
  green: { primary: '142 76% 36%', accent: '142 76% 36%', ring: '142 76% 36%' },
  purple: { primary: '262 83% 58%', accent: '262 83% 58%', ring: '262 83% 58%' },
  orange: { primary: '24 95% 53%', accent: '24 95% 53%', ring: '24 95% 53%' },
  rose: { primary: '346 77% 50%', accent: '346 77% 50%', ring: '346 77% 50%' },
  teal: { primary: '173 80% 40%', accent: '173 80% 40%', ring: '173 80% 40%' },
};

const fontFamilies: Record<ThemeFont, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  inter: '"Inter", sans-serif',
  'noto-sans': '"Noto Sans", sans-serif',
  roboto: '"Roboto", sans-serif',
  merriweather: '"Merriweather", serif',
  'source-code': '"Source Code Pro", monospace',
};

const scaleValues: Record<ThemeScale, string> = {
  compact: '14px',
  medium: '16px',
  large: '18px',
};

const validColors: ThemeColor[] = ['blue', 'green', 'purple', 'orange', 'rose', 'teal'];
const validModes: ThemeMode[] = ['light', 'dark', 'system'];
const validFonts: ThemeFont[] = ['system', 'inter', 'noto-sans', 'roboto', 'merriweather', 'source-code'];
const validScales: ThemeScale[] = ['compact', 'medium', 'large'];

const getSaved = <T extends string>(key: string, valid: T[], fallback: T): T => {
  const saved = localStorage.getItem(key);
  return valid.includes(saved as T) ? (saved as T) : fallback;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeColor, setThemeColorState] = useState<ThemeColor>(() => getSaved('theme-color', validColors, 'blue'));
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => getSaved('theme-mode', validModes, 'light'));
  const [themeFont, setThemeFontState] = useState<ThemeFont>(() => getSaved('theme-font', validFonts, 'system'));
  const [themeScale, setThemeScaleState] = useState<ThemeScale>(() => getSaved('theme-scale', validScales, 'medium'));
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light');
  const [userId, setUserId] = useState<string | null>(null);

  // Load theme from database on auth
  useEffect(() => {
    const loadFromDb = async (uid: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('theme_color, theme_mode, theme_font, theme_scale')
        .eq('user_id', uid)
        .single();

      if (data) {
        if (validColors.includes(data.theme_color as ThemeColor)) {
          setThemeColorState(data.theme_color as ThemeColor);
          localStorage.setItem('theme-color', data.theme_color as string);
        }
        if (validModes.includes(data.theme_mode as ThemeMode)) {
          setThemeModeState(data.theme_mode as ThemeMode);
          localStorage.setItem('theme-mode', data.theme_mode as string);
        }
        if (data.theme_font && validFonts.includes(data.theme_font as ThemeFont)) {
          setThemeFontState(data.theme_font as ThemeFont);
          localStorage.setItem('theme-font', data.theme_font as string);
        }
        if (data.theme_scale && validScales.includes(data.theme_scale as ThemeScale)) {
          setThemeScaleState(data.theme_scale as ThemeScale);
          localStorage.setItem('theme-scale', data.theme_scale as string);
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        loadFromDb(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        loadFromDb(session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save to database
  const saveToDb = useCallback(async (updates: Record<string, string>) => {
    if (!userId) return;
    await supabase.from('profiles').update(updates as never).eq('user_id', userId);
  }, [userId]);

  // Apply theme color
  useEffect(() => {
    const colors = themeColors[themeColor];
    const root = document.documentElement;
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--ring', colors.ring);
    root.style.setProperty(
      '--gradient-primary',
      `linear-gradient(135deg, hsl(${colors.primary}) 0%, hsl(${colors.primary.split(' ')[0]} ${colors.primary.split(' ')[1]} ${parseInt(colors.primary.split(' ')[2]) + 11}%) 100%)`
    );
    localStorage.setItem('theme-color', themeColor);
  }, [themeColor]);

  // Apply font
  useEffect(() => {
    document.documentElement.style.setProperty('--font-family', fontFamilies[themeFont]);
    document.body.style.fontFamily = fontFamilies[themeFont];
    localStorage.setItem('theme-font', themeFont);
  }, [themeFont]);

  // Apply scale
  useEffect(() => {
    document.documentElement.style.fontSize = scaleValues[themeScale];
    localStorage.setItem('theme-scale', themeScale);
  }, [themeScale]);

  // Handle theme mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateResolvedMode = () => {
      const mode: 'light' | 'dark' = themeMode === 'system'
        ? (mediaQuery.matches ? 'dark' : 'light')
        : themeMode;
      setResolvedMode(mode);
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mode);
    };
    updateResolvedMode();
    localStorage.setItem('theme-mode', themeMode);
    mediaQuery.addEventListener('change', updateResolvedMode);
    return () => mediaQuery.removeEventListener('change', updateResolvedMode);
  }, [themeMode]);

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
    saveToDb({ theme_color: color });
  };
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    saveToDb({ theme_mode: mode });
  };
  const setThemeFont = (font: ThemeFont) => {
    setThemeFontState(font);
    saveToDb({ theme_font: font });
  };
  const setThemeScale = (scale: ThemeScale) => {
    setThemeScaleState(scale);
    saveToDb({ theme_scale: scale });
  };

  return (
    <ThemeContext.Provider value={{
      themeColor, themeMode, themeFont, themeScale,
      setThemeColor, setThemeMode, setThemeFont, setThemeScale,
      resolvedMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

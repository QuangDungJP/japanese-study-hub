/**
 * Theme Manager for TNQDO Japanese Study Hub
 * Supports Light/Dark Mode & Custom Japanese Aesthetics Themes
 */

export interface ThemeOption {
  id: string;
  name: string;
  name_ja: string;
  color: string;
  gradient: string;
  bgPreview: string;
  description: string;
  primaryHsl: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'sakura',
    name: 'Hoa Anh Đào (Sakura)',
    name_ja: '桜 (Sakura)',
    color: '#e11d48',
    gradient: 'from-rose-500 via-pink-600 to-indigo-600',
    bgPreview: 'bg-rose-50 border-rose-200 text-rose-700',
    description: 'Hồng anh đào truyền thống Nhật Bản, mang lại cảm giác tươi sáng & tràn đầy cảm hứng học tập.',
    primaryHsl: '343 85% 50%',
  },
  {
    id: 'fuji',
    name: 'Núi Phú Sĩ (Fuji Blue)',
    name_ja: '富士藍 (Fuji Blue)',
    color: '#2563eb',
    gradient: 'from-blue-600 via-indigo-600 to-sky-500',
    bgPreview: 'bg-blue-50 border-blue-200 text-blue-700',
    description: 'Xanh dương ngọc biển đại dương & Núi Phú Sĩ điềm tĩnh, chuyên nghiệp.',
    primaryHsl: '217 91% 60%',
  },
  {
    id: 'matcha',
    name: 'Trà Đạo Kyoto (Kyoto Matcha)',
    name_ja: '抹茶 (Matcha)',
    color: '#16a34a',
    gradient: 'from-emerald-600 via-teal-600 to-green-500',
    bgPreview: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    description: 'Xanh trà đạo Kyoto dịu mắt, thư thái và tập trung học tập đỉnh cao.',
    primaryHsl: '142 71% 45%',
  },
  {
    id: 'tokyo',
    name: 'Tokyo Night (Đêm Tokyo)',
    name_ja: '東京夜景 (Tokyo Night)',
    color: '#7c3aed',
    gradient: 'from-purple-700 via-indigo-800 to-slate-900',
    bgPreview: 'bg-purple-900 border-purple-700 text-purple-200',
    description: 'Chủ đề đêm neon huyền ảo của thủ đô Tokyo, cực kỳ sang trọng & dễ chịu vào buổi tối.',
    primaryHsl: '262 83% 58%',
  },
  {
    id: 'sunburst',
    name: 'Mặt Trời Đỏ (Sunburst Red)',
    name_ja: '日の丸 (Hinomaru)',
    color: '#dc2626',
    gradient: 'from-red-600 via-amber-600 to-rose-700',
    bgPreview: 'bg-red-50 border-red-200 text-red-700',
    description: 'Màu đỏ biểu tượng Nhật Bản nhiệt huyết, bứt phá năng lượng tích lũy XP.',
    primaryHsl: '0 84% 60%',
  },
];

export const getSavedTheme = (): string => {
  return localStorage.getItem('tnqdo_app_theme') || 'sakura';
};

export const applyTheme = (themeId: string) => {
  const theme = THEME_OPTIONS.find(t => t.id === themeId) || THEME_OPTIONS[0];
  document.documentElement.setAttribute('data-theme', theme.id);
  document.documentElement.style.setProperty('--primary-hsl', theme.primaryHsl);
  localStorage.setItem('tnqdo_app_theme', theme.id);
};

export const initTheme = () => {
  const saved = getSavedTheme();
  applyTheme(saved);
};

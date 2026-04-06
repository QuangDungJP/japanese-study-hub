

## Plan: Update Theme Default, Auth Page Improvements & Admin Auth CMS

### 1. Default Light Mode
- In `ThemeContext.tsx`, change default `themeMode` from `'system'` to `'light'` (line 59).

### 2. Update Auth Page (`/auth`)

**2a. Replace teacher image**
- Copy uploaded image `user-uploads://Thiết_kế_chưa_có_tên_2.png` to `public/teachers/quang-dung.png`
- Update `TeacherBranding.tsx` to use the new image path
- Remove the circular border decoration (doesn't match the new image style with QD logo background)
- Adjust sizing for the new image to look clean on all breakpoints

**2b. Fix quote text wrapping**
- Change the quote paragraph to use `whitespace-nowrap` or increase `max-w` so the two lines don't break awkwardly
- Split into two explicit lines if needed for precise control

**2c. Add show/hide password toggle**
- Create a reusable `PasswordInput` component with an eye icon toggle (`Eye`/`EyeOff` from lucide)
- Use it in `LoginForm.tsx` (password field) and `SignUpForm.tsx` (password + confirm password fields)
- Style consistently with existing input design

**2d. Add Google OAuth button**
- Add a "Đăng nhập bằng Google" button with Google icon in `LoginForm.tsx`
- Call `supabase.auth.signInWithOAuth({ provider: 'google' })` on click
- Also show it in `SignUpForm.tsx` as an alternative

### 3. Admin Auth Content Management
- Add a new tab "Trang Auth" in `AdminSettings.tsx` allowing admins to customize:
  - Auth page headline text
  - Quote text
  - Teacher image URL
  - Vertical branding text
  - Welcome header text
- Store in `website_content` table with key like `auth_settings`
- Update `TeacherBranding.tsx`, `AuthHeader.tsx`, and `Auth.tsx` to fetch and use these values (with fallback defaults)

### Files to modify
| File | Change |
|---|---|
| `src/contexts/ThemeContext.tsx` | Default to `'light'` |
| `public/teachers/quang-dung.png` | New image |
| `src/components/auth/TeacherBranding.tsx` | New image, fix quote, use CMS data |
| `src/components/auth/PasswordInput.tsx` | New reusable component |
| `src/components/auth/LoginForm.tsx` | Use PasswordInput, add Google OAuth |
| `src/components/auth/SignUpForm.tsx` | Use PasswordInput |
| `src/components/auth/AuthHeader.tsx` | Use CMS data |
| `src/pages/Auth.tsx` | Use CMS data for title |
| `src/pages/admin/AdminSettings.tsx` | Add "Trang Auth" tab |


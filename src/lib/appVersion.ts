/**
 * App Version Management
 * 
 * APP_VERSION is injected at build time via Vite's `define` config.
 * checkForceUpdate() compares local version with server-side force_update_version.
 * If server version is newer → clear all caches + unregister SW + reload.
 */

// Injected at build time by Vite define config
export const APP_VERSION: string = __APP_VERSION__;
export const APP_BUILD_TIME: string = __APP_BUILD_TIME__;

// Declare globals for TypeScript
declare const __APP_VERSION__: string;
declare const __APP_BUILD_TIME__: string;

const FORCE_UPDATE_KEY = 'app_last_force_update_version';

/**
 * Check if the server requires a force update.
 * Reads `force_update_version` from Supabase `website_content` table.
 * If server version > local cached version → wipe caches and reload.
 */
export async function checkForceUpdate(): Promise<void> {
  try {
    // Dynamic import to avoid circular dependency
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data } = await supabase
      .from('website_content')
      .select('content')
      .eq('section_key', 'force_update_version')
      .maybeSingle();

    if (!data?.content) return;

    const serverVersion = (data.content as any)?.version as string;
    if (!serverVersion) return;

    const localVersion = localStorage.getItem(FORCE_UPDATE_KEY);

    // If server version matches what we already applied, skip
    if (localVersion === serverVersion) return;

    console.log(`[AppVersion] Force update detected: server=${serverVersion}, local=${localVersion || 'none'}`);

    // Mark as applied BEFORE clearing (so we don't loop)
    localStorage.setItem(FORCE_UPDATE_KEY, serverVersion);

    // 1. Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      console.log(`[AppVersion] Cleared ${cacheNames.length} caches`);
    }

    // 2. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
      console.log(`[AppVersion] Unregistered ${registrations.length} service workers`);
    }

    // 3. Hard reload
    window.location.reload();
  } catch (err) {
    // Silent fail — don't break the app if force update check fails
    console.warn('[AppVersion] Force update check failed:', err);
  }
}

/**
 * Get app version info for display in admin panel
 */
export function getVersionInfo() {
  return {
    version: APP_VERSION,
    buildTime: APP_BUILD_TIME,
    swActive: 'serviceWorker' in navigator,
  };
}

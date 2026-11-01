// Shared by the server layout (inline no-flash script) and client components.
export const ADMIN_THEME_KEY = 'bereda-admin-theme';
export type ThemePref = 'system' | 'light' | 'dark';

// Runs before first paint so there is no flash of the wrong theme. The saved
// preference is 'light' | 'dark'; anything else (including nothing) means "follow the OS".
export const ADMIN_THEME_INIT_SCRIPT = `(function(){try{var k='${ADMIN_THEME_KEY}',p=localStorage.getItem(k);if(p!=='light'&&p!=='dark')p='system';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.setAttribute('data-admin-theme',d?'dark':'light');e.setAttribute('data-admin-pref',p)}catch(x){document.documentElement.setAttribute('data-admin-theme','dark')}})();`;

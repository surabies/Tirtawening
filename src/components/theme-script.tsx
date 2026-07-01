// src/components/theme-script.tsx
//
// Taruh <ThemeScript /> di <head> route root (__root.tsx), SEBELUM <Scripts />
// TanStack. Ini mencegah flash-of-wrong-theme saat reload, dengan logika
// yang di-mirror PERSIS dari ThemeToggle.tsx kamu:
//   - localStorage key: "theme"
//   - mode: "light" | "dark" | "auto"
//   - "auto" -> resolve dari prefers-color-scheme, TANPA data-theme attr
//   - "light"/"dark" eksplisit -> set data-theme attr juga

const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var mode = (stored === 'light' || stored === 'dark' || stored === 'auto')
      ? stored
      : 'auto';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode;

    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);

    if (mode === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', mode);
    }

    root.style.colorScheme = resolved;
  } catch (e) {}
})();
`

export function ThemeScript() {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />
}
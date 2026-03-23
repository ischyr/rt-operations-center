import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

// ── Font family map ────────────────────────────────────────────────────────
const FONTS = {
  inter:     "'Inter', -apple-system, sans-serif",
  jetbrains: "'JetBrains Mono', 'Courier New', monospace",
  system:    "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

// ── Font size map (base px) ────────────────────────────────────────────────
const FONT_SIZES = {
  sm: '12px',
  md: '14px',
  lg: '16px',
};

const DEFAULTS = {
  colorMode:     'dark',   // 'dark' | 'light'
  fontFamily:    'inter',  // 'inter' | 'jetbrains' | 'system'
  fontSize:      'md',     // 'sm' | 'md' | 'lg'
  compactMode:   false,
  reducedMotion: false,
};

const load = () => {
  try {
    const raw = localStorage.getItem('rtoc-settings');
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};

// Apply settings immediately to the document root
const apply = (settings) => {
  const root = document.documentElement;
  root.setAttribute('data-theme',          settings.colorMode);
  root.setAttribute('data-compact',        settings.compactMode    ? 'true' : 'false');
  root.setAttribute('data-reduced-motion', settings.reducedMotion  ? 'true' : 'false');
  root.style.setProperty('--app-font',      FONTS[settings.fontFamily]  || FONTS.inter);
  root.style.setProperty('--app-font-size', FONT_SIZES[settings.fontSize] || FONT_SIZES.md);
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const initial = load();
    apply(initial); // apply synchronously before first paint
    return initial;
  });

  // Re-apply whenever settings change
  useEffect(() => {
    apply(settings);
  }, [settings]);

  const update = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('rtoc-settings', JSON.stringify(next));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem('rtoc-settings');
    setSettings(DEFAULTS);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </SettingsContext.Provider>
  );
};

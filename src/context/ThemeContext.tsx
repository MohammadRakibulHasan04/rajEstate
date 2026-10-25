import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light';
type AccentTone = 'champagne' | 'monochrome' | 'bronze';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  accentTone: AccentTone;
  setAccentTone: (tone: AccentTone) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('aura_theme_mode');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  const [accentTone, setAccentToneState] = useState<AccentTone>(() => {
    const saved = localStorage.getItem('aura_accent_tone');
    return saved === 'champagne' || saved === 'monochrome' || saved === 'bronze' ? saved : 'champagne';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('aura_theme_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('aura_accent_tone', accentTone);
  }, [accentTone]);

  const toggleTheme = () => {
    setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const setAccentTone = (newTone: AccentTone) => {
    setAccentToneState(newTone);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setMode, accentTone, setAccentTone }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

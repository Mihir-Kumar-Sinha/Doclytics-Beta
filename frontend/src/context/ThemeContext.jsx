import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [preferences, setPreferences] = useState({
    theme: 'light',
    llmModel: 'auto',
    emailNotifications: true,
  });
  const [toast, setToast] = useState('');

  // Load saved preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem('doclytics_prefs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
        setTheme(parsed.theme || 'light');
      } catch (e) {}
    }
  }, []);

  // Apply theme class to <html> element whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const updatePreferences = (newPrefs) => {
    setPreferences(newPrefs);
    setTheme(newPrefs.theme || 'light');
    localStorage.setItem('doclytics_prefs', JSON.stringify(newPrefs));
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 4000);
  };

  return (
    <ThemeContext.Provider value={{ theme, preferences, updatePreferences, toast, showToast }}>
      {children}
      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-slide-up">
          <div className={`px-5 py-3 rounded-xl shadow-2xl font-medium text-sm border ${
            theme === 'dark' 
              ? 'bg-slate-800 text-green-400 border-green-800 shadow-green-900/30' 
              : 'bg-white text-green-700 border-green-200 shadow-green-100/50'
          }`}>
            {toast}
          </div>
        </div>
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

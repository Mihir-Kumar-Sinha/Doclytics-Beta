import { useState, useEffect } from 'react';
import { Settings, Save, Palette, Bell, User, Moon, Sun, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function SettingsTab({ user }) {
  const { theme, preferences, updatePreferences, showToast } = useTheme();
  const isDark = theme === 'dark';

  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [saveMessage, setSaveMessage] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Keep localPrefs in sync when preferences change externally
  useEffect(() => {
    setTimeout(() => setLocalPrefs(preferences), 0);
  }, [preferences]);

  // Track unsaved changes
  useEffect(() => {
    const changed = JSON.stringify(localPrefs) !== JSON.stringify(preferences);
    setTimeout(() => setHasChanges(changed), 0);
  }, [localPrefs, preferences]);

  const handleSave = () => {
    updatePreferences(localPrefs);
    setSaveMessage("Settings saved successfully!");
    showToast("✅ Settings applied successfully!");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  // Apply theme immediately on toggle for live preview
  const handleThemeChange = (newTheme) => {
    setLocalPrefs({ ...localPrefs, theme: newTheme });
    // Apply immediately for live preview
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className={`border rounded-xl p-8 shadow-sm transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`flex items-center space-x-3 mb-6 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <Settings className={`w-6 h-6 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Application Settings</h2>
          {hasChanges && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded ml-auto ${isDark ? 'bg-amber-900/50 text-amber-400 border border-amber-700' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
              Unsaved Changes
            </span>
          )}
        </div>

        <div className="space-y-8">
          {/* Profile Settings */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className={`text-lg font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Profile Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>User Name</label>
                <input 
                  type="text" 
                  value={user.name}
                  disabled
                  className={`w-full border rounded-lg px-4 py-2.5 font-medium cursor-not-allowed transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`} 
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Email Address</label>
                <input 
                  type="email" 
                  value={user.email}
                  disabled
                  className={`w-full border rounded-lg px-4 py-2.5 font-medium cursor-not-allowed transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`} 
                />
              </div>
            </div>
            <p className={`text-xs mt-2 font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Profile details are managed via the login screen.</p>
          </section>

          {/* Theme Selection */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Palette className="w-5 h-5 text-purple-600" />
              <h3 className={`text-lg font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Appearance</h3>
            </div>
            
            <label className={`block text-sm font-bold mb-3 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>UI Theme</label>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              {/* Light */}
              <button
                onClick={() => handleThemeChange('light')}
                className={`relative flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  localPrefs.theme === 'light'
                    ? 'border-blue-500 shadow-lg shadow-blue-500/10 bg-blue-50'
                    : isDark
                      ? 'border-slate-700 hover:border-slate-600 bg-slate-800'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {localPrefs.theme === 'light' && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                  localPrefs.theme === 'light' ? 'bg-blue-100' : isDark ? 'bg-slate-700' : 'bg-slate-100'
                }`}>
                  <Sun className={`w-6 h-6 ${localPrefs.theme === 'light' ? 'text-blue-600' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                </div>
                <span className={`font-bold text-sm ${localPrefs.theme === 'light' ? 'text-blue-700' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>Light</span>
                <span className={`text-xs mt-0.5 ${localPrefs.theme === 'light' ? 'text-blue-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>Clean & bright</span>
              </button>

              {/* Dark */}
              <button
                onClick={() => handleThemeChange('dark')}
                className={`relative flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  localPrefs.theme === 'dark'
                    ? 'border-blue-500 shadow-lg shadow-blue-500/10 bg-slate-800'
                    : isDark
                      ? 'border-slate-700 hover:border-slate-600 bg-slate-800'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {localPrefs.theme === 'dark' && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                  </div>
                )}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                  localPrefs.theme === 'dark' ? 'bg-slate-700' : isDark ? 'bg-slate-700' : 'bg-slate-100'
                }`}>
                  <Moon className={`w-6 h-6 ${localPrefs.theme === 'dark' ? 'text-blue-400' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                </div>
                <span className={`font-bold text-sm ${localPrefs.theme === 'dark' ? 'text-blue-400' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>Dark</span>
                <span className={`text-xs mt-0.5 ${localPrefs.theme === 'dark' ? 'text-blue-500/70' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>Easy on the eyes</span>
              </button>
            </div>
          </section>



          {/* Notifications */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Bell className="w-5 h-5 text-teal-600" />
              <h3 className={`text-lg font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Notifications</h3>
            </div>
            <label className="flex items-center space-x-3 cursor-pointer">
              {/* Custom toggle */}
              <div 
                onClick={() => setLocalPrefs({...localPrefs, emailNotifications: !localPrefs.emailNotifications})}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${localPrefs.emailNotifications ? 'bg-blue-600' : isDark ? 'bg-slate-700' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${localPrefs.emailNotifications ? 'translate-x-[22px]' : 'translate-x-0.5'}`}></div>
              </div>
              <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Enable in-app notifications for document processing & actions
              </span>
            </label>
            <p className={`text-xs mt-2 ml-14 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              When enabled, you'll see toast notifications for uploads, analysis completions, and other events.
            </p>
          </section>

          {/* Save Bar */}
          <div className={`pt-6 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            {saveMessage ? (
              <span className={`font-bold text-sm px-3 py-1 rounded border ${isDark ? 'text-green-400 bg-green-900/30 border-green-800' : 'text-green-600 bg-green-50 border-green-200'}`}>{saveMessage}</span>
            ) : (
              <span></span>
            )}
            <button 
              onClick={handleSave}
              className={`flex items-center space-x-2 text-white px-6 py-2.5 rounded-lg font-bold transition shadow-md ${
                hasChanges 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' 
                  : isDark 
                    ? 'bg-slate-700 text-slate-400 cursor-default' 
                    : 'bg-slate-300 text-slate-500 cursor-default'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

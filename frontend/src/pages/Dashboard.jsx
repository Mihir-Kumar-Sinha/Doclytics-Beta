import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Upload as UploadIcon, FileText, BarChart2, MessageSquare, Settings, Bell, ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

import HomeTab from '../components/dashboard/HomeTab';
import UploadTab from '../components/dashboard/UploadTab';
import DocumentsTab from '../components/dashboard/DocumentsTab';
import AnalyticsTab from '../components/dashboard/AnalyticsTab';
import ChatTab from '../components/dashboard/ChatTab';
import SettingsTab from '../components/dashboard/SettingsTab';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, preferences, showToast } = useTheme();
  const isDark = theme === 'dark';
  const [user, setUser] = useState({ name: 'Guest User', email: 'guest@example.com', initials: 'G' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem('doclytics_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const init = parsed.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
        setUser({ name: parsed.name, email: parsed.email, initials: init });
      } catch(e){}
    }
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('doclytics_user');
    if (preferences.emailNotifications) {
      showToast('You have been logged out successfully.');
    }
    navigate('/login');
  };
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home className="w-5 h-5" /> },
    { name: 'Documents', path: '/dashboard/documents', icon: <FileText className="w-5 h-5" /> },
    { name: 'Analytics', path: '/dashboard/analytics', icon: <BarChart2 className="w-5 h-5" /> },
    { name: 'Chat AI', path: '/dashboard/chat', icon: <MessageSquare className="w-5 h-5" /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const currentItem = navItems.find(item => location.pathname === item.path) || navItems[0];

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar (Desktop only) */}
      <aside className={`w-64 border-r flex flex-col fixed h-full z-20 hidden md:flex shadow-sm transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="p-6 flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Doclytics</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition font-medium ${
                  isActive 
                    ? isDark 
                      ? 'bg-blue-900/40 text-blue-400 border-l-2 border-blue-500 shadow-sm' 
                      : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600 shadow-sm' 
                    : isDark 
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
        
        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className={`flex items-center space-x-3 p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {user.initials}
            </div>
            <div className="overflow-hidden flex-1">
              <div className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</div>
              <div className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</div>
            </div>
            <button onClick={handleLogout} title="Logout" className={`p-1.5 rounded-lg transition ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-slate-800' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Over Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className={`fixed left-0 top-0 bottom-0 w-72 flex flex-col shadow-2xl transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Doclytics</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className={`p-2 rounded-lg ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 space-y-1.5 mt-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                return (
                  <Link key={item.name} to={item.path} className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition font-medium ${
                    isActive 
                      ? isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-700' 
                      : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'
                  }`}>
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center space-x-3 p-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                  {user.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</div>
                  <div className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</div>
                </div>
              </div>
              <button onClick={handleLogout} className={`w-full mt-3 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-16 md:pb-0">
        {/* Topbar */}
        <header className={`h-14 sm:h-16 backdrop-blur-md border-b flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 shadow-sm transition-colors duration-300 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
          <div className="flex items-center space-x-3">
            <button onClick={() => setMobileMenuOpen(true)} className={`md:hidden p-1.5 rounded-lg transition ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentItem.name}</h1>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button className={`transition relative ${isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-400 hover:text-blue-600'}`}>
              <Bell className="w-5 h-5" />
              <span className={`absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 ${isDark ? 'border-slate-900' : 'border-white'}`}></span>
            </button>
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {user.initials}
              </div>
              <span className={`text-sm font-bold hidden sm:block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{user.name}</span>
              <ChevronDown className={`w-4 h-4 hidden sm:block ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6">
          <Routes>
            <Route path="/" element={<HomeTab />} />
            <Route path="documents" element={<DocumentsTab />} />
            <Route path="analytics" element={<AnalyticsTab />} />
            <Route path="chat" element={<ChatTab userName={user.name} />} />
            <Route path="settings" element={<SettingsTab user={user} />} />
            <Route path="*" element={<div className={`text-center py-20 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Page under construction</div>} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 z-30 md:hidden border-t flex items-center justify-around py-2 transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {navItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <Link key={item.name} to={item.path} className={`flex flex-col items-center px-2 py-1.5 rounded-lg transition ${
              isActive 
                ? isDark ? 'text-blue-400' : 'text-blue-600' 
                : isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {item.icon}
              <span className="text-[10px] font-bold mt-0.5">{item.name.replace(' AI', '')}</span>
            </Link>
          );
        })}
        <button onClick={() => setMobileMenuOpen(true)} className={`flex flex-col items-center px-2 py-1.5 rounded-lg transition ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">More</span>
        </button>
      </nav>
    </div>
  );
}

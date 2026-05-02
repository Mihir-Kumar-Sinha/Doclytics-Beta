import React, { useState, useEffect } from 'react';
import { FileText, Brain, BarChart2, MessageSquare, Zap, Shield } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import API from '../../config/api';

export default function HomeTab() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState({ documents: 0, insights: 0, visualizations: 0, queries: 0 });

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(API.stats);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.log('Failed to fetch stats');
    }
  };

  const statCards = [
    { label: "Documents Analyzed", value: stats.documents, icon: <FileText className="w-5 h-5 text-blue-600" />, lightColor: "bg-blue-50 border-blue-100", darkColor: "bg-blue-950/30 border-blue-900/50" },
    { label: "Insights Generated", value: stats.insights, icon: <Brain className="w-5 h-5 text-purple-600" />, lightColor: "bg-purple-50 border-purple-100", darkColor: "bg-purple-950/30 border-purple-900/50" },
    { label: "Visualizations", value: stats.visualizations, icon: <BarChart2 className="w-5 h-5 text-teal-600" />, lightColor: "bg-teal-50 border-teal-100", darkColor: "bg-teal-950/30 border-teal-900/50" },
    { label: "AI Queries", value: stats.queries, icon: <MessageSquare className="w-5 h-5 text-green-600" />, lightColor: "bg-green-50 border-green-100", darkColor: "bg-green-950/30 border-green-900/50" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`p-6 rounded-2xl border shadow-sm transition-colors duration-300 ${isDark ? `${stat.darkColor} bg-slate-900` : `${stat.lightColor} bg-white`}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>{stat.icon}</div>
              {stat.value > 0 ? (
                <span className={`text-xs font-medium px-2 py-0.5 rounded flex items-center space-x-1 ${isDark ? 'text-green-400 bg-green-900/40' : 'text-green-700 bg-green-100'}`}>
                  <span>↑</span> <span>Live</span>
                </span>
              ) : null}
            </div>
            <div className={`text-3xl font-extrabold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value.toLocaleString()}</div>
            <div className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Features Highlighting Section */}
      <div className={`border rounded-2xl shadow-sm p-8 md:p-12 text-center transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
         <h2 className={`text-2xl md:text-4xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Everything you need for document intelligence</h2>
         <p className={`font-medium text-lg max-w-2xl mx-auto mb-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>From raw documents to structured insights — powered by AI at every step.</p>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { icon: <FileText className="w-6 h-6 text-blue-600" />, title: "Smart Document Parsing", desc: "Upload PDF, CSV, Excel, and DOCX files. Our AI extracts key data points automatically." },
              { icon: <Brain className="w-6 h-6 text-blue-600" />, title: "AI-Powered Insights", desc: "Get actionable business insights with priority scores and trend analysis." },
              { icon: <BarChart2 className="w-6 h-6 text-blue-600" />, title: "Interactive Visualizations", desc: "Generate beautiful charts and dashboards from your document data." },
              { icon: <MessageSquare className="w-6 h-6 text-blue-600" />, title: "AI Chat Assistant", desc: "Ask questions about your documents and get instant, referenced answers." },
              { icon: <Zap className="w-6 h-6 text-blue-600" />, title: "Instant Analysis", desc: "Process thousands of pages in seconds with our optimized AI pipeline." },
              { icon: <Shield className="w-6 h-6 text-blue-600" />, title: "Enterprise Security", desc: "SOC2 compliant with end-to-end encryption. Your data stays private." }
            ].map((feat, i) => (
              <div key={i} className={`border p-6 rounded-xl hover:shadow-md transition duration-300 ${isDark ? 'border-slate-800 bg-slate-800/50 hover:bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-4 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  {feat.icon}
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{feat.title}</h3>
                <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{feat.desc}</p>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Brain, PieChart, MessageSquare, Upload, Activity, Download, Shield, Zap, BarChart2, Play, ArrowRight, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../config/api';

// Animated Counter component
const AnimatedCounter = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 900;
    const startValue = displayValue;
    const endValue = value;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(Math.floor(startValue + easeOut * (endValue - startValue)));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };
    
    if (startValue !== endValue) {
      window.requestAnimationFrame(step);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
};

export default function Landing() {
  const [stats, setStats] = useState({ documents: 0, insights: 0, visualizations: 0, queries: 0 });
  const [toastMessage, setToastMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch(API.stats);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Stats fetch failed', e);
    }
  };

  useEffect(() => {
    setTimeout(fetchStats, 0);
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const simulateAction = async (action) => {
    try {
      await fetch(API.statsSimulate(action), { method: 'POST' });
      fetchStats();
      setToastMessage(`Action '${action}' successful — stats updated!`);
      setTimeout(() => setToastMessage(""), 3000);
    } catch (e) {
      console.error('Simulation failed', e);
    }
  };

  const statCards = [
    { label: "Documents Analyzed", value: stats.documents, icon: <FileText className="w-5 h-5 text-blue-500" />, color: "border-blue-100 bg-blue-50" },
    { label: "Insights Generated", value: stats.insights, icon: <Brain className="w-5 h-5 text-purple-500" />, color: "border-purple-100 bg-purple-50" },
    { label: "Visualizations", value: stats.visualizations, icon: <PieChart className="w-5 h-5 text-teal-500" />, color: "border-teal-100 bg-teal-50" },
    { label: "AI Queries", value: stats.queries, icon: <MessageSquare className="w-5 h-5 text-green-500" />, color: "border-green-100 bg-green-50" },
  ];

  return (
    <div className="min-h-screen bg-lavender-gradient font-sans text-slate-900">
      {/* Navbar */}
      <nav className="glass-nav sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">Doclytics</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <a href="#features" className="text-slate-600 hover:text-slate-900 transition">Features</a>
          <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition">How it Works</a>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/login" className="font-medium text-slate-600 hover:text-slate-900 transition text-sm">Log in</Link>
          <Link to="/signup" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-medium text-sm transition shadow-sm">Get Started</Link>
        </div>
        <div className="md:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 right-0 w-64 h-full bg-white shadow-2xl p-6 flex flex-col space-y-6">
              <div className="flex justify-end">
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                  <span className="text-slate-600 text-xl font-bold">✕</span>
                </button>
              </div>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 font-medium text-lg hover:text-blue-600 transition">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 font-medium text-lg hover:text-blue-600 transition">How it Works</a>
              <Link to="/login" className="text-slate-700 font-medium text-lg hover:text-blue-600 transition">Log in</Link>
              <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-center transition shadow-sm">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-white text-slate-600 px-4 py-1.5 rounded-full text-sm font-medium mb-8 shadow-sm border border-slate-200">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>AI-Powered Document Intelligence</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-black mb-4 tracking-tight leading-tight">
          Turn business<br />documents into <br /><span className="text-gradient">insights</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-500 max-w-3xl mx-auto mb-10 leading-relaxed font-medium mt-6">
          Upload reports, analyze data, generate insights, and visualize trends — all powered by AI. From PDFs to actionable intelligence in seconds.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link to="/signup" className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg font-medium text-lg transition w-full sm:w-auto justify-center shadow-lg shadow-blue-600/20">
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <button className="flex items-center space-x-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-8 py-3.5 rounded-lg font-medium text-lg transition w-full sm:w-auto justify-center shadow-sm">
            <Play className="w-5 h-5 fill-current" />
            <span>Watch Demo</span>
          </button>
        </div>
      </section>

      {/* Dashboard Preview Card */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl shadow-slate-200/50">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center">
            <div className="flex space-x-2 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <span className="text-sm text-slate-500 font-medium">Doclytics Dashboard</span>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat, idx) => (
                <div key={idx} className={`p-5 rounded-xl border ${stat.color} flex flex-col shadow-sm`}>
                  <div className="flex items-center justify-between mb-4">
                    {stat.icon}
                    {stat.value > 0 ? (
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center space-x-1">
                        <span>↑</span> <span>Live</span>
                      </span>
                    ) : null}
                  </div>
                  <div className="text-3xl font-bold text-slate-800 mb-1">
                    <AnimatedCounter value={stat.value} />
                  </div>
                  <div className="text-sm font-medium text-slate-500">{stat.label}</div>
                  {stat.value === 0 && <div className="text-xs text-slate-400 mt-2">Start using to see stats</div>}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button onClick={() => simulateAction('upload')} className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium transition flex items-center space-x-2 shadow-sm">
                <Upload className="w-4 h-4" /> <span>Upload Document</span>
              </button>
              <button onClick={() => simulateAction('query')} className="px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-sm font-medium transition flex items-center space-x-2 shadow-sm">
                <MessageSquare className="w-4 h-4" /> <span>Ask AI Query</span>
              </button>
              <button onClick={() => simulateAction('bulk')} className="px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-lg text-sm font-medium transition flex items-center space-x-2 shadow-sm">
                <FileText className="w-4 h-4" /> <span>Bulk Upload (5 docs)</span>
              </button>
            </div>
            
            {toastMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mt-4 text-center text-sm font-medium text-green-700 bg-green-50 py-2 rounded border border-green-200"
              >
                {toastMessage}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-black mb-4">Everything you need for document intelligence</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto font-medium">From raw documents to structured insights — powered by AI at every step.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <FileText className="w-6 h-6 text-blue-600" />, title: "Smart Document Parsing", desc: "Upload PDF, CSV, Excel, and DOCX files. Our AI extracts key data points automatically." },
              { icon: <Brain className="w-6 h-6 text-blue-600" />, title: "AI-Powered Insights", desc: "Get actionable business insights with priority scores and trend analysis." },
              { icon: <BarChart2 className="w-6 h-6 text-blue-600" />, title: "Interactive Visualizations", desc: "Generate beautiful charts and dashboards from your document data." },
              { icon: <MessageSquare className="w-6 h-6 text-blue-600" />, title: "AI Chat Assistant", desc: "Ask questions about your documents and get instant, referenced answers." },
              { icon: <Zap className="w-6 h-6 text-blue-600" />, title: "Instant Analysis", desc: "Process thousands of pages in seconds with our optimized AI pipeline." },
              { icon: <Shield className="w-6 h-6 text-blue-600" />, title: "Enterprise Security", desc: "SOC2 compliant with end-to-end encryption. Your data stays private." }
            ].map((feat, i) => (
              <div key={i} className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-md transition duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feat.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-black">From documents to decisions in minutes</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-100 via-blue-300 to-blue-100 -z-10"></div>
            
            {[
              { num: "01", icon: <Upload className="w-6 h-6 text-blue-600" />, title: "Upload Documents", desc: "Drag and drop your PDF, CSV, Excel, or DOCX files into the platform." },
              { num: "02", icon: <Brain className="w-6 h-6 text-blue-600" />, title: "AI Processes Data", desc: "Our AI engine parses, extracts, and structures the key information." },
              { num: "03", icon: <Activity className="w-6 h-6 text-blue-600" />, title: "Generate Insights", desc: "Get summaries, KPIs, trends, and actionable business intelligence." },
              { num: "04", icon: <Download className="w-6 h-6 text-blue-600" />, title: "Export & Share", desc: "Download reports, share dashboards, and export data in any format." }
            ].map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-20 h-20 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mb-6 relative">
                  <div className="absolute -top-2 -right-2 text-xs font-mono font-bold text-white bg-blue-600 px-2 py-1 rounded-full shadow-sm">{step.num}</div>
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Doclytics</span>
          </div>
          <div className="flex space-x-6 mb-4 md:mb-0">
            {["Privacy", "Terms", "Support", "Docs"].map(link => (
              <a key={link} href="#" className="text-slate-500 hover:text-blue-600 font-medium transition text-sm">{link}</a>
            ))}
          </div>
          <div className="text-slate-400 font-medium text-sm">
            &copy; 2026 Doclytics. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

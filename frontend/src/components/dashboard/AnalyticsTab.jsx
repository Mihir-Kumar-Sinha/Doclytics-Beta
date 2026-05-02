import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BarChart2, TrendingUp, TrendingDown, LayoutGrid, FileText, Download, Brain } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Pie, Line, Scatter } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';
import API from '../../config/api';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

export default function AnalyticsTab() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialDocId = queryParams.get('doc');
  const { theme, preferences, showToast } = useTheme();
  const isDark = theme === 'dark';

  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(initialDocId || '');
  const [docData, setDocData] = useState(null);
  const [selectedChart, setSelectedChart] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocs();
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      fetchDocData(selectedDocId);
    } else {
      setDocData(null);
    }
  }, [selectedDocId]);

  const fetchDocs = async () => {
    try {
      const res = await fetch(API.documents);
      if (res.ok) {
        const data = await res.json();
        const readyDocs = data.filter(d => d.status === 'Ready');
        setDocuments(readyDocs);
        if (!selectedDocId && readyDocs.length > 0) {
          setSelectedDocId(readyDocs[0].id);
        }
      }
    } catch (e) {
      console.log('Failed to fetch docs');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocData = async (id) => {
    try {
      const res = await fetch(API.document(id));
      if (res.ok) {
        const data = await res.json();
        setDocData(data);
      }
    } catch (e) {
      console.log('Failed to fetch doc data');
    }
  };

  const handleExport = async () => {
    if (!selectedDocId) return;
    try {
      const res = await fetch(API.documentExport(selectedDocId));
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `doclytics_export_${selectedDocId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        if (preferences.emailNotifications) {
          showToast('📥 Analysis exported successfully');
        }
      }
    } catch (e) {
      alert("Export failed");
    }
  };

  if (loading) {
    return <div className={`p-12 text-center font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading analytics engine...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 text-center border rounded-xl shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <BarChart2 className="w-12 h-12 text-slate-400 mb-4" />
        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No data to analyze</h3>
        <p className={`font-medium mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Upload and process a document first to view analytics.</p>
      </div>
    );
  }

  const gridColor = isDark ? '#334155' : '#f1f5f9';
  const tickColor = isDark ? '#94a3b8' : '#64748b';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: tickColor } },
      title: { display: false }
    },
    scales: {
      x: { ticks: { color: tickColor }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor }, grid: { color: gridColor } }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: tickColor } }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Controls */}
      <div className={`flex flex-col md:flex-row justify-between items-center border shadow-sm p-4 rounded-xl gap-4 transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isDark ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-100'}`}>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <select 
            value={selectedDocId} 
            onChange={(e) => setSelectedDocId(e.target.value)}
            className={`border font-medium text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 max-w-xs transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
          >
            {documents.map(d => <option key={d.id} value={d.id}>{d.name} ({d.classification})</option>)}
          </select>
        </div>
        <button onClick={handleExport} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition w-full md:w-auto justify-center shadow-sm">
          <Download className="w-4 h-4" />
          <span>Export JSON</span>
        </button>
      </div>

      {docData && (
        <>
          {/* Executive Summary */}
          <div className={`border shadow-sm rounded-xl p-6 transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="w-5 h-5 text-purple-600" />
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Executive Summary</h2>
            </div>
            <p className={`font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{docData.summary}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KPIs */}
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(docData.kpis || {}).map(([key, val], idx) => (
                <div key={idx} className={`border shadow-sm rounded-xl p-5 flex flex-col justify-center transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className={`font-medium text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{key}</div>
                  <div className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{val}</div>
                </div>
              ))}
            </div>

            {/* AI Insights */}
            <div className={`border shadow-sm rounded-xl p-6 flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="w-5 h-5 text-purple-600" />
                <h3 className={`text-md font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>AI Insights</h3>
              </div>
              <ul className="space-y-4 overflow-y-auto max-h-64 pr-2">
                {(docData.insights || []).map((ins, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {ins.trend === 'up' ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                    </div>
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{ins.insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Charts Section */}
          <div className={`border shadow-sm rounded-xl p-6 transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <h3 className={`text-lg font-bold flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <BarChart2 className="w-5 h-5 text-teal-600" />
                <span>Data Visualizations</span>
              </h3>
              
              <div className={`flex items-center space-x-2 mt-4 md:mt-0 p-1 rounded-lg border overflow-x-auto ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                {['All', 'Bar', 'Pie', 'Line', 'Area', 'Scatter', 'Histogram'].map(type => (
                  <button 
                    key={type}
                    onClick={() => setSelectedChart(type)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                      selectedChart === type 
                        ? isDark 
                          ? 'bg-slate-700 text-white shadow-sm border border-slate-600' 
                          : 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                        : isDark 
                          ? 'text-slate-400 hover:text-slate-200' 
                          : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {(!docData.charts || Object.keys(docData.charts).length === 0 || !docData.charts.Bar?.labels?.length) ? (
              <div className={`h-64 flex flex-col items-center justify-center rounded-lg border border-dashed font-medium ${isDark ? 'text-slate-400 bg-slate-800 border-slate-700' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                <LayoutGrid className="w-8 h-8 mb-2 opacity-50" />
                <p>No tabular data found to generate charts.</p>
              </div>
            ) : (
              <div className={`grid grid-cols-1 ${selectedChart === 'All' ? 'lg:grid-cols-2 gap-6' : ''}`}>
                {(selectedChart === 'All' || selectedChart === 'Bar') && docData.charts.Bar && (
                  <div className={`border p-4 rounded-xl h-72 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <h4 className={`text-sm font-bold mb-2 text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Bar Chart</h4>
                    <Bar data={docData.charts.Bar} options={chartOptions} />
                  </div>
                )}
                {(selectedChart === 'All' || selectedChart === 'Pie') && docData.charts.Pie && (
                  <div className={`border p-4 rounded-xl h-72 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <h4 className={`text-sm font-bold mb-2 text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Pie Chart</h4>
                    <Pie data={docData.charts.Pie} options={pieOptions} />
                  </div>
                )}
                {(selectedChart === 'All' || selectedChart === 'Line') && docData.charts.Line && (
                  <div className={`border p-4 rounded-xl h-72 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <h4 className={`text-sm font-bold mb-2 text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Line Chart</h4>
                    <Line data={docData.charts.Line} options={chartOptions} />
                  </div>
                )}
                {(selectedChart === 'All' || selectedChart === 'Area') && docData.charts.Area && (
                  <div className={`border p-4 rounded-xl h-72 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <h4 className={`text-sm font-bold mb-2 text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Area Chart</h4>
                    <Line data={docData.charts.Area} options={chartOptions} />
                  </div>
                )}
                {(selectedChart === 'All' || selectedChart === 'Scatter') && docData.charts.Scatter && (
                  <div className={`border p-4 rounded-xl h-72 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <h4 className={`text-sm font-bold mb-2 text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Scatter Plot</h4>
                    <Scatter data={docData.charts.Scatter} options={chartOptions} />
                  </div>
                )}
                {(selectedChart === 'All' || selectedChart === 'Histogram') && docData.charts.Histogram && (
                  <div className={`border p-4 rounded-xl h-72 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <h4 className={`text-sm font-bold mb-2 text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Histogram</h4>
                    <Bar data={docData.charts.Histogram} options={chartOptions} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Data Analyst Chatbot */}
          <div className={`border shadow-sm rounded-xl overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`p-4 border-b flex items-center space-x-2 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <Brain className="w-5 h-5 text-purple-600" />
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>AI Data Analyst</h3>
            </div>
            <div className="p-0 h-96">
              {/* We embed a dedicated chat view for this doc */}
              <AnalyticsChat docId={selectedDocId} isDark={isDark} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AnalyticsChat({ docId, isDark }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I am your AI Data Analyst. Ask me anything about the analytics, trends, or underlying data in this document." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = React.useRef(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(API.analyticsQuery(docId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...newMessages, { role: 'assistant', content: data.answer }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error answering your question.' }]);
      }
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: 'Network error. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-2xl max-w-[85%] text-sm font-medium ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none shadow-sm' 
                : isDark 
                  ? 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700 shadow-sm' 
                  : 'bg-slate-50 text-slate-800 rounded-bl-none border border-slate-200 shadow-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className={`p-3 rounded-2xl rounded-bl-none border shadow-sm text-sm font-medium ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
              Analyzing data...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className={`p-3 border-t ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <form onSubmit={handleSend} className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Ask about these visualizations..."
            className={`w-full border rounded-lg pl-4 pr-12 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 transition ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
          />
          <button 
            type="submit" 
            disabled={isTyping || !input.trim()}
            className={`absolute right-2 p-1.5 rounded-md transition disabled:opacity-50 ${isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    </div>
  );
}

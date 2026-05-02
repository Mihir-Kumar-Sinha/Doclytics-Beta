import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Send, Bot, User, FileText, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import API from '../../config/api';

export default function ChatTab({ userName }) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialDocId = queryParams.get('doc');
  const { theme, preferences, showToast } = useTheme();
  const isDark = theme === 'dark';

  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(initialDocId || 'general');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello ${userName}! I am your AI assistant. You can ask me general questions or select a specific document to analyze.`, sources: [] }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchDocs = async () => {
    try {
      const res = await fetch(API.documents);
      if (res.ok) {
        const data = await res.json();
        const readyDocs = data.filter(d => d.status === 'Ready');
        setDocuments(readyDocs);
      }
    } catch (e) {
      console.log('Failed to fetch docs');
    }
  };

  const handleSend = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const text = textOverride || input;
    if (!text.trim() || isTyping) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const endpoint = selectedDocId === 'general' 
        ? API.chat 
        : API.documentQuery(selectedDocId);
        
      // Send model preference from settings
      const body = { 
        question: text,
        preferred_model: preferences.llmModel || 'auto'
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: data.answer,
          sources: data.sources || []
        }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error answering your question.', sources: [] }]);
      }
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: 'Network error. Please try again.', sources: [] }]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestedQuestions = selectedDocId === 'general' 
    ? ["Write a professional email", "Explain AI to me", "Help me brainstorm ideas"]
    : ["What was the highest revenue month?", "Summarize this document", "What are the key risks?"];

  const SourceDropdown = ({ sources }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (!sources || sources.length === 0) return null;
    
    return (
      <div className={`mt-3 text-sm border-t pt-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center space-x-1 transition text-xs font-bold ${isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'}`}>
          <span>{isOpen ? 'Hide Sources' : 'View Sources'}</span>
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <ul className={`mt-2 space-y-2 p-3 rounded-lg border text-xs ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                {sources.map((src, i) => (
                  <li key={i} className="leading-relaxed"><span className="text-blue-600 font-bold">[{i+1}]</span> {src}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={`max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col border rounded-xl overflow-hidden shadow-sm transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      {/* Top Header */}
      <div className={`p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 shadow-sm ${isDark ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200'}`}>
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <select 
            value={selectedDocId} 
            onChange={(e) => setSelectedDocId(e.target.value)}
            className={`border font-bold text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 shadow-sm transition-colors ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
          >
            <option value="general">✨ General AI Assistant</option>
            {documents.length > 0 && <optgroup label="Your Documents">
              {documents.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </optgroup>}
          </select>
        </div>
        
        {/* Suggested Questions */}
        <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
          {suggestedQuestions.map((q, i) => (
            <button 
              key={i} 
              onClick={() => handleSend(null, q)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border transition shadow-sm ${isDark ? 'bg-slate-900 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex space-x-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-blue-500 to-violet-500' 
                  : isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100 border border-slate-200'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />}
              </div>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20' 
                  : isDark 
                    ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 shadow-sm' 
                    : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-200 shadow-sm'
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">{msg.content}</div>
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <SourceDropdown sources={msg.sources} />
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex space-x-3 max-w-[80%]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100 border border-slate-200'}`}>
                <Bot className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </div>
              <div className={`p-4 rounded-2xl rounded-tl-none border shadow-sm flex items-center space-x-2 ${isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-200'}`}>
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                <span className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Assistant is typing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <form onSubmit={handleSend} className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder={selectedDocId === 'general' ? "Ask the AI assistant anything..." : "Ask a question about this document..."}
            className={`w-full border rounded-xl pl-4 pr-12 py-4 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
          />
          <button 
            type="submit" 
            disabled={isTyping || !input.trim()}
            className={`absolute right-2 p-2 rounded-lg transition disabled:cursor-not-allowed shadow-sm ${isDark ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white' : 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white'}`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

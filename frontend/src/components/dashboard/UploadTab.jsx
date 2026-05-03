import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import API from '../../config/api';

export default function UploadTab() {
  const { theme, preferences, showToast } = useTheme();
  const isDark = theme === 'dark';
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, processing, complete, error
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploadState('uploading');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(API.upload, {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setUploadState('processing');
        if (preferences.emailNotifications) {
          showToast(`📄 "${file.name}" uploaded — AI is processing...`);
        }
        pollStatus(data.doc_id);
      } else {
        setUploadState('error');
      }
    } catch (e) {
      setUploadState('error');
    }
  };

  const pollStatus = async (docId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(API.document(docId));
        if (res.ok) {
          const doc = await res.json();
          if (doc.status === 'Ready') {
            clearInterval(interval);
            setResult(doc);
            setUploadState('complete');
            if (preferences.emailNotifications) {
              showToast(`✅ Analysis complete for "${doc.name}"`);
            }
          } else if (doc.status === 'Failed') {
            clearInterval(interval);
            setUploadState('error');
            if (preferences.emailNotifications) {
              showToast('❌ Document processing failed');
            }
          }
        }
      } catch (e) {
        // ignore network errors while polling
      }
    }, 2000);
  };

  const reset = () => {
    setFile(null);
    setUploadState('idle');
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className={`border rounded-xl p-8 shadow-xl transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {uploadState === 'idle' && (
          <>
            <h2 className={`text-2xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>Upload Document</h2>
            <p className={`text-center mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Upload your files for AI-powered analysis and insights.</p>
            
            <div 
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition ${
                isDragging 
                  ? 'border-blue-500 bg-blue-500/5' 
                  : isDark 
                    ? 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50' 
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.csv,.xlsx,.xls,.docx,.txt" />
              
              {!file ? (
                <>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <UploadIcon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Drop files here or click to browse</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Supported formats: PDF, CSV, Excel, DOCX, TXT</p>
                </>
              ) : (
                <div className={`flex items-center space-x-4 p-4 rounded-lg w-full max-w-md border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} onClick={(e) => e.stopPropagation()}>
                  <FileText className="w-8 h-8 text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{file.name}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={() => setFile(null)} className={`p-1 rounded transition ${isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'}`}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-center">
              <button 
                onClick={handleUpload} 
                disabled={!file}
                className={`px-8 py-3 rounded-lg font-medium transition flex items-center space-x-2 ${
                  file 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20' 
                    : isDark 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Upload and Analyze</span>
                <UploadIcon className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {(uploadState === 'uploading' || uploadState === 'processing') && (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {uploadState === 'uploading' ? 'Uploading Document...' : 'AI is Processing Data...'}
            </h3>
            <p className={`text-center max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {uploadState === 'uploading' 
                ? 'Transferring file securely to our servers.' 
                : 'Extracting text, generating embeddings, classifying content, and computing insights.'}
            </p>
            {uploadState === 'processing' && (
              <div className={`w-64 h-2 rounded-full mt-8 overflow-hidden relative ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <motion.div 
                  className="absolute top-0 bottom-0 left-0 bg-blue-500" 
                  initial={{ width: "0%" }} 
                  animate={{ width: "100%" }} 
                  transition={{ duration: 10, ease: "linear" }}
                />
              </div>
            )}
          </div>
        )}

        {uploadState === 'complete' && result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className={`text-2xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>Analysis Complete</h2>
            <p className={`text-center mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Your document has been successfully processed.</p>
            
            <div className={`w-full max-w-md border p-6 rounded-xl space-y-4 mb-8 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-center">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>File:</span>
                <span className={`font-medium truncate ml-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{result.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Type:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium border ${isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>{result.classification}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Insights Generated:</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{result.insights?.length || 0}</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button onClick={reset} className={`px-6 py-2 border rounded-lg transition font-medium ${isDark ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-slate-300 hover:bg-slate-100 text-slate-700'}`}>
                Upload Another
              </button>
              <Link to="/dashboard/analytics" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-medium shadow-lg shadow-blue-600/20">
                View Analysis
              </Link>
            </div>
          </motion.div>
        )}

        {uploadState === 'error' && (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Processing Failed</h3>
            <p className={`text-center max-w-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>There was an error parsing your document. Please ensure it's a valid supported format.</p>
            <button onClick={reset} className={`px-6 py-2 rounded-lg transition font-medium ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

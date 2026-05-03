import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, Trash2, BarChart2, MessageSquare, AlertCircle, UploadCloud, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import API from '../../config/api';

export default function DocumentsTab() {
  const { theme, preferences, showToast } = useTheme();
  const isDark = theme === 'dark';
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name } or null

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetch(API.documents);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.log('Failed to fetch docs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id, docName) => {
    setConfirmDelete({ id, name: docName });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    setDeletingId(id);
    try {
      const res = await fetch(API.deleteDocument(id), { method: 'DELETE' });
      if (res.ok) {
        // Use functional update to avoid stale closure
        setDocuments(prev => prev.filter(d => d.id !== id));
        showToast('🗑️ Document deleted successfully');
      } else {
        showToast('❌ Server error: Failed to delete document');
      }
    } catch (e) {
      console.error('Delete failed:', e);
      showToast('❌ Network error: Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await fetch(API.upload, {
        method: 'POST',
        body: formData
      });
      if (preferences.emailNotifications) {
        showToast(`📄 "${file.name}" uploaded — processing started`);
      }
      // Fetch immediately, and also poll every 2 seconds for a bit
      fetchDocs();
      let polls = 0;
      const interval = setInterval(() => {
        fetchDocs();
        polls++;
        if (polls > 10) clearInterval(interval);
      }, 2000);
    } catch (e) {
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const classifications = ['All', ...new Set(documents.map(d => d.classification).filter(Boolean))];

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterClass === 'All' || doc.classification === filterClass;
    return matchesSearch && matchesFilter;
  });



  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full space-y-6 px-2 sm:px-0">
      
      {/* Upload Section */}
      <div className={`border rounded-xl p-4 sm:p-6 shadow-sm transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Upload New Document</h3>
        <div 
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : isDark 
                ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600' 
                : 'border-slate-300 bg-slate-50 hover:border-slate-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-4 sm:py-6">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Processing your document...</p>
              <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Extracting insights and generating KPIs</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 sm:py-6">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 border rounded-full flex items-center justify-center mb-4 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <p className={`text-base sm:text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Drag and drop your file here</p>
              <p className={`text-xs sm:text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Supports PDF, CSV, Excel, DOCX, and TXT (Max 50MB)</p>
              <label className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg cursor-pointer transition shadow-md shadow-blue-600/20">
                Browse Files
                <input type="file" className="hidden" onChange={handleChange} />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Header + Search/Filter */}
      <div className="flex flex-col space-y-4">
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Document Repository</h2>
          <p className={`font-medium text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage and analyze your uploaded files.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search documents..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-9 pr-4 py-2.5 border rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className={`pl-9 pr-8 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer transition-colors w-full sm:w-auto ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            >
              {classifications.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className={`flex-1 border rounded-xl overflow-hidden shadow-sm flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {loading ? (
          <div className={`p-12 text-center font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className={`w-16 h-16 border rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No documents yet</h3>
            <p className={`font-medium mb-6 max-w-md ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Your repository is empty. Upload your first document above.</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className={`p-12 text-center font-medium flex flex-col items-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
            <p>No documents match your search criteria.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`text-sm border-b ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  <tr>
                    <th className="px-6 py-4 font-bold">Document Name</th>
                    <th className="px-6 py-4 font-bold">Classification</th>
                    <th className="px-6 py-4 font-bold">Upload Date</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className={`transition group ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                      <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate max-w-xs">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {doc.classification ? (
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${isDark ? 'bg-purple-900/40 text-purple-400 border-purple-800' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>{doc.classification}</span>
                        ) : (
                          <span className="text-slate-400 text-xs font-bold">Pending</span>
                        )}
                      </td>
                      <td className={`px-6 py-4 font-medium text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(doc.upload_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                          doc.status === 'Ready' 
                            ? isDark ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-green-100 text-green-700 border-green-200' 
                            : doc.status === 'Processing' 
                              ? isDark ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                              : isDark ? 'bg-red-900/40 text-red-400 border-red-800' : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center space-x-1 justify-end">
                          {doc.status === 'Ready' && (
                            <>
                              <Link to={`/dashboard/analytics?doc=${doc.id}`} title="View Analysis" className={`p-2 rounded-lg transition ${isDark ? 'text-slate-400 hover:text-teal-400 hover:bg-teal-900/30' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}>
                                <BarChart2 className="w-4 h-4" />
                              </Link>
                              <Link to={`/dashboard/chat?doc=${doc.id}`} title="Chat" className={`p-2 rounded-lg transition ${isDark ? 'text-slate-400 hover:text-blue-400 hover:bg-blue-900/30' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                                <MessageSquare className="w-4 h-4" />
                              </Link>
                            </>
                          )}
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteClick(doc.id, doc.name); }} 
                            disabled={deletingId === doc.id}
                            title="Delete" 
                            className={`p-2 rounded-lg transition ${
                              deletingId === doc.id 
                                ? 'opacity-50 cursor-not-allowed' 
                                : isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-900/30' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (hidden on desktop) */}
            <div className={`md:hidden divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {filteredDocs.map((doc) => (
                <div key={doc.id} className={`p-4 transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                  {/* Row 1: Name + Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{doc.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {doc.status === 'Ready' && (
                        <>
                          <Link to={`/dashboard/analytics?doc=${doc.id}`} title="View Analysis" className={`p-2 rounded-lg transition ${isDark ? 'text-slate-400 hover:text-teal-400 hover:bg-teal-900/30' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}>
                            <BarChart2 className="w-4 h-4" />
                          </Link>
                          <Link to={`/dashboard/chat?doc=${doc.id}`} title="Chat" className={`p-2 rounded-lg transition ${isDark ? 'text-slate-400 hover:text-blue-400 hover:bg-blue-900/30' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                            <MessageSquare className="w-4 h-4" />
                          </Link>
                        </>
                      )}
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteClick(doc.id, doc.name); }} 
                        disabled={deletingId === doc.id}
                        title="Delete" 
                        className={`p-2 rounded-lg transition ${
                          deletingId === doc.id 
                            ? 'opacity-50 cursor-not-allowed' 
                            : isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-900/30' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {/* Row 2: Meta info */}
                  <div className="flex flex-wrap items-center gap-2 ml-6">
                    {doc.classification ? (
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${isDark ? 'bg-purple-900/40 text-purple-400 border-purple-800' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>{doc.classification}</span>
                    ) : (
                      <span className="text-slate-400 text-xs font-bold">Pending</span>
                    )}
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                      doc.status === 'Ready' 
                        ? isDark ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-green-100 text-green-700 border-green-200' 
                        : doc.status === 'Processing' 
                          ? isDark ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                          : isDark ? 'bg-red-900/40 text-red-400 border-red-800' : 'bg-red-100 text-red-700 border-red-200'
                    }`}>
                      {doc.status}
                    </span>
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {new Date(doc.upload_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleDeleteCancel} />
          <div className={`relative w-full max-w-sm rounded-xl border shadow-2xl p-6 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-red-900/30' : 'bg-red-50'}`}>
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Delete Document</h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Are you sure you want to delete <span className="font-bold">"{confirmDelete.name}"</span>? This action cannot be undone.
              </p>
              <div className="flex items-center space-x-3 w-full">
                <button 
                  onClick={handleDeleteCancel}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm border transition ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm bg-red-600 hover:bg-red-700 text-white transition shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

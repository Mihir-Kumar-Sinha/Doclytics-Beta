import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (name && email) {
      localStorage.setItem('doclytics_user', JSON.stringify({ name, email }));
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex bg-lavender-gradient font-sans">
      <div className="hidden lg:flex flex-col justify-center w-1/2 p-12 bg-white border-r border-slate-200">
        <div className="max-w-md mx-auto">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-slate-900 tracking-tight">Doclytics</span>
          </div>
          <h1 className="text-4xl font-extrabold text-black mb-6 leading-tight">Access your document intelligence dashboard</h1>
          <p className="text-lg text-slate-500 font-medium">Log in to view your insights, track KPIs, and interact with your parsed documents through our AI chat.</p>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Log in</h2>
          <p className="text-slate-500 mb-8 font-medium">Enter your credentials to access your account</p>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">User Name</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" 
                placeholder="Your Name" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" 
                placeholder="you@example.com" 
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition duration-200 shadow-lg shadow-blue-600/20">
              Enter Dashboard
            </button>
          </form>
          <p className="mt-8 text-center text-slate-500 text-sm font-medium">
            Don't have an account? <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-bold">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

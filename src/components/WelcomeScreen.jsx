import React, { useState } from 'react';
import { ClipboardList, Loader2, KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 placeholder:text-slate-400 transition-all duration-200 shadow-xs';

export default function WelcomeScreen({ onAuth }) {
  const [mode, setMode] = useState('member');
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [ownerPin, setOwnerPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMemberLogin = async () => {
    if (!name.trim() || !accessCode.trim()) { setError('Name and access code are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), accessCode: accessCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      onAuth(data.user);
    } catch (err) {
      setError('Server unreachable — check your internet and retry');
      console.error('Member login error:', err);
    }
    setLoading(false);
  };

  const handleOwnerLogin = async () => {
    if (!ownerPin.trim()) { setError('PIN is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/owner-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: ownerPin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      onAuth(data.user);
    } catch (err) {
      setError('Server unreachable — check your internet and retry');
      console.error('Owner login error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-600/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-card-lg mb-4">
            <ClipboardList size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Daily Visit Report</h1>
          <p className="text-slate-400 text-sm mt-1">Track your field visits efficiently</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-card-lg p-6 border border-white/20">
          {/* Tabs */}
          <div className="flex gap-1.5 mb-6 bg-slate-100 rounded-2xl p-1">
            <button
              onClick={() => { setMode('member'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl transition-all duration-200 ${
                mode === 'member'
                  ? 'bg-white text-orange-600 shadow-card'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <KeyRound size={14} /> Member
            </button>
            <button
              onClick={() => { setMode('owner'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl transition-all duration-200 ${
                mode === 'owner'
                  ? 'bg-white text-orange-600 shadow-card'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ShieldCheck size={14} /> Owner
            </button>
          </div>

          {mode === 'member' && (
            <div className="animate-fade-in space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Your Name</label>
                <input className={inputCls} placeholder="e.g. Rahul Sharma" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Access Code</label>
                <input
                  className={inputCls + ' uppercase tracking-widest font-mono'}
                  placeholder="Code given by owner"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleMemberLogin()}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5 animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
              )}
              <button
                onClick={handleMemberLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all duration-200 shadow-card-md mt-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          )}

          {mode === 'owner' && (
            <div className="animate-fade-in space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Owner PIN</label>
                <div className="relative">
                  <input
                    className={inputCls + ' uppercase tracking-widest font-mono pr-11'}
                    placeholder="Enter owner PIN"
                    type={showPin ? 'text' : 'password'}
                    value={ownerPin}
                    onChange={(e) => setOwnerPin(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleOwnerLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5 animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
              )}
              <button
                onClick={handleOwnerLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all duration-200 shadow-card-md mt-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                {loading ? 'Verifying...' : 'Login as Owner'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">BKT Daily Visit Report System</p>
      </div>
    </div>
  );
}

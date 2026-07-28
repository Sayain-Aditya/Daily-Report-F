import React, { useState } from 'react';
import { ClipboardList, Loader2, KeyRound, ShieldCheck } from 'lucide-react';

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 placeholder:text-neutral-400';
const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function WelcomeScreen({ onAuth }) {
  const [mode, setMode] = useState('member');
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [ownerPin, setOwnerPin] = useState('');
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
    } catch {
      setError('Could not connect to server');
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
    } catch {
      setError('Could not connect to server');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
            <ClipboardList size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold">Daily Visit Report</h1>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => { setMode('member'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg border ${mode === 'member' ? 'bg-orange-600 text-white border-orange-600' : 'text-neutral-600 border-neutral-200'}`}
            >
              <KeyRound size={13} /> Member Login
            </button>
            <button
              onClick={() => { setMode('owner'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg border ${mode === 'owner' ? 'bg-orange-600 text-white border-orange-600' : 'text-neutral-600 border-neutral-200'}`}
            >
              <ShieldCheck size={13} /> Owner
            </button>
          </div>

          {mode === 'member' && (
            <>
              <div className="mb-3">
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Your name</label>
                <input className={inputCls} placeholder="e.g. Rahul Sharma" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Access code</label>
                <input
                  className={inputCls + ' uppercase tracking-widest font-mono'}
                  placeholder="Code given by owner"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleMemberLogin()}
                />
              </div>
              {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
              <button onClick={handleMemberLogin} disabled={loading} className="w-full bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-60">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} Login
              </button>
            </>
          )}

          {mode === 'owner' && (
            <>
              <div className="mb-4">
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Owner PIN</label>
                <input
                  className={inputCls + ' uppercase tracking-widest font-mono'}
                  placeholder="Enter owner PIN"
                  value={ownerPin}
                  onChange={(e) => setOwnerPin(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleOwnerLogin()}
                />
              </div>
              {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
              <button onClick={handleOwnerLogin} disabled={loading} className="w-full bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-60">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />} Login as Owner
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Phone, MapPin, Calendar, Search, Loader2, BarChart2, UserPlus, Users, TrendingUp, ChevronLeft, X, ChevronDown } from 'lucide-react';

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 placeholder:text-slate-400 transition-all duration-200 shadow-xs';
const selectCls = inputCls + ' appearance-none cursor-pointer pr-9';
const API_BASE = import.meta.env.VITE_API_BASE || '';

const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function authHeaders() {
  const token = localStorage.getItem('auth_token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={15} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

export default function OwnerDashboard({ onBack }) {
  const [reps, setReps] = useState([]);
  const [stats, setStats] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedRep, setSelectedRep] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [repsRes, statsRes, entriesRes] = await Promise.all([
          fetch(`${API_BASE}/api/firm/reps`, { headers: authHeaders() }).then((r) => r.json()),
          fetch(`${API_BASE}/api/firm/stats`, { headers: authHeaders() }).then((r) => r.json()),
          fetch(`${API_BASE}/api/firm/entries`, { headers: authHeaders() }).then((r) => r.json()),
        ]);
        setReps(Array.isArray(repsRes) ? repsRes : []);
        setStats(Array.isArray(statsRes) ? statsRes : []);
        setEntries((Array.isArray(entriesRes) ? entriesRes : []).map((e) => ({ ...e, id: e._id })));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const uniqueDates = useMemo(() => {
    const s = new Set(entries.map((e) => e.date));
    return Array.from(s).sort((a, b) => (a < b ? 1 : -1));
  }, [entries]);

  const filtered = useMemo(() => {
    let list = [...entries];
    if (selectedRep !== 'all') list = list.filter((e) => String(e.userId) === selectedRep);
    if (filterDate === 'today') list = list.filter((e) => e.date === todayStr());
    else if (filterDate !== 'all') list = list.filter((e) => e.date === filterDate);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => [e.firmName, e.owner, e.phone, e.location].join(' ').toLowerCase().includes(q));
    }
    return list;
  }, [entries, selectedRep, filterDate, search]);

  const repName = (userId) => reps.find((r) => String(r._id) === String(userId))?.name || 'Unknown';

  async function handleAddMember(e) {
    e.preventDefault();
    setAddError(''); setAddSuccess('');
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/api/firm/members`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: newName.trim(), accessCode: newCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error); return; }
      setAddSuccess(`${data.name} added! Code: ${data.accessCode}`);
      setNewName(''); setNewCode('');
      setReps((prev) => [...prev, { _id: data.id, name: data.name }]);
    } catch { setAddError('Failed to add member'); }
    finally { setAdding(false); }
  }

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-orange-500" size={28} />
        <p className="text-sm text-slate-500">Loading dashboard...</p>
      </div>
    </div>
  );

  const todayCount = entries.filter((e) => e.date === todayStr()).length;
  const maxStat = Math.max(...stats.map((s) => s.total), 1);

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-xs transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Firm Dashboard</h2>
          <p className="text-xs text-slate-500">Overview of all team activity</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <StatCard label="Total Entries" value={entries.length} icon={BarChart2} color="bg-orange-500" />
        <StatCard label="Today" value={todayCount} icon={TrendingUp} color="bg-blue-500" />
        <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Team Members</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Users size={15} className="text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{reps.length}</p>
        </div>
      </div>

      {/* Rep performance */}
      {stats.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
              <BarChart2 size={14} className="text-orange-500" />
            </div>
            <span className="text-sm font-bold text-slate-700">Entries per Rep</span>
          </div>
          <div className="space-y-3">
            {stats.map((s) => (
              <div key={s.userId}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700">{s.name}</span>
                  <span className="font-bold text-orange-600">{s.total}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${(s.total / maxStat) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Member */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4 mb-4">
        <button
          onClick={() => setShowAddMember((v) => !v)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <UserPlus size={14} className="text-blue-500" />
            </div>
            <span className="text-sm font-bold text-slate-700">Add Member</span>
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${showAddMember ? 'rotate-180' : ''}`} />
        </button>

        {showAddMember && (
          <div className="mt-4 animate-slide-down">
            <form onSubmit={handleAddMember} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Member name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                <input
                  className={inputCls + ' uppercase font-mono tracking-widest'}
                  placeholder="Access code (e.g. RAM123)"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={adding}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all shadow-card"
              >
                {adding ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                {adding ? 'Adding...' : 'Add Member'}
              </button>
            </form>
            {addError && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{addError}</div>
            )}
            {addSuccess && (
              <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 font-semibold">{addSuccess}</div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <select className={selectCls} value={selectedRep} onChange={(e) => setSelectedRep(e.target.value)}>
            <option value="all">All reps</option>
            {reps.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative w-36">
          <select className={selectCls} value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
            <option value="all">All dates</option>
            <option value="today">Today</option>
            {uniqueDates.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={inputCls + ' pl-10'} placeholder="Search firm, owner, phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-card">
            <p className="text-sm font-semibold text-slate-500">No entries match your filters.</p>
          </div>
        ) : filtered.map((e) => (
          <div key={e.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card hover:shadow-card-md hover:border-slate-300 transition-all">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    <Building2 size={12} className="text-orange-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 truncate">{e.firmName}</p>
                </div>
                <p className="text-xs text-slate-500 ml-8">{e.owner}{e.designation ? ` · ${e.designation}` : ''}</p>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 whitespace-nowrap shrink-0 border border-orange-100">
                {repName(e.userId)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2"><Phone size={12} className="text-slate-400" /> {e.phone}</div>
              {e.location && <div className="flex items-center gap-2"><MapPin size={12} className="text-slate-400" /> <span className="truncate">{e.location}</span></div>}
              <div className="flex items-center gap-2 sm:col-span-2"><Calendar size={12} className="text-slate-400" /> {fmtDate(e.date)} · {e.meetingPlace}</div>
            </div>
            {e.remarks && (
              <p className="text-xs text-slate-600 mt-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100 leading-relaxed">{e.remarks}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

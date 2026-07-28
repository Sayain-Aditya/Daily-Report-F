import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Phone, MapPin, Calendar, Search, Loader2, BarChart2, UserPlus } from 'lucide-react';

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 placeholder:text-neutral-400';
const API_BASE = import.meta.env.VITE_API_BASE || '';

const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function authHeaders() {
  const token = localStorage.getItem('auth_token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
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
      setAddSuccess(`${data.name} added! Access code: ${data.accessCode}`);
      setNewName(''); setNewCode('');
      setReps((prev) => [...prev, { _id: data.id, name: data.name }]);
    } catch { setAddError('Failed to add member'); }
    finally { setAdding(false); }
  }

  if (loading) return (
    <div className="min-h-[300px] flex items-center justify-center">
      <Loader2 className="animate-spin text-neutral-400" size={26} />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Firm Dashboard</h2>
        <button onClick={onBack} className="text-xs text-neutral-500 hover:text-neutral-700">← Back</button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-3">
          <p className="text-[11px] text-neutral-500 mb-0.5">Total entries</p>
          <p className="text-xl font-bold text-orange-600">{entries.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-3">
          <p className="text-[11px] text-neutral-500 mb-0.5">Today</p>
          <p className="text-xl font-bold text-orange-600">{entries.filter((e) => e.date === todayStr()).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-3 mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <BarChart2 size={13} className="text-neutral-400" />
          <span className="text-xs font-medium text-neutral-600">Entries per rep</span>
        </div>
        <div className="space-y-1.5">
          {stats.map((s) => (
            <div key={s.userId} className="flex items-center justify-between text-xs">
              <span className="text-neutral-700">{s.name}</span>
              <span className="font-semibold text-orange-600">{s.total}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-3 mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <UserPlus size={13} className="text-neutral-400" />
          <span className="text-xs font-medium text-neutral-600">Add Member</span>
        </div>
        <form onSubmit={handleAddMember} className="flex gap-2">
          <input className={inputCls} placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          <input className={inputCls + ' uppercase'} placeholder="Code (e.g. RAM123)" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} maxLength={10} required />
          <button type="submit" disabled={adding} className="shrink-0 px-3 py-2 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 disabled:opacity-50">
            {adding ? '...' : 'Add'}
          </button>
        </form>
        {addError && <p className="text-xs text-red-500 mt-1.5">{addError}</p>}
        {addSuccess && <p className="text-xs text-green-600 mt-1.5">{addSuccess}</p>}
      </div>

      <div className="flex gap-2 mb-3">
        <select className={inputCls} value={selectedRep} onChange={(e) => setSelectedRep(e.target.value)}>
          <option value="all">All reps</option>
          {reps.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>
        <select className={inputCls + ' w-36'} value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
          <option value="all">All dates</option>
          <option value="today">Today</option>
          {uniqueDates.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
        </select>
      </div>

      <div className="relative mb-3">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input className={inputCls + ' pl-8'} placeholder="Search firm, owner, phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center">
            <p className="text-sm text-neutral-500">No entries match your filters.</p>
          </div>
        ) : filtered.map((e) => (
          <div key={e.id} className="bg-white border border-neutral-200 rounded-xl p-3.5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <Building2 size={13} className="text-neutral-400 shrink-0" />
                  <p className="text-sm font-semibold">{e.firmName}</p>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{e.owner} · {e.designation || '—'}</p>
              </div>
              <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-orange-50 text-orange-700 whitespace-nowrap shrink-0">
                {repName(e.userId)}
              </span>
            </div>
            <div className="space-y-1 text-xs text-neutral-600">
              <div className="flex items-center gap-1.5"><Phone size={12} className="text-neutral-400" /> {e.phone}</div>
              {e.location && <div className="flex items-center gap-1.5"><MapPin size={12} className="text-neutral-400" /> {e.location}</div>}
              <div className="flex items-center gap-1.5"><Calendar size={12} className="text-neutral-400" /> {fmtDate(e.date)} · {e.meetingPlace}</div>
            </div>
            {e.remarks && <p className="text-xs text-neutral-700 mt-2 bg-neutral-50 rounded-lg px-2.5 py-2">{e.remarks}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

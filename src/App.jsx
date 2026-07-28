import { useState, useMemo } from 'react';
import { Plus, Settings, ClipboardList, Rows3, Check, Loader2, LayoutDashboard, LogOut, ChevronRight } from 'lucide-react';

import WelcomeScreen from './components/WelcomeScreen';
import OwnerDashboard from './components/OwnerDashboard';
import FormView from './components/FormView';
import BulkEntryView from './components/BulkEntryView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';

import { useEntries, emptyForm } from './hooks/useEntries';
import { getStoredAuth, logout } from './lib/auth';
import { buildMessage, buildDayReport, buildSelectedReport, openWhatsApp, copyText } from './lib/reports';
import { API_BASE } from './constants';

const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function isDuplicate(entries, date, firmName, phone) {
  if (!firmName.trim() || !phone.trim()) return false;
  return entries.some(
    (e) => e.date === date &&
      e.phone.replace(/\D/g, '') === phone.replace(/\D/g, '') &&
      e.firmName.trim().toLowerCase() === firmName.trim().toLowerCase()
  );
}

async function exportExcel(entries, settings, showToast) {
  if (entries.length === 0) { showToast('No entries to export'); return; }
  const XLSX = await import('xlsx');
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt || 0) - (b.createdAt || 0));
  const rows = sorted.map((e, i) => ({
    'S. No': i + 1, 'Date': fmtDate(e.date), 'Customer Name': e.owner,
    'Firm Name': e.firmName, 'Contact No.': e.phone, 'Location': e.location,
    'Sales Officer': settings.salesOfficer || '', 'Designation': e.designation,
    'Meeting / Place': e.meetingPlace, 'Client Status': e.clientStatus, 'Remark': e.remarks,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 13 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 34 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Report');
  XLSX.writeFile(wb, `BKT_Daily_Report_${todayStr()}.xlsx`);
  showToast('Excel file downloaded');
}

const NAV_TABS = [
  { id: 'form',    label: 'New Entry', Icon: Plus },
  { id: 'bulk',    label: 'Bulk',      Icon: Rows3 },
  { id: 'reports', label: 'Reports',   Icon: ClipboardList },
];

export default function App() {
  const [authUser, setAuthUser] = useState(() => getStoredAuth());
  const [showDashboard, setShowDashboard] = useState(false);
  const [tab, setTab] = useState('form');
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [saveAndAdd, setSaveAndAdd] = useState(false);

  const { entries, settings, loaded, toast, saving, persistSettings, saveEntry, saveBulk, deleteEntry, reset, showToast } = useEntries(authUser);

  const firmSuggestions = useMemo(() => Array.from(new Set(entries.map((e) => e.firmName).filter(Boolean))), [entries]);
  const ownerSuggestions = useMemo(() => Array.from(new Set(entries.map((e) => e.owner).filter(Boolean))), [entries]);

  const filteredEntries = useMemo(() => {
    let list = [...entries];
    if (filterDate === 'today') list = list.filter((e) => e.date === todayStr());
    else if (filterDate !== 'all') list = list.filter((e) => e.date === filterDate);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => [e.firmName, e.owner, e.phone, e.location, e.remarks].join(' ').toLowerCase().includes(q));
    }
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [entries, search, filterDate]);

  const uniqueDates = useMemo(() => {
    const s = new Set(entries.map((e) => e.date));
    return Array.from(s).sort((a, b) => (a < b ? 1 : -1));
  }, [entries]);

  const todayCount = entries.filter((e) => e.date === todayStr()).length;

  const resetForm = () => { setForm(emptyForm()); setEditingId(null); };

  const handleSubmit = async () => {
    if (!form.firmName.trim() || !form.owner.trim() || !form.phone.trim()) {
      showToast('Firm name, owner and phone are required'); return;
    }
    const ok = await saveEntry(form, editingId);
    if (!ok) return;
    if (saveAndAdd && !editingId) { setForm({ ...emptyForm(), date: form.date }); }
    else { resetForm(); setTab('reports'); }
  };

  const handleLogout = async () => {
    await logout();
    reset();
    setAuthUser(null);
  };

  if (!authUser) {
    return <WelcomeScreen onAuth={(user) => setAuthUser(user)} />;
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-card-md">
            <ClipboardList size={22} className="text-white" />
          </div>
          <Loader2 className="animate-spin text-orange-500" size={22} />
          <p className="text-sm text-slate-500">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo + title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-xs">
              <ClipboardList size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">Daily Visit Report</h1>
              <p className="text-[11px] text-slate-400 leading-tight">
                <span className="text-orange-500 font-semibold">{todayCount}</span> today · {entries.length} total
              </p>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-1">
            {authUser?.isOwner && (
              <button
                onClick={() => setShowDashboard(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-orange-600 hover:bg-orange-50 px-2.5 py-1.5 rounded-xl transition-colors"
                title="Firm Dashboard"
              >
                <LayoutDashboard size={15} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}
            <button
              onClick={() => setTab('settings')}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              title={`Logout (${authUser.name})`}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl w-full mx-auto flex-1 px-4 pb-24 pt-5">
        {showDashboard && <OwnerDashboard onBack={() => setShowDashboard(false)} />}

        {!showDashboard && tab === 'form' && (
          <FormView
            form={form} setForm={setForm} onSubmit={handleSubmit}
            editing={!!editingId} onCancel={resetForm}
            firmSuggestions={firmSuggestions} ownerSuggestions={ownerSuggestions}
            saveAndAdd={saveAndAdd} setSaveAndAdd={setSaveAndAdd}
            duplicateWarning={!editingId && isDuplicate(entries, form.date, form.firmName, form.phone)}
          />
        )}

        {!showDashboard && tab === 'bulk' && (
          <BulkEntryView
            onSaveAll={saveBulk} firmSuggestions={firmSuggestions}
            ownerSuggestions={ownerSuggestions} existingEntries={entries}
            onDone={() => setTab('reports')}
          />
        )}

        {!showDashboard && tab === 'reports' && (
          <ReportsView
            entries={filteredEntries} allEntries={entries} allCount={entries.length}
            search={search} setSearch={setSearch}
            filterDate={filterDate} setFilterDate={setFilterDate} uniqueDates={uniqueDates}
            onEdit={(entry) => { setForm({ ...entry }); setEditingId(entry.id); setTab('form'); }}
            onDelete={deleteEntry}
            onShare={(entry) => openWhatsApp(buildMessage(entry, settings.salesOfficer))}
            onCopy={(entry) => copyText(buildMessage(entry, settings.salesOfficer), () => showToast('Message copied'))}
            onShareSelected={(sel) => { const msg = buildSelectedReport(sel, settings.salesOfficer); if (msg) openWhatsApp(msg); else showToast('Select at least one entry'); }}
            onCopySelected={(sel) => { const msg = buildSelectedReport(sel, settings.salesOfficer); if (msg) copyText(msg, () => showToast('Combined message copied')); else showToast('Select at least one entry'); }}
            onExport={() => exportExcel(entries, settings, showToast)}
          />
        )}

        {!showDashboard && tab === 'settings' && (
          <SettingsView
            settings={settings}
            onSave={(s) => { persistSettings(s); showToast('Settings saved'); setTab('reports'); }}
            onBack={() => setTab('reports')}
          />
        )}
      </main>

      {/* Bottom tab bar */}
      {!showDashboard && tab !== 'settings' && (
        <nav className="fixed bottom-0 left-0 right-0 z-20">
          <div className="bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-card-lg">
            <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-around">
              {NAV_TABS.map(({ id, label, Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    onClick={() => { if (id === 'form') resetForm(); setTab(id); }}
                    className={`flex flex-col items-center justify-center gap-1 px-5 py-1.5 rounded-2xl transition-all duration-200 ${
                      active
                        ? 'text-orange-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <div className={`w-10 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      active ? 'bg-orange-50' : ''
                    }`}>
                      <Icon size={active ? 20 : 18} strokeWidth={active ? 2.5 : 1.8} />
                    </div>
                    <span className={`text-[11px] font-semibold leading-none ${active ? 'text-orange-600' : 'text-slate-400'}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 animate-bounce-in">
          <div className="flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-card-lg border border-white/10 whitespace-nowrap">
            {saving
              ? <Loader2 size={13} className="animate-spin text-orange-400" />
              : <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={10} /></div>
            }
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

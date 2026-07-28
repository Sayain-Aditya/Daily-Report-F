import { useState, useMemo } from 'react';
import { Plus, Settings, ClipboardList, Rows3, Check, Loader2, LayoutDashboard, LogOut } from 'lucide-react';

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
    return (
      <WelcomeScreen
        onAuth={(user) => {
          setAuthUser(user);
        }}
      />
    );
  }

  if (!loaded) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-neutral-50">
        <Loader2 className="animate-spin text-neutral-400" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
              <ClipboardList size={17} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight">Daily Visit Report</h1>
              <p className="text-[11px] text-neutral-500 leading-tight">
                {todayCount} visit{todayCount === 1 ? '' : 's'} today · {entries.length} total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {authUser?.isOwner && (
              <button onClick={() => setShowDashboard(true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100" title="Firm Dashboard">
                <LayoutDashboard size={17} />
              </button>
            )}
            <button onClick={() => setTab('settings')} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100">
              <Settings size={17} />
            </button>
            <button onClick={handleLogout} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100" title={`Logout (${authUser.name})`}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto flex-1 px-4 pb-24 pt-4">
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
      </div>

      {/* Bottom tab bar */}
      {!showDashboard && tab !== 'settings' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-10">
          <div className="max-w-2xl mx-auto grid grid-cols-3">
            <button onClick={() => { resetForm(); setTab('form'); }} className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium ${tab === 'form' ? 'text-orange-600' : 'text-neutral-500'}`}>
              <Plus size={19} /> New Entry
            </button>
            <button onClick={() => setTab('bulk')} className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium ${tab === 'bulk' ? 'text-orange-600' : 'text-neutral-500'}`}>
              <Rows3 size={19} /> Bulk Entry
            </button>
            <button onClick={() => setTab('reports')} className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium ${tab === 'reports' ? 'text-orange-600' : 'text-neutral-500'}`}>
              <ClipboardList size={19} /> Reports
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs font-medium px-3.5 py-2 rounded-full shadow-lg z-20 flex items-center gap-1.5">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          {toast}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Search, MessageCircle, FileSpreadsheet, ClipboardList, Building2, Phone, MapPin, Calendar, Pencil, Trash2, Copy, Check } from 'lucide-react';
import StatusBadge from './StatusBadge';

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 placeholder:text-neutral-400';
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function ReportsView({
  entries, allEntries, allCount, search, setSearch, filterDate, setFilterDate, uniqueDates,
  onEdit, onDelete, onShare, onCopy, onShareSelected, onCopySelected, onExport,
}) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelectMode = () => { setSelectMode((v) => !v); setSelectedIds([]); };
  const toggleId = (id) => setSelectedIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  const enterSelectWithToday = () => { setSelectedIds(allEntries.filter((e) => e.date === todayStr()).map((e) => e.id)); setSelectMode(true); };
  const sendTodayNow = () => { const t = allEntries.filter((e) => e.date === todayStr()); if (t.length) onShareSelected(t); };
  const selectAllVisible = () => { setSelectedIds(entries.map((e) => e.id)); if (!selectMode) setSelectMode(true); };
  const selectedEntries = allEntries.filter((e) => selectedIds.includes(e.id));

  return (
    <div className={selectMode ? 'pb-16' : ''}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Visit reports</h2>
        <div className="flex items-center gap-1.5">
          <button onClick={onExport} className="text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 hover:bg-neutral-100">
            <FileSpreadsheet size={13} /> Export
          </button>
          <button onClick={toggleSelectMode} className={`text-xs font-medium rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 border ${selectMode ? 'bg-orange-600 text-white border-orange-600' : 'text-neutral-600 border-neutral-300 hover:bg-neutral-100'}`}>
            <Check size={13} /> {selectMode ? 'Cancel' : 'Select'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input className={inputCls + ' pl-8'} placeholder="Search firm, owner, phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={inputCls + ' w-36'} value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
          <option value="all">All dates</option>
          <option value="today">Today</option>
          {uniqueDates.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
        </select>
      </div>

      {!selectMode && entries.length > 0 && (
        <div className="flex gap-2 mb-3">
          <button onClick={sendTodayNow} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg py-2 hover:bg-green-100">
            <MessageCircle size={13} /> Send today's visits in one go
          </button>
          <button onClick={enterSelectWithToday} className="text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg px-3 py-2 hover:bg-neutral-50">
            Pick which ones
          </button>
        </div>
      )}

      {selectMode && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button onClick={enterSelectWithToday} className="text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg px-2.5 py-1.5 hover:bg-neutral-50">Today only</button>
          <button onClick={selectAllVisible} className="text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg px-2.5 py-1.5 hover:bg-neutral-50">Select all shown</button>
          <button onClick={() => setSelectedIds([])} className="text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg px-2.5 py-1.5 hover:bg-neutral-50">Clear</button>
          <span className="text-xs text-neutral-500 ml-auto">{selectedIds.length} selected</span>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center">
          <ClipboardList size={26} className="mx-auto text-neutral-300 mb-2" />
          <p className="text-sm text-neutral-500">{allCount === 0 ? 'No visits logged yet. Add your first entry.' : 'No entries match your filters.'}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((e) => (
            <div key={e.id} onClick={() => selectMode && toggleId(e.id)}
              className={`bg-white border rounded-xl p-3.5 ${selectMode ? 'cursor-pointer' : ''} ${selectMode && selectedIds.includes(e.id) ? 'border-orange-500 ring-1 ring-orange-500/30' : 'border-neutral-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex items-start gap-2">
                  {selectMode && (
                    <div className={`mt-0.5 w-4 h-4 rounded shrink-0 border flex items-center justify-center ${selectedIds.includes(e.id) ? 'bg-orange-600 border-orange-600' : 'border-neutral-300'}`}>
                      {selectedIds.includes(e.id) && <Check size={11} className="text-white" />}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={13} className="text-neutral-400 shrink-0" />
                      <p className="text-sm font-semibold truncate">{e.firmName}</p>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{e.owner} · {e.designation || '—'}</p>
                  </div>
                </div>
                <StatusBadge status={e.clientStatus} />
              </div>

              <div className="mt-2 space-y-1 text-xs text-neutral-600">
                <div className="flex items-center gap-1.5"><Phone size={12} className="text-neutral-400 shrink-0" /> {e.phone}</div>
                {e.location && <div className="flex items-center gap-1.5"><MapPin size={12} className="text-neutral-400 shrink-0" /> {e.location}</div>}
                <div className="flex items-center gap-1.5"><Calendar size={12} className="text-neutral-400 shrink-0" /> {fmtDate(e.date)} · {e.meetingPlace}</div>
              </div>

              {e.remarks && <p className="text-xs text-neutral-700 mt-2 bg-neutral-50 rounded-lg px-2.5 py-2 leading-relaxed">{e.remarks}</p>}

              {!selectMode && (
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-neutral-100">
                  <button onClick={() => onShare(e)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg py-1.5 hover:bg-green-100">
                    <MessageCircle size={13} /> WhatsApp
                  </button>
                  <button onClick={() => onCopy(e)} className="flex items-center justify-center gap-1 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-lg py-1.5 px-2.5 hover:bg-neutral-50"><Copy size={13} /></button>
                  <button onClick={() => onEdit(e)} className="flex items-center justify-center gap-1 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-lg py-1.5 px-2.5 hover:bg-neutral-50"><Pencil size={13} /></button>
                  {confirmDelete === e.id ? (
                    <button onClick={() => { onDelete(e.id); setConfirmDelete(null); }} className="flex items-center justify-center gap-1 text-xs font-medium text-white bg-red-600 rounded-lg py-1.5 px-2.5">Confirm?</button>
                  ) : (
                    <button onClick={() => setConfirmDelete(e.id)} className="flex items-center justify-center gap-1 text-xs font-medium text-red-600 border border-red-200 rounded-lg py-1.5 px-2.5 hover:bg-red-50"><Trash2 size={13} /></button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectMode && selectedIds.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-10 px-4">
          <div className="max-w-2xl mx-auto bg-neutral-900 rounded-xl p-2 flex items-center gap-2 shadow-lg">
            <span className="text-xs text-white pl-2 shrink-0">{selectedIds.length} selected</span>
            <button onClick={() => onCopySelected(selectedEntries)} className="flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-white/10 rounded-lg py-2 px-3 hover:bg-white/20">
              <Copy size={13} /> Copy
            </button>
            <button onClick={() => onShareSelected(selectedEntries)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-green-600 rounded-lg py-2 hover:bg-green-700">
              <MessageCircle size={13} /> Send on WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

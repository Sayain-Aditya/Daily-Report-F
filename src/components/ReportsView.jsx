import { useState } from 'react';
import { Search, MessageCircle, FileSpreadsheet, ClipboardList, Building2, Phone, MapPin, Calendar, Pencil, Trash2, Copy, Check, ChevronDown, Filter, X } from 'lucide-react';
import StatusBadge from './StatusBadge';

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 placeholder:text-slate-400 transition-all duration-200 shadow-xs';
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
  const hasFilter = filterDate !== 'all' || search.trim();

  return (
    <div className={`animate-slide-up ${selectMode ? 'pb-20' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Visit Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">{entries.length} of {allCount} entries</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" /> Export
          </button>
          <button
            onClick={toggleSelectMode}
            className={`flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3 py-2 border transition-all ${
              selectMode
                ? 'bg-orange-500 text-white border-orange-500 shadow-card'
                : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <Check size={14} /> {selectMode ? 'Cancel' : 'Select'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className={inputCls + ' pl-10'}
          placeholder="Search firm, owner, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="date"
            className={inputCls + ' pl-10'}
            value={filterDate === 'all' || filterDate === 'today' ? '' : filterDate}
            onChange={(e) => setFilterDate(e.target.value || 'all')}
          />
        </div>
        <button
          onClick={() => setFilterDate(filterDate === 'today' ? 'all' : 'today')}
          className={`shrink-0 px-4 py-3 rounded-xl text-xs font-semibold border transition-all duration-200 ${
            filterDate === 'today'
              ? 'bg-orange-500 text-white border-orange-500 shadow-card'
              : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50 shadow-xs'
          }`}
        >
          Today
        </button>
        {hasFilter && (
          <button
            onClick={() => { setFilterDate('all'); setSearch(''); }}
            className="shrink-0 px-3 py-3 rounded-xl text-xs font-semibold border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 shadow-xs transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Quick send bar */}
      {!selectMode && entries.length > 0 && (
        <div className="flex gap-2 mb-4 animate-fade-in">
          <button
            onClick={sendTodayNow}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl py-2.5 hover:bg-emerald-100 transition-colors"
          >
            <MessageCircle size={14} /> Send today's visits
          </button>
          <button
            onClick={enterSelectWithToday}
            className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2.5 hover:bg-slate-50 shadow-xs transition-colors"
          >
            Pick entries
          </button>
        </div>
      )}

      {/* Select mode toolbar */}
      {selectMode && (
        <div className="flex items-center gap-2 mb-4 flex-wrap animate-fade-in">
          <button onClick={enterSelectWithToday} className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 shadow-xs">Today only</button>
          <button onClick={selectAllVisible} className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 shadow-xs">Select all</button>
          <button onClick={() => setSelectedIds([])} className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 shadow-xs">Clear</button>
          <span className="text-xs font-semibold text-orange-600 ml-auto bg-orange-50 px-3 py-2 rounded-xl">{selectedIds.length} selected</span>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-card animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600 mb-1">
            {allCount === 0 ? 'No visits logged yet' : 'No entries match your filters'}
          </p>
          <p className="text-xs text-slate-400">
            {allCount === 0 ? 'Add your first entry using the New Entry tab.' : 'Try adjusting your search or date filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div
              key={e.id}
              onClick={() => selectMode && toggleId(e.id)}
              className={`bg-white border rounded-2xl p-4 shadow-card transition-all duration-200 ${
                selectMode ? 'cursor-pointer' : ''
              } ${
                selectMode && selectedIds.includes(e.id)
                  ? 'border-orange-400 ring-2 ring-orange-500/20 shadow-card-md'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-card-md'
              }`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {selectMode && (
                    <div className={`mt-0.5 w-5 h-5 rounded-lg shrink-0 border-2 flex items-center justify-center transition-all ${
                      selectedIds.includes(e.id) ? 'bg-orange-500 border-orange-500' : 'border-slate-300'
                    }`}>
                      {selectedIds.includes(e.id) && <Check size={11} className="text-white" />}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                        <Building2 size={12} className="text-orange-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate">{e.firmName}</p>
                    </div>
                    <p className="text-xs text-slate-500 ml-8">{e.owner}{e.designation ? ` · ${e.designation}` : ''}</p>
                  </div>
                </div>
                <StatusBadge status={e.clientStatus} />
              </div>

              {/* Card details */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-slate-400 shrink-0" />
                  <span>{e.phone}</span>
                </div>
                {e.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{e.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Calendar size={12} className="text-slate-400 shrink-0" />
                  <span>{fmtDate(e.date)} · {e.meetingPlace}</span>
                </div>
              </div>

              {e.remarks && (
                <p className="text-xs text-slate-600 mt-3 bg-slate-50 rounded-xl px-3 py-2.5 leading-relaxed border border-slate-100">
                  {e.remarks}
                </p>
              )}

              {/* Actions */}
              {!selectMode && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onShare(e)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl py-2 hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </button>
                  <button
                    onClick={() => onCopy(e)}
                    className="flex items-center justify-center w-9 h-8 text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                    title="Copy"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => onEdit(e)}
                    className="flex items-center justify-center w-9 h-8 text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  {confirmDelete === e.id ? (
                    <button
                      onClick={() => { onDelete(e.id); setConfirmDelete(null); }}
                      className="flex items-center justify-center gap-1 text-xs font-semibold text-white bg-red-500 rounded-xl py-2 px-3 hover:bg-red-600 transition-colors"
                    >
                      Confirm?
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(e.id)}
                      className="flex items-center justify-center w-9 h-8 text-red-500 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating select action bar */}
      {selectMode && selectedIds.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-20 px-4 animate-slide-up">
          <div className="max-w-2xl mx-auto bg-slate-900 rounded-2xl p-2.5 flex items-center gap-2 shadow-card-lg">
            <span className="text-xs font-semibold text-slate-300 pl-2 shrink-0">{selectedIds.length} selected</span>
            <button
              onClick={() => onCopySelected(selectedEntries)}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-white/10 rounded-xl py-2.5 px-4 hover:bg-white/20 transition-colors"
            >
              <Copy size={13} /> Copy
            </button>
            <button
              onClick={() => onShareSelected(selectedEntries)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-xl py-2.5 hover:bg-emerald-700 transition-colors"
            >
              <MessageCircle size={13} /> Send on WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

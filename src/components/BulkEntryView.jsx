import { useState, useRef } from 'react';
import { Plus, X, Upload, CopyPlus, Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
import Field from './Field';
import { CLIENT_STATUS, MEETING_PLACE } from '../constants';

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 placeholder:text-slate-400 transition-all duration-200 shadow-xs';
const selectCls = inputCls + ' appearance-none cursor-pointer pr-9';

const todayStr = () => new Date().toISOString().slice(0, 10);

function makeEmptyRow() {
  return {
    _key: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    firmName: '', owner: '', phone: '', designation: '',
    clientStatus: CLIENT_STATUS[0], meetingPlace: MEETING_PLACE[0],
    location: '', remarks: '',
  };
}

const FIELD_ALIASES = {
  firmName: ['firmname', 'firm'],
  owner: ['customername', 'ownername', 'owner', 'customer'],
  phone: ['contactno', 'phone', 'contactnumber', 'mobile', 'contactno.'],
  designation: ['designation'],
  clientStatus: ['clientstatus', 'competitionnew', 'status'],
  meetingPlace: ['meetingplace', 'meeting'],
  location: ['location'],
  remarks: ['remark', 'remarks'],
};

function normalizeHeader(h) { return String(h || '').toLowerCase().replace(/[^a-z]/g, ''); }

function mapImportedRow(obj) {
  const row = makeEmptyRow();
  const norm = Object.entries(obj).map(([k, v]) => [normalizeHeader(k), v]);
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    const hit = norm.find(([nk]) => aliases.includes(nk));
    if (hit && hit[1] != null) row[field] = String(hit[1]).trim();
  }
  if (!CLIENT_STATUS.includes(row.clientStatus)) row.clientStatus = CLIENT_STATUS[0];
  if (!MEETING_PLACE.includes(row.meetingPlace)) row.meetingPlace = MEETING_PLACE[0];
  return row;
}

function isDuplicate(entries, date, firmName, phone) {
  if (!firmName.trim() || !phone.trim()) return false;
  return entries.some(
    (e) => e.date === date &&
      e.phone.replace(/\D/g, '') === phone.replace(/\D/g, '') &&
      e.firmName.trim().toLowerCase() === firmName.trim().toLowerCase()
  );
}

function SelectField({ value, onChange, options }) {
  return (
    <div className="relative">
      <select className={selectCls} value={value} onChange={onChange}>
        {options.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

export default function BulkEntryView({ onSaveAll, firmSuggestions = [], ownerSuggestions = [], existingEntries = [], onDone }) {
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([makeEmptyRow(), makeEmptyRow(), makeEmptyRow()]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const updateRow = (key, field, value) => setRows((rs) => rs.map((r) => r._key === key ? { ...r, [field]: value } : r));
  const addRow = () => setRows((rs) => [...rs, makeEmptyRow()]);
  const removeRow = (key) => setRows((rs) => rs.length > 1 ? rs.filter((r) => r._key !== key) : rs);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
      const imported = json.map(mapImportedRow).filter((r) => r.firmName.trim() || r.owner.trim() || r.phone.trim());
      if (imported.length === 0) {
        alert('No usable rows found. Make sure the file has columns like Firm Name, Customer Name, Contact No.');
      } else {
        setRows((rs) => [...rs.filter((r) => r.firmName.trim() || r.owner.trim() || r.phone.trim()), ...imported]);
      }
    } catch {
      alert('Could not read that file. Please upload a valid .xlsx or .csv file.');
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const filledCount = rows.filter((r) => r.firmName.trim() && r.owner.trim() && r.phone.trim()).length;

  const handleSaveAll = async () => {
    const count = await onSaveAll(rows.map((r) => ({ ...r, date })));
    if (count > 0) { setRows([makeEmptyRow(), makeEmptyRow()]); onDone(); }
  };

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Bulk Entry</h2>
          <p className="text-xs text-slate-500 mt-0.5">Add multiple visits at once</p>
        </div>
        <span className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-xl">
          {filledCount} / {rows.length} ready
        </span>
      </div>

      {/* Date + Import */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 mb-4">
        <Field label="Date for all visits" required>
          <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 bg-slate-50 border border-dashed border-slate-300 rounded-xl py-3 hover:bg-slate-100 disabled:opacity-50 transition-colors"
        >
          {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} className="text-blue-500" />}
          {importing ? 'Importing...' : 'Import from Excel / CSV'}
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={handleFile} />
        <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
          Columns: Firm Name, Customer Name, Contact No., Designation, Client Status, Meeting Place, Location, Remark.
        </p>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {rows.map((r, idx) => {
          const dup = isDuplicate(existingEntries, date, r.firmName, r.phone);
          return (
            <div key={r._key} className="bg-white rounded-2xl border border-slate-200 shadow-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{idx + 1}</span>
                  {dup && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                      <AlertTriangle size={11} className="shrink-0" /> Possible duplicate
                    </div>
                  )}
                </div>
                <button onClick={() => removeRow(r._key)} className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors">
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input list="bulk-firm-suggestions" className={inputCls} placeholder="Firm name *" value={r.firmName} onChange={(e) => updateRow(r._key, 'firmName', e.target.value)} />
                <input list="bulk-owner-suggestions" className={inputCls} placeholder="Owner *" value={r.owner} onChange={(e) => updateRow(r._key, 'owner', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input className={inputCls} placeholder="Phone *" inputMode="numeric" value={r.phone} onChange={(e) => updateRow(r._key, 'phone', e.target.value)} />
                <input className={inputCls} placeholder="Designation" value={r.designation} onChange={(e) => updateRow(r._key, 'designation', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <SelectField value={r.clientStatus} onChange={(e) => updateRow(r._key, 'clientStatus', e.target.value)} options={CLIENT_STATUS} />
                <SelectField value={r.meetingPlace} onChange={(e) => updateRow(r._key, 'meetingPlace', e.target.value)} options={MEETING_PLACE} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Location" value={r.location} onChange={(e) => updateRow(r._key, 'location', e.target.value)} />
                <input className={inputCls} placeholder="Remarks" value={r.remarks} onChange={(e) => updateRow(r._key, 'remarks', e.target.value)} />
              </div>
            </div>
          );
        })}
      </div>

      <datalist id="bulk-firm-suggestions">{firmSuggestions.map((f) => <option key={f} value={f} />)}</datalist>
      <datalist id="bulk-owner-suggestions">{ownerSuggestions.map((o) => <option key={o} value={o} />)}</datalist>

      <button
        onClick={addRow}
        className="w-full mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 border border-dashed border-slate-300 rounded-2xl py-3 hover:bg-slate-50 hover:text-slate-700 transition-colors"
      >
        <Plus size={16} /> Add another row
      </button>

      <button
        onClick={handleSaveAll}
        disabled={filledCount === 0}
        className="w-full mt-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all duration-200 shadow-card-md disabled:opacity-40"
      >
        <CopyPlus size={16} />
        Save {filledCount || ''} {filledCount === 1 ? 'entry' : 'entries'}
      </button>
    </div>
  );
}

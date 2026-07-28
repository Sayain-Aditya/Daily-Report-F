import { useState, useRef } from 'react';
import { Plus, X, Upload, CopyPlus, Loader2, AlertTriangle } from 'lucide-react';
import Field from './Field';
import { CLIENT_STATUS, MEETING_PLACE } from '../constants';

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 placeholder:text-neutral-400';

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

function normalizeHeader(h) {
  return String(h || '').toLowerCase().replace(/[^a-z]/g, '');
}

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
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Bulk entry</h2>
        <span className="text-xs text-neutral-500">{filledCount} of {rows.length} ready</span>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-3.5 mb-3">
        <Field label="Date for these visits" required>
          <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <button onClick={() => fileRef.current?.click()} disabled={importing} className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg py-2 hover:bg-neutral-50 disabled:opacity-50">
          {importing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          Import from Excel / CSV
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={handleFile} />
        <p className="text-[11px] text-neutral-400 mt-2">Columns: Firm Name, Customer Name, Contact No., Designation, Client Status, Meeting Place, Location, Remark.</p>
      </div>

      <div className="space-y-2.5">
        {rows.map((r, idx) => {
          const dup = isDuplicate(existingEntries, date, r.firmName, r.phone);
          return (
            <div key={r._key} className="bg-white rounded-xl border border-neutral-200 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-400">Row {idx + 1}</span>
                <button onClick={() => removeRow(r._key)} className="text-neutral-400 hover:text-red-600"><X size={15} /></button>
              </div>
              {dup && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mb-2">
                  <AlertTriangle size={12} className="shrink-0" /> Possible duplicate for this date
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input list="bulk-firm-suggestions" className={inputCls} placeholder="Firm name *" value={r.firmName} onChange={(e) => updateRow(r._key, 'firmName', e.target.value)} />
                <input list="bulk-owner-suggestions" className={inputCls} placeholder="Owner *" value={r.owner} onChange={(e) => updateRow(r._key, 'owner', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input className={inputCls} placeholder="Phone *" inputMode="numeric" value={r.phone} onChange={(e) => updateRow(r._key, 'phone', e.target.value)} />
                <input className={inputCls} placeholder="Designation" value={r.designation} onChange={(e) => updateRow(r._key, 'designation', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select className={inputCls} value={r.clientStatus} onChange={(e) => updateRow(r._key, 'clientStatus', e.target.value)}>
                  {CLIENT_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className={inputCls} value={r.meetingPlace} onChange={(e) => updateRow(r._key, 'meetingPlace', e.target.value)}>
                  {MEETING_PLACE.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <input className={inputCls + ' mb-2'} placeholder="Location" value={r.location} onChange={(e) => updateRow(r._key, 'location', e.target.value)} />
              <input className={inputCls} placeholder="Remarks" value={r.remarks} onChange={(e) => updateRow(r._key, 'remarks', e.target.value)} />
            </div>
          );
        })}
      </div>

      <datalist id="bulk-firm-suggestions">{firmSuggestions.map((f) => <option key={f} value={f} />)}</datalist>
      <datalist id="bulk-owner-suggestions">{ownerSuggestions.map((o) => <option key={o} value={o} />)}</datalist>

      <button onClick={addRow} className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-600 border border-dashed border-neutral-300 rounded-lg py-2.5 hover:bg-neutral-50">
        <Plus size={14} /> Add another row
      </button>
      <button onClick={handleSaveAll} disabled={filledCount === 0} className="w-full mt-3 bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40">
        <CopyPlus size={15} /> Save {filledCount || ''} {filledCount === 1 ? 'entry' : 'entries'}
      </button>
    </div>
  );
}

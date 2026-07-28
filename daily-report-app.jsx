import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus, Search, MessageCircle, Trash2, Pencil, Download, X, Check,
  Calendar, Settings, Copy, Users, MapPin, Phone, Building2,
  ClipboardList, FileSpreadsheet, ChevronLeft, Save, Loader2
} from "lucide-react";

const CLIENT_STATUS = ["New Client", "Existing Client", "Follow-up", "Competition"];
const MEETING_PLACE = ["At Shop", "At Office", "On Call", "Site Visit"];
const ENTRIES_KEY = "bkt_daily_report_entries_v1";
const SETTINGS_KEY = "bkt_daily_report_settings_v1";

const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const emptyForm = () => ({
  id: null,
  date: todayStr(),
  firmName: "",
  owner: "",
  phone: "",
  designation: "",
  clientStatus: CLIENT_STATUS[0],
  meetingPlace: MEETING_PLACE[0],
  location: "",
  remarks: "",
});

function buildMessage(entry, salesOfficer) {
  const lines = [
    "*Daily Visit Report*",
    `Date: ${fmtDate(entry.date)}`,
    `Firm Name: ${entry.firmName}`,
    `Owner: ${entry.owner}`,
    `Phone: ${entry.phone}`,
    `Designation: ${entry.designation}`,
    `Client Status: ${entry.clientStatus}`,
    `Meeting Place: ${entry.meetingPlace}`,
    `Location: ${entry.location}`,
    `Remarks: ${entry.remarks}`,
  ];
  if (salesOfficer) lines.splice(1, 0, `Sales Officer: ${salesOfficer}`);
  return lines.join("\n");
}

function buildDayReport(entries, date, salesOfficer) {
  const dayEntries = entries.filter((e) => e.date === date).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  if (dayEntries.length === 0) return "";
  const header = [`*Daily Report - ${fmtDate(date)}*`, salesOfficer ? `Sales Officer: ${salesOfficer}` : null, `Total Visits: ${dayEntries.length}`, ""].filter(Boolean);
  const body = dayEntries.map((e, i) => [
    `${i + 1}. ${e.firmName} (${e.owner})`,
    `   Phone: ${e.phone} | ${e.designation}`,
    `   Status: ${e.clientStatus} | Met: ${e.meetingPlace}`,
    `   Location: ${e.location}`,
    `   Remarks: ${e.remarks}`,
    "",
  ].join("\n"));
  return header.join("\n") + "\n" + body.join("\n");
}

function openWhatsApp(text, phone) {
  const encoded = encodeURIComponent(text);
  const url = phone
    ? `https://wa.me/91${phone.replace(/\D/g, "")}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, "_blank");
}

async function copyText(text, onDone) {
  try {
    await navigator.clipboard.writeText(text);
    onDone && onDone();
  } catch (e) {
    onDone && onDone();
  }
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [entries, setEntries] = useState([]);
  const [settings, setSettings] = useState({ salesOfficer: "" });
  const [tab, setTab] = useState("form"); // form | reports | settings
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("all");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const e = await window.storage.get(ENTRIES_KEY);
        if (e && e.value) setEntries(JSON.parse(e.value));
      } catch {}
      try {
        const s = await window.storage.get(SETTINGS_KEY);
        if (s && s.value) setSettings(JSON.parse(s.value));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  const persistEntries = async (next) => {
    setEntries(next);
    setSaving(true);
    try {
      await window.storage.set(ENTRIES_KEY, JSON.stringify(next));
    } catch {
      showToast("Could not save. Try again.");
    }
    setSaving(false);
  };

  const persistSettings = async (next) => {
    setSettings(next);
    try {
      await window.storage.set(SETTINGS_KEY, JSON.stringify(next));
    } catch {}
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.firmName.trim() || !form.owner.trim() || !form.phone.trim()) {
      showToast("Firm name, owner and phone are required");
      return;
    }
    if (editingId) {
      const next = entries.map((e) => (e.id === editingId ? { ...form, id: editingId, createdAt: e.createdAt } : e));
      await persistEntries(next);
      showToast("Entry updated");
    } else {
      const newEntry = { ...form, id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now() };
      const next = [newEntry, ...entries];
      await persistEntries(next);
      showToast("Entry saved");
    }
    resetForm();
    setTab("reports");
  };

  const handleEdit = (entry) => {
    setForm({ ...entry });
    setEditingId(entry.id);
    setTab("form");
  };

  const handleDelete = async (id) => {
    const next = entries.filter((e) => e.id !== id);
    await persistEntries(next);
    showToast("Entry deleted");
  };

  const filteredEntries = useMemo(() => {
    let list = [...entries];
    if (filterDate === "today") list = list.filter((e) => e.date === todayStr());
    else if (filterDate !== "all") list = list.filter((e) => e.date === filterDate);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) =>
        [e.firmName, e.owner, e.phone, e.location, e.remarks].join(" ").toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [entries, search, filterDate]);

  const uniqueDates = useMemo(() => {
    const s = new Set(entries.map((e) => e.date));
    return Array.from(s).sort((a, b) => (a < b ? 1 : -1));
  }, [entries]);

  const todayCount = entries.filter((e) => e.date === todayStr()).length;

  const exportExcel = async () => {
    if (entries.length === 0) {
      showToast("No entries to export");
      return;
    }
    const XLSX = await import("xlsx");
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt || 0) - (b.createdAt || 0));
    const rows = sorted.map((e, i) => ({
      "S. No": i + 1,
      "Date": fmtDate(e.date),
      "Customer Name": e.owner,
      "Firm Name": e.firmName,
      "Contact No.": e.phone,
      "Location": e.location,
      "Sales Officer": settings.salesOfficer || "",
      "Designation": e.designation,
      "Meeting / Place": e.meetingPlace,
      "Client Status": e.clientStatus,
      "Remark": e.remarks,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 6 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 13 },
      { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 34 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Report");
    XLSX.writeFile(wb, `BKT_Daily_Report_${todayStr()}.xlsx`);
    showToast("Excel file downloaded");
  };

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
                {todayCount} visit{todayCount === 1 ? "" : "s"} today · {entries.length} total
              </p>
            </div>
          </div>
          <button
            onClick={() => setTab("settings")}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto flex-1 px-4 pb-24 pt-4">
        {tab === "form" && (
          <FormView
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            editing={!!editingId}
            onCancel={resetForm}
          />
        )}

        {tab === "reports" && (
          <ReportsView
            entries={filteredEntries}
            allCount={entries.length}
            search={search}
            setSearch={setSearch}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
            uniqueDates={uniqueDates}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onShare={(entry) => openWhatsApp(buildMessage(entry, settings.salesOfficer))}
            onCopy={(entry) => copyText(buildMessage(entry, settings.salesOfficer), () => showToast("Message copied"))}
            onShareDay={(date) => {
              const msg = buildDayReport(entries, date, settings.salesOfficer);
              if (!msg) { showToast("No entries for this date"); return; }
              openWhatsApp(msg);
            }}
            onExport={exportExcel}
          />
        )}

        {tab === "settings" && (
          <SettingsView
            settings={settings}
            onSave={(s) => { persistSettings(s); showToast("Settings saved"); setTab("reports"); }}
            onBack={() => setTab("reports")}
          />
        )}
      </div>

      {/* Bottom tab bar */}
      {tab !== "settings" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-10">
          <div className="max-w-2xl mx-auto grid grid-cols-2">
            <button
              onClick={() => { resetForm(); setTab("form"); }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium ${tab === "form" ? "text-orange-600" : "text-neutral-500"}`}
            >
              <Plus size={19} />
              New Entry
            </button>
            <button
              onClick={() => setTab("reports")}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium ${tab === "reports" ? "text-orange-600" : "text-neutral-500"}`}
            >
              <ClipboardList size={19} />
              Reports
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

function Field({ label, required, children }) {
  return (
    <div className="mb-3.5">
      <label className="block text-xs font-medium text-neutral-600 mb-1.5">
        {label} {required && <span className="text-orange-600">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 placeholder:text-neutral-400";

function FormView({ form, setForm, onSubmit, editing, onCancel }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">{editing ? "Edit visit" : "Log today's visit"}</h2>
        {editing && (
          <button onClick={onCancel} className="text-xs text-neutral-500 flex items-center gap-1 hover:text-neutral-700">
            <X size={13} /> Cancel edit
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <Field label="Date" required>
          <input type="date" className={inputCls} value={form.date} onChange={set("date")} />
        </Field>

        <Field label="Firm name" required>
          <input className={inputCls} placeholder="e.g. Pintu Tyres" value={form.firmName} onChange={set("firmName")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner / contact person" required>
            <input className={inputCls} placeholder="e.g. Pratul Yadav" value={form.owner} onChange={set("owner")} />
          </Field>
          <Field label="Phone" required>
            <input className={inputCls} placeholder="10-digit number" inputMode="numeric" value={form.phone} onChange={set("phone")} />
          </Field>
        </div>

        <Field label="Designation">
          <input className={inputCls} placeholder="e.g. Owner, Manager, Purchase Head" value={form.designation} onChange={set("designation")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Client status">
            <select className={inputCls} value={form.clientStatus} onChange={set("clientStatus")}>
              {CLIENT_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Meeting place">
            <select className={inputCls} value={form.meetingPlace} onChange={set("meetingPlace")}>
              {MEETING_PLACE.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Location">
          <input className={inputCls} placeholder="e.g. Near Naveen Mandi, Rustampur" value={form.location} onChange={set("location")} />
        </Field>

        <Field label="Remarks">
          <textarea className={inputCls + " resize-none"} rows={3} placeholder="What happened in the visit, next steps..." value={form.remarks} onChange={set("remarks")} />
        </Field>

        <button
          onClick={onSubmit}
          className="w-full mt-1 bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
        >
          <Save size={15} />
          {editing ? "Update entry" : "Save entry"}
        </button>
      </div>
    </div>
  );
}

function ReportsView({
  entries, allCount, search, setSearch, filterDate, setFilterDate, uniqueDates,
  onEdit, onDelete, onShare, onCopy, onShareDay, onExport,
}) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Visit reports</h2>
        <button onClick={onExport} className="text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 hover:bg-neutral-100">
          <FileSpreadsheet size={13} /> Export Excel
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className={inputCls + " pl-8"}
            placeholder="Search firm, owner, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={inputCls + " w-36"} value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
          <option value="all">All dates</option>
          <option value="today">Today</option>
          {uniqueDates.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
        </select>
      </div>

      {filterDate !== "all" && filterDate !== "today" && entries.length > 0 && (
        <button
          onClick={() => onShareDay(filterDate)}
          className="w-full mb-3 bg-green-600 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-1.5"
        >
          <MessageCircle size={15} /> Share {fmtDate(filterDate)} report on WhatsApp
        </button>
      )}
      {filterDate === "today" && entries.length > 0 && (
        <button
          onClick={() => onShareDay(todayStr())}
          className="w-full mb-3 bg-green-600 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-1.5"
        >
          <MessageCircle size={15} /> Share today's full report
        </button>
      )}

      {entries.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center">
          <ClipboardList size={26} className="mx-auto text-neutral-300 mb-2" />
          <p className="text-sm text-neutral-500">
            {allCount === 0 ? "No visits logged yet. Add your first entry." : "No entries match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((e) => (
            <div key={e.id} className="bg-white border border-neutral-200 rounded-xl p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-neutral-400 shrink-0" />
                    <p className="text-sm font-semibold truncate">{e.firmName}</p>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{e.owner} · {e.designation || "—"}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <StatusBadge status={e.clientStatus} />
                </div>
              </div>

              <div className="mt-2 space-y-1 text-xs text-neutral-600">
                <div className="flex items-center gap-1.5">
                  <Phone size={12} className="text-neutral-400 shrink-0" /> {e.phone}
                </div>
                {e.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-neutral-400 shrink-0" /> {e.location}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-neutral-400 shrink-0" /> {fmtDate(e.date)} · {e.meetingPlace}
                </div>
              </div>

              {e.remarks && (
                <p className="text-xs text-neutral-700 mt-2 bg-neutral-50 rounded-lg px-2.5 py-2 leading-relaxed">{e.remarks}</p>
              )}

              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-neutral-100">
                <button onClick={() => onShare(e)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg py-1.5 hover:bg-green-100">
                  <MessageCircle size={13} /> WhatsApp
                </button>
                <button onClick={() => onCopy(e)} className="flex items-center justify-center gap-1 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-lg py-1.5 px-2.5 hover:bg-neutral-50">
                  <Copy size={13} />
                </button>
                <button onClick={() => onEdit(e)} className="flex items-center justify-center gap-1 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-lg py-1.5 px-2.5 hover:bg-neutral-50">
                  <Pencil size={13} />
                </button>
                {confirmDelete === e.id ? (
                  <button onClick={() => { onDelete(e.id); setConfirmDelete(null); }} className="flex items-center justify-center gap-1 text-xs font-medium text-white bg-red-600 rounded-lg py-1.5 px-2.5">
                    Confirm?
                  </button>
                ) : (
                  <button onClick={() => setConfirmDelete(e.id)} className="flex items-center justify-center gap-1 text-xs font-medium text-red-600 border border-red-200 rounded-lg py-1.5 px-2.5 hover:bg-red-50">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    "New Client": "bg-blue-50 text-blue-700",
    "Existing Client": "bg-emerald-50 text-emerald-700",
    "Follow-up": "bg-amber-50 text-amber-700",
    "Competition": "bg-rose-50 text-rose-700",
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap ${map[status] || "bg-neutral-100 text-neutral-600"}`}>
      {status}
    </span>
  );
}

function SettingsView({ settings, onSave, onBack }) {
  const [officer, setOfficer] = useState(settings.salesOfficer || "");
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-neutral-500 mb-3 hover:text-neutral-700">
        <ChevronLeft size={14} /> Back to reports
      </button>
      <h2 className="text-base font-semibold mb-3">Settings</h2>
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <Field label="Your name (Sales Officer)">
          <input className={inputCls} placeholder="Shown on reports and WhatsApp messages" value={officer} onChange={(e) => setOfficer(e.target.value)} />
        </Field>
        <button
          onClick={() => onSave({ salesOfficer: officer })}
          className="w-full mt-1 bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-1.5"
        >
          <Save size={15} /> Save settings
        </button>
      </div>
      <div className="bg-white rounded-xl border border-neutral-200 p-4 mt-3">
        <p className="text-xs text-neutral-500 leading-relaxed flex items-start gap-2">
          <Users size={14} className="text-neutral-400 shrink-0 mt-0.5" />
          Your visit data is saved on this device/account only, so it stays available across sessions. Use "Export Excel" from the Reports tab any time to back it up or share it.
        </p>
      </div>
    </div>
  );
}

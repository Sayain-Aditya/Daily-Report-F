import { useState, useEffect, useRef } from 'react';
import { API_BASE, CLIENT_STATUS, MEETING_PLACE } from '../constants';
import { authHeaders } from '../lib/auth';

const todayStr = () => new Date().toISOString().slice(0, 10);

export const emptyForm = () => ({
  id: null,
  date: todayStr(),
  firmName: '',
  owner: '',
  ownerName: '',
  phone: '',
  designation: '',
  clientStatus: CLIENT_STATUS[0],
  meetingPlace: MEETING_PLACE[0],
  location: '',
  remarks: '',
});

export function useEntries(authUser) {
  const [entries, setEntries] = useState([]);
  const [settings, setSettings] = useState({ salesOfficer: '' });
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  };

  useEffect(() => {
    if (!authUser) { setLoaded(true); return; }
    setLoaded(false);
    (async () => {
      try {
        const [entriesRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE}/api/entries`, { headers: authHeaders() }).then((r) => r.ok ? r.json() : []),
          fetch(`${API_BASE}/api/settings`, { headers: authHeaders() }).then((r) => r.ok ? r.json() : { salesOfficer: '' }),
        ]);
        setEntries((entriesRes || []).map((e) => ({ ...e, id: e._id })));
        setSettings(settingsRes || { salesOfficer: '' });
      } catch {
        showToast('Unable to load data from server');
      }
      setLoaded(true);
    })();
  }, [authUser]); // eslint-disable-line

  const persistSettings = async (next) => {
    setSettings(next);
    try {
      await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(next),
      });
    } catch {
      showToast('Could not save settings');
    }
  };

  const saveEntry = async (form, editingId) => {
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`${API_BASE}/api/entries/${editingId}`, {
          method: 'PUT', headers: authHeaders(), body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setEntries((prev) => prev.map((e) => e.id === editingId ? { ...updated, id: updated._id } : e));
        showToast('Entry updated');
      } else {
        const res = await fetch(`${API_BASE}/api/entries`, {
          method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        const saved = await res.json();
        setEntries((prev) => [{ ...saved, id: saved._id }, ...prev]);
        showToast('Entry saved');
      }
      setSaving(false);
      return true;
    } catch {
      showToast('Could not save. Try again.');
      setSaving(false);
      return false;
    }
  };

  const saveBulk = async (rows) => {
    const valid = rows.filter((r) => r.firmName.trim() && r.owner.trim() && r.phone.trim());
    if (valid.length === 0) { showToast('Fill at least one complete row'); return 0; }
    setSaving(true);
    try {
      const saved = await Promise.all(
        valid.map(({ _key, ...row }) =>
          fetch(`${API_BASE}/api/entries`, {
            method: 'POST', headers: authHeaders(), body: JSON.stringify(row),
          }).then((r) => r.json())
        )
      );
      setEntries((prev) => [...saved.map((e) => ({ ...e, id: e._id })), ...prev]);
      showToast(`${saved.length} entr${saved.length === 1 ? 'y' : 'ies'} saved`);
      setSaving(false);
      return saved.length;
    } catch {
      showToast('Could not save bulk entries');
      setSaving(false);
      return 0;
    }
  };

  const deleteEntry = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/entries/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error();
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast('Entry deleted');
    } catch {
      showToast('Could not delete entry');
    }
  };

  const reset = () => {
    setEntries([]);
    setSettings({ salesOfficer: '' });
    setLoaded(true);
  };

  return { entries, settings, loaded, toast, saving, persistSettings, saveEntry, saveBulk, deleteEntry, reset, showToast };
}

const fmtDate = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export function buildMessage(entry, salesOfficer) {
  return [
    '*Daily Visit Report*',
    salesOfficer ? `Sales Officer: ${salesOfficer}` : null,
    `Date: ${fmtDate(entry.date)}`,
    '',
    `Firm Name: ${entry.firmName}`,
    `Owner: ${entry.owner}`,
    `Phone: ${entry.phone}`,
    `Designation: ${entry.designation || '—'}`,
    `Client Status: ${entry.clientStatus}`,
    `Meeting Place: ${entry.meetingPlace}`,
    `Location: ${entry.location || '—'}`,
    `Remarks: ${entry.remarks || '—'}`,
  ].filter((l) => l !== null).join('\n');
}

export function buildDayReport(entries, date, salesOfficer) {
  const dayEntries = entries.filter((e) => e.date === date).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  if (dayEntries.length === 0) return '';
  const header = [
    '*Daily Visit Report*',
    salesOfficer ? `Sales Officer: ${salesOfficer}` : null,
    `Date: ${fmtDate(date)}`,
    `Total Visits: ${dayEntries.length}`,
    '',
  ].filter((l) => l !== null);
  const body = dayEntries.map((e, i) => [
    `${i + 1}. Firm Name: ${e.firmName}`,
    `   Owner: ${e.owner}`,
    `   Phone: ${e.phone}`,
    `   Designation: ${e.designation || '—'}`,
    `   Client Status: ${e.clientStatus}`,
    `   Meeting Place: ${e.meetingPlace}`,
    `   Location: ${e.location || '—'}`,
    `   Remarks: ${e.remarks || '—'}`,
    '',
  ].join('\n'));
  return header.join('\n') + body.join('\n');
}

export function buildSelectedReport(selectedEntries, salesOfficer) {
  if (selectedEntries.length === 0) return '';
  const sorted = [...selectedEntries].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const sameDate = sorted.every((e) => e.date === sorted[0].date);
  const header = [
    '*Daily Visit Report*',
    salesOfficer ? `Sales Officer: ${salesOfficer}` : null,
    sameDate ? `Date: ${fmtDate(sorted[0].date)}` : null,
    `Total Visits: ${sorted.length}`,
    '',
  ].filter((l) => l !== null);
  const body = sorted.map((e, i) => [
    `${i + 1}. Firm Name: ${e.firmName}${!sameDate ? ' (' + fmtDate(e.date) + ')' : ''}`,
    `   Owner: ${e.owner}`,
    `   Phone: ${e.phone}`,
    `   Designation: ${e.designation || '—'}`,
    `   Client Status: ${e.clientStatus}`,
    `   Meeting Place: ${e.meetingPlace}`,
    `   Location: ${e.location || '—'}`,
    `   Remarks: ${e.remarks || '—'}`,
    '',
  ].join('\n'));
  return header.join('\n') + body.join('\n');
}

export function openWhatsApp(text, phone) {
  const encoded = encodeURIComponent(text);
  const url = phone
    ? `https://wa.me/91${phone.replace(/\D/g, '')}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
}

export async function copyText(text, onDone) {
  try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
  onDone?.();
}

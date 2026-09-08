/* ---------------------------------------------------------------
   downloadCsv — client-side CSV export, no backend required.
   headers: [{key, label}], rows: array of plain objects.
   --------------------------------------------------------------- */
export function downloadCsv(filename, rows, headers) {
  const escape = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [headers.map((h) => escape(h.label)).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h.key])).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

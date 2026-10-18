import type { LogRow } from "@/lib/pickup-logs-shared";
import { formatDate, formatTime } from "@/lib/utils";

const HEAD = ["Date", "Time", "Student", "Class", "Picked up by", "Relationship", "Car number", "Parent", "Released by", "Staff role"];

function cells(r: LogRow): string[] {
  return [
    formatDate(r.picked_up_at),
    formatTime(r.picked_up_at),
    r.studentName,
    r.className,
    r.collectedBy,
    r.relation,
    r.vehicleNumber,
    r.parentName,
    r.releasedBy ?? "Not recorded",
    r.releasedByRole ?? "",
  ];
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// A leading = + - @ makes Excel run the cell as a formula, so those get a quote in front
function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const stamp = () => new Date().toISOString().slice(0, 10);

export function exportCsv(rows: LogRow[]) {
  const lines = [HEAD, ...rows.map(cells)].map((line) => line.map(csvCell).join(","));
  // The byte order mark makes Excel read names with accents correctly
  download(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }), `pickup-logs-${stamp()}.csv`);
}

export async function exportPdf(rows: LogRow[], meta: { schoolName: string; filters: string }) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(16);
  doc.text(`${meta.schoolName}: Pickup Logs`, 40, 40);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `${rows.length} record${rows.length === 1 ? "" : "s"}${meta.filters ? `  |  ${meta.filters}` : ""}  |  Exported ${new Date().toLocaleString("en-GB")}`,
    40,
    58
  );

  autoTable(doc, {
    head: [HEAD.slice(0, 9)],
    body: rows.map((r) => cells(r).slice(0, 9)),
    startY: 72,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [29, 78, 216] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 40, right: 40, bottom: 40 },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Page ${doc.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 70, doc.internal.pageSize.getHeight() - 20);
    },
  });

  doc.save(`pickup-logs-${stamp()}.pdf`);
}

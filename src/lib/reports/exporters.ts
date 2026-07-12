import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ReportDataset } from "@/server/services/report.service";

// ------------------------------- CSV -------------------------------

function csvCell(value: string | number): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(dataset: ReportDataset): string {
  const lines: string[] = [];
  lines.push(csvCell(dataset.title));
  lines.push(`Generated,${csvCell(dataset.generatedAt.toISOString())}`);
  if (dataset.summary) {
    lines.push("");
    lines.push("Summary");
    for (const [k, v] of Object.entries(dataset.summary)) {
      lines.push(`${csvCell(k)},${csvCell(v)}`);
    }
  }
  for (const section of dataset.sections) {
    lines.push("");
    lines.push(csvCell(section.heading));
    lines.push(section.columns.map(csvCell).join(","));
    for (const row of section.rows) {
      lines.push(row.map(csvCell).join(","));
    }
  }
  return lines.join("\n");
}

// ------------------------------- Excel -------------------------------

function sheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[[\]:*?/\\]/g, "").slice(0, 28) || "Sheet";
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base.slice(0, 26)} ${i++}`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export async function toExcelBuffer(dataset: ReportDataset): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "VerdantIQ";
  wb.created = dataset.generatedAt;
  const used = new Set<string>();

  // Summary sheet
  const summarySheet = wb.addWorksheet(sheetName("Summary", used));
  summarySheet.addRow([dataset.title]);
  summarySheet.getRow(1).font = { bold: true, size: 14 };
  summarySheet.addRow(["Generated", dataset.generatedAt.toISOString()]);
  if (dataset.summary) {
    summarySheet.addRow([]);
    for (const [k, v] of Object.entries(dataset.summary)) {
      summarySheet.addRow([k, v]);
    }
  }
  summarySheet.columns.forEach((c) => (c.width = 28));

  for (const section of dataset.sections) {
    const ws = wb.addWorksheet(sheetName(section.heading, used));
    ws.addRow([section.heading]).font = { bold: true, size: 12 };
    ws.addRow([]);
    const header = ws.addRow(section.columns);
    header.font = { bold: true };
    header.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    });
    for (const row of section.rows) ws.addRow(row);
    ws.columns.forEach((c) => (c.width = 22));
  }

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

// ------------------------------- PDF -------------------------------

export async function toPdfBuffer(dataset: ReportDataset): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageSize: [number, number] = [595.28, 841.89]; // A4
  const margin = 40;
  let page = doc.addPage(pageSize);
  let y = pageSize[1] - margin;

  const line = (text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number] } = {}) => {
    const size = opts.size ?? 10;
    if (y < margin + size) {
      page = doc.addPage(pageSize);
      y = pageSize[1] - margin;
    }
    const clean = text.replace(/[^\x20-\x7E]/g, ""); // WinAnsi-safe
    page.drawText(clean.slice(0, 110), {
      x: margin,
      y,
      size,
      font: opts.bold ? bold : font,
      color: rgb(...(opts.color ?? [0.06, 0.09, 0.16])),
    });
    y -= size + 5;
  };

  line("VerdantIQ", { size: 16, bold: true, color: [0.086, 0.639, 0.29] });
  line(dataset.title, { size: 13, bold: true });
  line(`Generated: ${dataset.generatedAt.toISOString().slice(0, 19).replace("T", " ")}`, { size: 9, color: [0.39, 0.45, 0.55] });
  y -= 6;

  if (dataset.summary) {
    line("Summary", { size: 11, bold: true });
    for (const [k, v] of Object.entries(dataset.summary)) {
      line(`${k}: ${v}`, { size: 9 });
    }
    y -= 6;
  }

  for (const section of dataset.sections) {
    y -= 4;
    line(section.heading, { size: 11, bold: true });
    line(section.columns.join("  |  "), { size: 8, bold: true, color: [0.39, 0.45, 0.55] });
    for (const row of section.rows.slice(0, 60)) {
      line(row.map((c) => String(c)).join("  |  "), { size: 8 });
    }
    if (section.rows.length > 60) line(`… ${section.rows.length - 60} more rows`, { size: 8, color: [0.39, 0.45, 0.55] });
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export function exportFile(
  dataset: ReportDataset,
  format: "csv" | "excel" | "pdf",
): Promise<{ body: Buffer | string; contentType: string; ext: string }> | { body: string; contentType: string; ext: string } {
  if (format === "csv") {
    return { body: toCsv(dataset), contentType: "text/csv; charset=utf-8", ext: "csv" };
  }
  if (format === "excel") {
    return toExcelBuffer(dataset).then((body) => ({
      body,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ext: "xlsx",
    }));
  }
  return toPdfBuffer(dataset).then((body) => ({ body, contentType: "application/pdf", ext: "pdf" }));
}

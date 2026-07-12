import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import type { ReportChart, ReportDataset } from "@/server/services/report.service";

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
    for (const [k, v] of Object.entries(dataset.summary)) lines.push(`${csvCell(k)},${csvCell(v)}`);
  }
  for (const section of dataset.sections) {
    lines.push("");
    lines.push(csvCell(section.heading));
    lines.push(section.columns.map(csvCell).join(","));
    for (const row of section.rows) lines.push(row.map(csvCell).join(","));
  }
  return lines.join("\n");
}

// ------------------------------- Excel -------------------------------

function sheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[[\]:*?/\\]/g, "").slice(0, 28) || "Sheet";
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) candidate = `${base.slice(0, 26)} ${i++}`;
  used.add(candidate.toLowerCase());
  return candidate;
}

export async function toExcelBuffer(dataset: ReportDataset): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "VerdantIQ";
  wb.created = dataset.generatedAt;
  const used = new Set<string>();

  const summarySheet = wb.addWorksheet(sheetName("Summary", used));
  summarySheet.addRow([dataset.title]).font = { bold: true, size: 14 };
  summarySheet.addRow(["Generated", dataset.generatedAt.toISOString()]);
  if (dataset.summary) {
    summarySheet.addRow([]);
    for (const [k, v] of Object.entries(dataset.summary)) summarySheet.addRow([k, v]);
  }
  summarySheet.columns.forEach((c) => (c.width = 28));

  for (const section of dataset.sections) {
    const ws = wb.addWorksheet(sheetName(section.heading, used));
    ws.addRow([section.heading]).font = { bold: true, size: 12 };
    ws.addRow([]);
    const header = ws.addRow(section.columns);
    header.font = { bold: true };
    header.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
    });
    for (const row of section.rows) ws.addRow(row);
    ws.columns.forEach((c) => (c.width = 22));
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ------------------------------- PDF -------------------------------

function hex(h: string): RGB {
  const n = h.replace("#", "");
  return rgb(
    parseInt(n.slice(0, 2), 16) / 255,
    parseInt(n.slice(2, 4), 16) / 255,
    parseInt(n.slice(4, 6), 16) / 255,
  );
}

/** Map non-WinAnsi glyphs to safe equivalents so Helvetica never throws. */
function san(s: unknown): string {
  return String(s ?? "")
    .replace(/₀/g, "0").replace(/₁/g, "1").replace(/₂/g, "2").replace(/₃/g, "3").replace(/₄/g, "4")
    .replace(/→/g, ">").replace(/←/g, "<").replace(/≥/g, ">=").replace(/≤/g, "<=")
    .replace(/[·•]/g, "-").replace(/[—–]/g, "-").replace(/…/g, "...")
    .replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, "");
}

export async function toPdfBuffer(dataset: ReportDataset): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
  const fmtNum = (n: number) => nf.format(n);
  const fmtDate = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");

  const W = 595.28;
  const H = 841.89;
  const M = 44;
  const contentW = W - M * 2;
  const FOOTER = 42;

  const c = {
    green: hex("#16a34a"),
    greenDark: hex("#15803d"),
    greenTint: hex("#dcfce7"),
    ink: hex("#0f172a"),
    muted: hex("#64748b"),
    border: hex("#e2e8f0"),
    light: hex("#f8fafc"),
    white: rgb(1, 1, 1),
    grid: hex("#eef2f6"),
  };
  const accents = [c.green, hex("#2563eb"), hex("#7c3aed"), hex("#f97316"), c.greenDark, hex("#0891b2")];

  interface TextOpts { size?: number; font?: PDFFont; color?: RGB; maxWidth?: number }

  let page!: PDFPage;
  let y = 0;
  const allPages: PDFPage[] = [];

  function text(p: PDFPage, s: unknown, x: number, yy: number, o: TextOpts = {}) {
    const size = o.size ?? 9;
    const f = o.font ?? font;
    let str = san(s);
    if (o.maxWidth && f.widthOfTextAtSize(str, size) > o.maxWidth) {
      while (str.length > 1 && f.widthOfTextAtSize(str + "..", size) > o.maxWidth) str = str.slice(0, -1);
      str += "..";
    }
    p.drawText(str, { x, y: yy, size, font: f, color: o.color ?? c.ink });
  }
  function textRight(p: PDFPage, s: unknown, xRight: number, yy: number, o: TextOpts = {}) {
    const size = o.size ?? 9;
    const f = o.font ?? font;
    let str = san(s);
    if (o.maxWidth) while (str.length > 1 && f.widthOfTextAtSize(str, size) > o.maxWidth) str = str.slice(0, -1);
    p.drawText(str, { x: xRight - f.widthOfTextAtSize(str, size), y: yy, size, font: f, color: o.color ?? c.ink });
  }
  function textCenter(p: PDFPage, s: unknown, cx: number, yy: number, o: TextOpts = {}) {
    const size = o.size ?? 9;
    const f = o.font ?? font;
    const str = san(s);
    p.drawText(str, { x: cx - f.widthOfTextAtSize(str, size) / 2, y: yy, size, font: f, color: o.color ?? c.ink });
  }

  function coverHeader(p: PDFPage) {
    p.drawRectangle({ x: 0, y: H - 132, width: W, height: 132, color: c.green });
    p.drawRectangle({ x: 0, y: H - 132, width: W, height: 5, color: c.greenDark });
    // logo badge
    p.drawCircle({ x: M + 15, y: H - 50, size: 15, color: c.white });
    textCenter(p, "V", M + 15, H - 56, { size: 18, font: bold, color: c.green });
    text(p, "VerdantIQ", M + 38, H - 47, { size: 20, font: bold, color: c.white });
    text(p, "ESG Operations, Engagement & Compliance", M + 38, H - 62, { size: 8.5, color: c.greenTint });
    text(p, dataset.title, M, H - 104, { size: 15, font: bold, color: c.white });
    textRight(p, "GreenWorks Industries", W - M, H - 48, { size: 10, font: bold, color: c.white });
    textRight(p, `Generated ${fmtDate(dataset.generatedAt)}`, W - M, H - 62, { size: 8, color: c.greenTint });
    const period = dataset.summary?.Period;
    if (period) textRight(p, `Period: ${period}`, W - M, H - 76, { size: 8, color: c.greenTint });
  }
  function runningHeader(p: PDFPage) {
    p.drawRectangle({ x: 0, y: H - 34, width: W, height: 34, color: c.green });
    text(p, "VerdantIQ", M, H - 22, { size: 11, font: bold, color: c.white });
    textRight(p, dataset.title, W - M, H - 22, { size: 9, color: c.greenTint });
  }
  function newPage(cover = false) {
    page = doc.addPage([W, H]);
    allPages.push(page);
    if (cover) {
      coverHeader(page);
      y = H - 132 - 22;
    } else {
      runningHeader(page);
      y = H - 34 - 22;
    }
  }
  function ensure(need: number) {
    if (y - need < FOOTER) newPage(false);
  }

  // ---------------- stat cards ----------------
  function drawStatCards(entries: [string, string | number][]) {
    const items = entries.slice(0, 6);
    const perRow = 3;
    const gap = 10;
    const cardW = (contentW - gap * (perRow - 1)) / perRow;
    const cardH = 48;
    for (let i = 0; i < items.length; i += perRow) {
      ensure(cardH + 10);
      const rowTop = y;
      for (let j = 0; j < perRow && i + j < items.length; j++) {
        const [label, val] = items[i + j];
        const x = M + j * (cardW + gap);
        const yb = rowTop - cardH;
        page.drawRectangle({ x, y: yb, width: cardW, height: cardH, color: c.light, borderColor: c.border, borderWidth: 1 });
        page.drawRectangle({ x, y: yb, width: 3, height: cardH, color: accents[(i + j) % accents.length] });
        text(page, label, x + 12, rowTop - 16, { size: 7.5, color: c.muted, maxWidth: cardW - 20 });
        text(page, String(val), x + 12, rowTop - 37, { size: 15, font: bold, color: c.ink, maxWidth: cardW - 20 });
      }
      y = rowTop - cardH - 10;
    }
    y -= 4;
  }

  // ---------------- charts ----------------
  function drawColumn(px: number, pb: number, pw: number, ph: number, chart: ReportChart) {
    const yAxisW = 30;
    const plotX = px + yAxisW;
    const plotW = pw - yAxisW;
    const max = Math.max(...chart.data.map((d) => d.value), 1);
    const niceMax = max * 1.14;
    // gridlines + y labels
    for (let g = 0; g <= 3; g++) {
      const gy = pb + (ph * g) / 3;
      page.drawLine({ start: { x: plotX, y: gy }, end: { x: plotX + plotW, y: gy }, thickness: 0.5, color: c.grid });
      textRight(page, fmtNum((niceMax * g) / 3), plotX - 4, gy - 2.5, { size: 6.5, color: c.muted });
    }
    page.drawLine({ start: { x: plotX, y: pb }, end: { x: plotX + plotW, y: pb }, thickness: 0.8, color: c.border });
    const n = chart.data.length;
    const slot = plotW / n;
    const barW = Math.min(slot * 0.5, 42);
    chart.data.forEach((d, i) => {
      const cx = plotX + slot * (i + 0.5);
      const bh = (d.value / niceMax) * ph;
      const col = d.color ? hex(d.color) : accents[i % accents.length];
      page.drawRectangle({ x: cx - barW / 2, y: pb, width: barW, height: Math.max(bh, 0.5), color: col });
      textCenter(page, fmtNum(d.value), cx, pb + bh + 3, { size: 6.5, font: bold, color: c.ink });
      textCenter(page, d.label, cx, pb - 10, { size: 6.5, color: c.muted, maxWidth: slot - 2 });
    });
  }

  function drawArea(px: number, pb: number, pw: number, ph: number, chart: ReportChart) {
    const yAxisW = 30;
    const plotX = px + yAxisW;
    const plotW = pw - yAxisW;
    const max = Math.max(...chart.data.map((d) => d.value), 1);
    const niceMax = max * 1.14;
    for (let g = 0; g <= 3; g++) {
      const gy = pb + (ph * g) / 3;
      page.drawLine({ start: { x: plotX, y: gy }, end: { x: plotX + plotW, y: gy }, thickness: 0.5, color: c.grid });
      textRight(page, fmtNum((niceMax * g) / 3), plotX - 4, gy - 2.5, { size: 6.5, color: c.muted });
    }
    const n = chart.data.length;
    const xAt = (i: number) => plotX + (plotW * i) / Math.max(n - 1, 1);
    const yAt = (v: number) => pb + (v / niceMax) * ph;
    // area fill via thin vertical strips
    const steps = Math.min(Math.floor(plotW / 2), 260);
    for (let s = 0; s <= steps; s++) {
      const t = (s / steps) * (n - 1);
      const i0 = Math.floor(t);
      const i1 = Math.min(i0 + 1, n - 1);
      const frac = t - i0;
      const v = chart.data[i0].value + (chart.data[i1].value - chart.data[i0].value) * frac;
      const sx = plotX + (plotW * s) / steps;
      page.drawRectangle({ x: sx, y: pb, width: plotW / steps + 0.6, height: yAt(v) - pb, color: c.green, opacity: 0.12 });
    }
    // line + markers
    for (let i = 0; i < n - 1; i++) {
      page.drawLine({ start: { x: xAt(i), y: yAt(chart.data[i].value) }, end: { x: xAt(i + 1), y: yAt(chart.data[i + 1].value) }, thickness: 1.6, color: c.green });
    }
    chart.data.forEach((d, i) => {
      page.drawCircle({ x: xAt(i), y: yAt(d.value), size: 2, color: c.green });
      if (n <= 12 && (i % 2 === 0 || n <= 6)) textCenter(page, d.label, xAt(i), pb - 10, { size: 6, color: c.muted });
    });
  }

  function drawProportion(px: number, top: number, pw: number, chart: ReportChart) {
    const total = chart.data.reduce((s, d) => s + d.value, 0) || 1;
    const barY = top - 20;
    const barH = 18;
    let cx = px;
    chart.data.forEach((d, i) => {
      const w = (d.value / total) * pw;
      page.drawRectangle({ x: cx, y: barY, width: w, height: barH, color: d.color ? hex(d.color) : accents[i % accents.length] });
      cx += w;
    });
    page.drawRectangle({ x: px, y: barY, width: pw, height: barH, borderColor: c.border, borderWidth: 0.6, color: c.white, opacity: 0 });
    // legend
    let lx = px;
    const ly = barY - 16;
    chart.data.forEach((d, i) => {
      const pctStr = `${Math.round((d.value / total) * 100)}%`;
      const label = `${san(d.label)} ${pctStr}`;
      page.drawRectangle({ x: lx, y: ly, width: 8, height: 8, color: d.color ? hex(d.color) : accents[i % accents.length] });
      text(page, label, lx + 11, ly + 1, { size: 7, color: c.ink });
      lx += 20 + font.widthOfTextAtSize(label, 7);
    });
  }

  function drawChart(chart: ReportChart) {
    if (!chart.data.length) return;
    const isProp = chart.type === "proportion";
    const chartH = isProp ? 52 : 128;
    const cardH = 22 + chartH + 14;
    ensure(cardH + 8);
    const cardTop = y;
    const cardBot = y - cardH;
    page.drawRectangle({ x: M, y: cardBot, width: contentW, height: cardH, color: c.white, borderColor: c.border, borderWidth: 1 });
    text(page, chart.title, M + 14, cardTop - 16, { size: 10, font: bold, color: c.ink });
    const px = M + 14;
    const pw = contentW - 28;
    if (isProp) {
      drawProportion(px, cardTop - 26, pw, chart);
    } else {
      const pb = cardBot + 22;
      const ph = cardTop - 30 - pb;
      if (chart.type === "area") drawArea(px, pb, pw, ph, chart);
      else drawColumn(px, pb, pw, ph, chart);
    }
    y = cardBot - 12;
  }

  // ---------------- tables ----------------
  function drawTable(section: ReportDataset["sections"][number]) {
    ensure(48);
    y -= 2;
    text(page, section.heading, M, y - 11, { size: 11, font: bold, color: c.ink });
    page.drawRectangle({ x: M, y: y - 16, width: 26, height: 2.5, color: c.green });
    y -= 24;

    const cols = section.columns;
    const weights = cols.map((_, i) => (i === 0 ? 2.2 : 1));
    const wsum = weights.reduce((a, b) => a + b, 0);
    const colW = weights.map((w) => (contentW * w) / wsum);
    const numeric = cols.map((_, ci) => {
      const vals = section.rows.map((r) => r[ci]).filter((v) => v !== undefined && v !== "");
      const nums = vals.filter((v) => typeof v === "number").length;
      return vals.length > 0 && nums / vals.length >= 0.6;
    });
    const headH = 20;
    const rowH = 17;

    const header = () => {
      page.drawRectangle({ x: M, y: y - headH, width: contentW, height: headH, color: c.greenTint });
      let cx = M;
      cols.forEach((col, ci) => {
        if (numeric[ci]) textRight(page, col, cx + colW[ci] - 6, y - 13, { size: 8, font: bold, color: c.greenDark, maxWidth: colW[ci] - 8 });
        else text(page, col, cx + 6, y - 13, { size: 8, font: bold, color: c.greenDark, maxWidth: colW[ci] - 8 });
        cx += colW[ci];
      });
      y -= headH;
    };

    ensure(headH + rowH);
    header();
    section.rows.forEach((row, ri) => {
      if (y - rowH < FOOTER) {
        newPage(false);
        y -= 2;
        header();
      }
      if (ri % 2 === 1) page.drawRectangle({ x: M, y: y - rowH, width: contentW, height: rowH, color: c.light });
      let cx = M;
      cols.forEach((_, ci) => {
        const cell = row[ci];
        const s = typeof cell === "number" ? fmtNum(cell) : String(cell ?? "");
        if (numeric[ci]) textRight(page, s, cx + colW[ci] - 6, y - 12, { size: 8, color: c.ink, maxWidth: colW[ci] - 8 });
        else text(page, s, cx + 6, y - 12, { size: 8, color: c.ink, maxWidth: colW[ci] - 8 });
        cx += colW[ci];
      });
      page.drawLine({ start: { x: M, y: y - rowH }, end: { x: M + contentW, y: y - rowH }, thickness: 0.4, color: c.border });
      y -= rowH;
    });
    y -= 12;
  }

  // ---------------- compose ----------------
  newPage(true);
  if (dataset.summary) {
    text(page, "Key metrics", M, y - 11, { size: 11, font: bold, color: c.ink });
    page.drawRectangle({ x: M, y: y - 16, width: 26, height: 2.5, color: c.green });
    y -= 26;
    drawStatCards(Object.entries(dataset.summary));
  }
  if (dataset.charts?.length) {
    ensure(30);
    text(page, "Visual insights", M, y - 11, { size: 11, font: bold, color: c.ink });
    page.drawRectangle({ x: M, y: y - 16, width: 26, height: 2.5, color: c.green });
    y -= 24;
    for (const chart of dataset.charts) drawChart(chart);
  }
  for (const section of dataset.sections) drawTable(section);

  // ---------------- footer + page numbers ----------------
  const total = allPages.length;
  allPages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: FOOTER - 6 }, end: { x: W - M, y: FOOTER - 6 }, thickness: 0.5, color: c.border });
    text(p, "VerdantIQ - Confidential", M, FOOTER - 16, { size: 7.5, color: c.muted });
    textCenter(p, `Generated ${fmtDate(dataset.generatedAt)}`, W / 2, FOOTER - 16, { size: 7.5, color: c.muted });
    textRight(p, `Page ${i + 1} of ${total}`, W - M, FOOTER - 16, { size: 7.5, color: c.muted });
  });

  return Buffer.from(await doc.save());
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

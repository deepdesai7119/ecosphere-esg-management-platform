import { apiError, requireApiCapability, parseQuery } from "@/lib/api";
import { getReport, type ReportFilters } from "@/server/services/report.service";
import { exportQuerySchema, coerceFrom, coerceTo } from "@/lib/validations/reports";
import { exportFile } from "@/lib/reports/exporters";

export async function GET(req: Request) {
  try {
    const user = await requireApiCapability("report.generate");
    const q = parseQuery(req, exportQuerySchema);
    const filters: ReportFilters = {
      organizationId: user.organizationId,
      departmentId: q.departmentId,
      from: coerceFrom(q.from),
      to: coerceTo(q.to),
      module: q.module,
      employeeId: q.employeeId,
      challengeId: q.challengeId,
      esgCategory: q.esgCategory,
    };
    const dataset = await getReport(q.type, filters);
    const { body, contentType, ext } = await exportFile(dataset, q.format);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `verdantiq-${q.type}-${date}.${ext}`;

    const payload = typeof body === "string" ? body : new Uint8Array(body);
    return new Response(payload, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

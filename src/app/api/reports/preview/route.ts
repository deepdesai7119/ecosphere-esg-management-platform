import { apiOk, handle, parseQuery, requireApiUser } from "@/lib/api";
import { getReport, type ReportFilters } from "@/server/services/report.service";
import { reportQuerySchema, coerceFrom, coerceTo } from "@/lib/validations/reports";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireApiUser();
    const q = parseQuery(req, reportQuerySchema);
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
    return apiOk(dataset);
  });
}

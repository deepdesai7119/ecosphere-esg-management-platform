import { apiOk, handle, parseBody, requireApiUser } from "@/lib/api";
import { proofSchema } from "@/lib/validations/social";
import { submitCsrProof } from "@/server/services/csr.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireApiUser();
    const { id } = await params;
    const body = await parseBody(req, proofSchema);
    const updated = await submitCsrProof({
      participationId: id,
      employeeId: user.id,
      ...body,
    });
    return apiOk(updated);
  });
}

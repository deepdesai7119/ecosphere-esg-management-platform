import { z } from "zod";
import { apiOk, handle, parseBody, requireApiUser } from "@/lib/api";
import { answerChatbotMessage } from "@/lib/predictions/chatbot";

const bodySchema = z.object({
  message: z.string().min(1).max(500),
  departmentId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireApiUser();
    const body = await parseBody(req, bodySchema);

    // Non-admin/manager roles are scoped to their own department only, so a
    // department head can't fish for another department's compliance data.
    const scopedDepartmentId =
      user.role === "ORG_ADMIN" || user.role === "ESG_MANAGER" || user.role === "AUDITOR"
        ? (body.departmentId ?? null)
        : (user.departmentId ?? null);

    const reply = await answerChatbotMessage(body.message, {
      organizationId: user.organizationId,
      departmentId: scopedDepartmentId,
    });

    return apiOk(reply);
  });
}

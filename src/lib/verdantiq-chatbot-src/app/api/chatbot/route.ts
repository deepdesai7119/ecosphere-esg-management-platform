import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// NOTE: adjust this import to match your actual session helper.
// Based on README this project uses Auth.js (next-auth v5) with a
// `requireUser()`-style pattern referenced in ARCHITECTURE.md. If your helper
// lives elsewhere (e.g. `@/lib/auth`), just fix this one import.
import { requireUser } from "@/lib/auth/session";
import { answerChatbotMessage } from "@/lib/predictions/chatbot";
import { HttpError } from "@/lib/api";

const bodySchema = z.object({
  message: z.string().min(1).max(500),
  departmentId: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // Non-admin/manager roles are scoped to their own department only, so a
    // department head can't fish for another department's compliance data.
    const scopedDepartmentId =
      user.role === "ORG_ADMIN" || user.role === "ESG_MANAGER" || user.role === "AUDITOR"
        ? (parsed.data.departmentId ?? null)
        : (user.departmentId ?? null);

    const reply = await answerChatbotMessage(parsed.data.message, {
      organizationId: user.organizationId,
      departmentId: scopedDepartmentId,
    });

    return NextResponse.json(reply);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api/chatbot] failed:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

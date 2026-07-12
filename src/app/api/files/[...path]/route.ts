import { apiError, requireApiUser } from "@/lib/api";
import { readUpload } from "@/lib/uploads/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    await requireApiUser();
    const { path } = await params;
    const rel = path.join("/");
    const { buffer, contentType } = await readUpload(rel);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=60",
        "Content-Disposition": `inline; filename="${path[path.length - 1]}"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

import { apiOk, badRequest, handle, requireApiUser } from "@/lib/api";
import { saveUpload } from "@/lib/uploads/storage";

export async function POST(req: Request) {
  return handle(async () => {
    await requireApiUser();
    const form = await req.formData();
    const file = form.get("file");
    const subdir = (form.get("subdir") as string) || "proofs";
    if (!(file instanceof File)) throw badRequest("No file provided.");
    const stored = await saveUpload(file, subdir);
    return apiOk({ url: stored.url, filename: stored.filename, size: stored.size });
  });
}

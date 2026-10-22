import { readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { uploadDir } from "@/lib/uploads";

const TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
};

export async function GET(_request: Request, ctx: RouteContext<"/api/uploads/[file]">) {
  const { file } = await ctx.params;
  const name = basename(file);
  const type = TYPES[extname(name).toLowerCase()];
  if (!type || name !== file) return new Response("No encontrado", { status: 404 });
  try {
    const data = await readFile(join(uploadDir(), name));
    return new Response(data, {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}

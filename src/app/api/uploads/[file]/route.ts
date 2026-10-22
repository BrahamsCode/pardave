import { db } from "@/lib/db";

/** Sirve las imágenes subidas desde el panel (guardadas en la tabla Upload). */
export async function GET(_request: Request, ctx: RouteContext<"/api/uploads/[file]">) {
  const { file } = await ctx.params;
  if (!/^[a-z0-9]{20,40}$/.test(file)) return new Response("No encontrado", { status: 404 });
  const upload = await db.upload.findUnique({ where: { id: file } });
  if (!upload) return new Response("No encontrado", { status: 404 });
  return new Response(upload.data, {
    headers: {
      "Content-Type": upload.contentType,
      "Content-Length": String(upload.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

import { join } from "node:path";

/** Carpeta donde se guardan las imágenes subidas desde el panel (fuera de /public). */
export function uploadDir() {
  return process.env.UPLOAD_DIR ?? join(process.cwd(), "storage", "uploads");
}

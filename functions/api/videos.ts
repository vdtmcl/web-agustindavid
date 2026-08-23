import { loadContent } from "../_lib/content";
import { json, noStore, serverError } from "../_lib/response";

export const onRequestGet = async ({ env }: any) => {
  try {
    const content = await loadContent(env);
    return json({ hero: content.find((item: any) => item.placement === "hero") || null, gallery: content.filter((item: any) => item.placement === "gallery") }, { headers: noStore() });
  } catch {
    return serverError("No fue posible cargar el contenido.");
  }
};
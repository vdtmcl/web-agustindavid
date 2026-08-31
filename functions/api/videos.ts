import { loadContent } from "../_lib/content";
import { json, noStore, serverError } from "../_lib/response";

export const onRequestGet = async ({ env }: any) => {
  try {
    const content = await loadContent(env);
    const complete = (item: any) => {
      if (item.type !== "photo_album") return true;
      const required = item.variant === "album-4" ? 4 : item.variant === "album-9" ? 9 : 0;
      return required > 0 && item.photos.length === required;
    };
    return json({
      hero: content.find((item: any) => item.placement === "hero") || null,
      gallery: content.filter((item: any) => item.placement === "gallery" && complete(item)),
    }, { headers: noStore() });
  } catch {
    return serverError("No fue posible cargar el contenido.");
  }
};
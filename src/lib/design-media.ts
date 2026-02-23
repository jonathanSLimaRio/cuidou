import { DesignMediaCatalogItem, DesignMediaKey, designMediaCatalog } from "@/content/design-media-catalog";
import { DesignImage, pickWordPressImage } from "@/lib/wordpress-content";

export type ResolvedDesignImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

function toResolved(item: DesignMediaCatalogItem): ResolvedDesignImage | null {
  if (!item.url.trim()) {
    return null;
  }

  return {
    src: item.url,
    alt: item.alt,
    width: item.width,
    height: item.height,
  };
}

export function resolveDesignImage(
  key: DesignMediaKey,
  fallbackGallery: DesignImage[],
  fallbackIndex: number,
  fallbackAlt: string,
) {
  const fromCatalog = toResolved(designMediaCatalog[key]);
  if (fromCatalog) {
    return fromCatalog;
  }

  return pickWordPressImage(fallbackGallery, fallbackIndex, fallbackAlt);
}

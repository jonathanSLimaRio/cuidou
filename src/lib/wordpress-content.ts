export type DesignImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type WordPressMediaApiItem = {
  id: number;
  source_url?: string;
  alt_text?: string;
  media_details?: {
    width?: number;
    height?: number;
  };
  title?: {
    rendered?: string;
  };
};

function getWordPressBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_WORDPRESS_API_URL ?? process.env.WORDPRESS_URL;
  if (!raw) {
    return null;
  }

  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function toDesignImage(item: WordPressMediaApiItem): DesignImage | null {
  if (!item.source_url) {
    return null;
  }

  const width = item.media_details?.width ?? 1400;
  const height = item.media_details?.height ?? 900;
  const alt = item.alt_text?.trim() || item.title?.rendered?.trim() || "Imagem ilustrativa";

  return {
    src: item.source_url,
    alt,
    width,
    height,
  };
}

export async function getWordPressMediaGallery(limit = 36) {
  const baseUrl = getWordPressBaseUrl();
  if (!baseUrl) {
    return [] as DesignImage[];
  }

  const endpoint = `${baseUrl}/wp-json/wp/v2/media?per_page=${Math.min(limit, 50)}&_fields=id,source_url,alt_text,media_details,title`;

  try {
    const response = await fetch(endpoint, {
      cache: "force-cache",
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return [] as DesignImage[];
    }

    const payload = (await response.json()) as WordPressMediaApiItem[];

    return payload
      .map(toDesignImage)
      .filter((item): item is DesignImage => Boolean(item));
  } catch {
    return [] as DesignImage[];
  }
}

export function pickWordPressImage(
  gallery: DesignImage[],
  index: number,
  fallbackAlt: string,
): DesignImage | null {
  const selected = gallery[index % Math.max(gallery.length, 1)] ?? null;

  if (!selected) {
    return null;
  }

  return {
    ...selected,
    alt: selected.alt || fallbackAlt,
  };
}

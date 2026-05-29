// Parsing + metadata fetching for Vimeo videos. No API key needed — oEmbed is public.

const PATTERNS = [
  /vimeo\.com\/(?:channels\/[^/]+\/)?(\d+)/i,
  /player\.vimeo\.com\/video\/(\d+)/i,
  /vimeo\.com\/video\/(\d+)/i,
];

export function extractVimeoId(url: string): string | null {
  for (const p of PATTERNS) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export interface VimeoMetadata {
  thumbnailUrl: string | null;
  title: string | null;
}

export async function fetchVimeoMetadata(url: string): Promise<VimeoMetadata | null> {
  try {
    const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}&width=1280`;
    const res = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    return {
      thumbnailUrl: typeof data.thumbnail_url === 'string' ? data.thumbnail_url : null,
      title: typeof data.title === 'string' ? data.title : null,
    };
  } catch (err) {
    console.error('Vimeo oEmbed fetch failed:', err);
    return null;
  }
}

// Player embed URL with privacy-friendly defaults and a clean chrome.
export function vimeoEmbedUrl(id: string): string {
  return `https://player.vimeo.com/video/${id}?byline=0&portrait=0&title=0&dnt=1`;
}

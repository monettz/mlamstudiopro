export function normalizeProductImages(value: unknown): string[] | null | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return null;
  if (value.length > 12) return null;
  const images: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') return null;
    const image = item.trim();
    if (!image || image.length > 2048 || image.startsWith('//')) return null;
    if (image.startsWith('/')) {
      if (image.split(/[?#]/)[0].split('/').some(part => part === '..')) return null;
    } else {
      try {
        const url = new URL(image);
        if (url.protocol !== 'https:') return null;
      } catch { return null; }
    }
    if (!images.includes(image)) images.push(image);
  }
  return images;
}

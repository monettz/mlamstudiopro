export const MAX_TUTORIAL_BYTES = 50 * 1024 * 1024;

export function videoFormat(bytes: Uint8Array): string | null {
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp") {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (["isom", "iso2", "mp41", "mp42", "avc1", "M4V ", "dash", "iso5", "iso6"].includes(brand)) return "video/mp4";
  }
  if (bytes.length >= 4 && [26, 69, 223, 163].every((value, index) => bytes[index] === value)) {
    if (new TextDecoder().decode(bytes).includes("webm")) return "video/webm";
  }
  return null;
}

export function byteRange(header: string | null, size: number): { offset: number; length: number } | null | false {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2]) || size <= 0) return false;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return false;
    return { offset: Math.max(0, size - suffix), length: Math.min(size, suffix) };
  }
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) return false;
  return { offset: start, length: Math.min(size - 1, end) - start + 1 };
}

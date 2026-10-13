export const MAX_PRODUCT_IMAGE_BYTES = 10 * 1024 * 1024;

export function imageFormat(bytes: Uint8Array): { extension: string; contentType: string } | null {
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) {
    return { extension: "png", contentType: "image/png" };
  }
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    return { extension: "webp", contentType: "image/webp" };
  }
  return null;
}

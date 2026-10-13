import { env } from "@/lib/runtime";

export type Product = {
  id: string; slug: string; name: string; category: string; description: string;
  price_cents: number; status: string; image: string; features: string;
  checkout_url: string; created_at: string; updated_at: string; description_translations?:string;
};

export type Release = {
  id: string; product_id: string; product_name?: string; version: string; r2_key: string;
  file_name: string; file_size: number; is_active: number; notes: string; created_at: string;
};

export function database(): LocalDatabase { return (env as unknown as { DB: LocalDatabase }).DB; }

export async function ensureStore() {
  const db = database();
  const now = new Date().toISOString();
  const seeds: (string | number)[][] = [
    ["voice-midi", "voice-midi", "MLAM Voice MIDI", "MIDI Instrument", "Geuza sauti, humming na melody kuwa MIDI inayoweza kuhaririwa ndani ya DAW yako.", 2900, "published", "/plugins/mlam-voice-midi.png", JSON.stringify(["Voice to MIDI", "Scale-aware notes", "VST3 for Windows", "Lifetime license"]), ""],
    ["bushman-bass", "bushman-bass", "Bushman Bass", "Bass Instrument", "Bass instrument yenye presets za electric, slap, fretless na deep sub kwa production ya kisasa.", 4900, "coming-soon", "/plugins/bushman-bass.png", JSON.stringify(["Expressive bass engine", "Preset browser", "MIDI control", "VST3"]), ""],
    ["mlam-piano", "mlam-piano", "MLAM Piano", "Piano Instrument", "The piano instrument from MLAM Studio Pro. Standalone release coming soon.", 0, "coming-soon", "/plugins/mlam-piano.png", JSON.stringify(["Piano instrument", "MIDI keyboard", "MLAM studio design"]), ""],
    ["pro-eq", "pro-eq", "MLAM Pro EQ", "Audio Effect", "Parametric EQ safi yenye spectrum ya realtime na workflow ya haraka kwa mixing.", 2500, "coming-soon", "/plugins/mlam-voice-midi.png", JSON.stringify(["Dynamic spectrum", "Zero-latency mode", "A/B compare", "VST3"]), ""],
    ["stereo-imager", "stereo-imager", "MLAM Imager / Stereo Forge", "Stereo Effect", "The Stereo Forge Imager from MLAM Studio Pro. Shape stereo width with mid/side processing, input gain and output gain. Standalone release coming soon.", 0, "coming-soon", "/plugins/mlam-imager.svg", JSON.stringify(["Stereo Width 0–200%", "Mid/side processing", "Input / output gain", "Bypass"]), ""],
    ["mlam-daw", "mlam-daw", "MLAM Studio Pro", "DAW", "Our complete workspace for recording, arranging and mixing music. Coming soon.", 0, "coming-soon", "/mlam-studio-pro-splash.png", JSON.stringify(["Record", "Arrange", "Mix", "Stock instruments"]), ""],
  ];
  for (const p of seeds) {
    await db.prepare(`INSERT OR IGNORE INTO products (id, slug, name, category, description, price_cents, status, image, features, checkout_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(...p, now, now).run();
  }
  // Repair only the original placeholder image, preserving any owner-uploaded art.
  await db.prepare("UPDATE products SET image=? WHERE id=? AND image=?")
    .bind("/plugins/bushman-bass.png", "bushman-bass", "/plugins/mlam-voice-midi.png").run();
  await db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('support_email', 'melaninentertainment255@gmail.com')").run();
}

export async function listProducts(publicOnly = false): Promise<Product[]> {
  await ensureStore();
  const sql = publicOnly ? "SELECT * FROM products WHERE status IN ('published','coming-soon') ORDER BY CASE status WHEN 'published' THEN 0 ELSE 1 END, created_at" : "SELECT * FROM products ORDER BY created_at DESC";
  const result = await database().prepare(sql).all<Product>();
  return result.results ?? [];
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function keyForLicense() {
  const raw = crypto.randomUUID().replaceAll("-", "").toUpperCase();
  return `MLAM-${raw.slice(0, 5)}-${raw.slice(5, 10)}-${raw.slice(10, 15)}-${raw.slice(15, 20)}`;
}

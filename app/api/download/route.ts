import { GET as downloadRelease } from "./[licenseKey]/route";

export async function POST(request: Request) {
  let input: { licenseKey?: unknown };
  try { input = await request.json(); }
  catch { return Response.json({ error: "Enter your license key" }, { status: 400 }); }
  const licenseKey = typeof input?.licenseKey === "string" ? input.licenseKey.trim().toUpperCase() : "";
  if (!/^MLAM(?:-[A-Z0-9]{5}){4}$/.test(licenseKey)) {
    return Response.json({ error: "Check the format of your MLAM license key" }, { status: 400 });
  }
  return downloadRelease(request, { params: Promise.resolve({ licenseKey }) });
}

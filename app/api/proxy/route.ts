import { NextRequest, NextResponse } from "next/server";

const CHUNK_SIZE = 256 * 1024; // 256KB

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    // مرحله ۱: اول هدر Content-Length رو بگیر
    const headRes = await fetch(url, { method: "HEAD" });
    if (!headRes.ok) {
      return NextResponse.json({ error: "HEAD failed" }, { status: 400 });
    }

    const lenStr = headRes.headers.get("content-length");
    const size = lenStr ? parseInt(lenStr, 10) : 0;

    // مرحله ۲: رنج اول فایل
    const startRes = await fetch(url, {
      headers: { Range: `bytes=0-${CHUNK_SIZE - 1}` },
    });

    const startBuf = startRes.ok ? await startRes.arrayBuffer() : new ArrayBuffer(0);

    // مرحله ۳: رنج آخر فایل (اگه سایز معلوم باشه)
    let endBuf = new ArrayBuffer(0);
    if (size > CHUNK_SIZE) {
      const start = Math.max(0, size - CHUNK_SIZE);
      const endRes = await fetch(url, {
        headers: { Range: `bytes=${start}-${size - 1}` },
      });
      endBuf = endRes.ok ? await endRes.arrayBuffer() : new ArrayBuffer(0);
    }

    // مرحله ۴: ترکیب دو بخش
    const totalLength = startBuf.byteLength + endBuf.byteLength;
    const merged = new Uint8Array(totalLength);
    merged.set(new Uint8Array(startBuf), 0);
    merged.set(new Uint8Array(endBuf), startBuf.byteLength);

    return new NextResponse(merged, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": totalLength.toString(),
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    console.error("Proxy error:", e);
    return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
  }
}

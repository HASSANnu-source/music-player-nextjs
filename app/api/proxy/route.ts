// app/api/proxy/route.ts
import { NextRequest } from "next/server";

const RANGE_SIZE = 256 * 1024; // 256KB از اول فایل

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new Response("Missing url", { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: { Range: `bytes=0-${RANGE_SIZE - 1}` },
      cache: "no-store",
    });

    if (!response.ok || !response.body) {
      return new Response("Failed to fetch remote file", { status: 502 });
    }

    // فقط بخشی از اول فایل رو برمی‌گردونیم
    return new Response(response.body, {
      status: 206,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
        "Content-Range": response.headers.get("Content-Range") ?? `bytes 0-${RANGE_SIZE - 1}/*`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("[proxy error]", err);
    return new Response("Proxy error", { status: 500 });
  }
}

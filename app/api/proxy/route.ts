import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing URL" }, { status: 400 });

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });

    const arrayBuffer = await res.arrayBuffer();
    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (e) {
    return NextResponse.json({ error: "Exception: " + (e as Error).message }, { status: 500 });
  }
}

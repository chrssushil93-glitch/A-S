import { NextResponse } from "next/server";
import { COOKIE, clearFailures, cookieOptions, makeToken, noteFailure, passwordOk, throttled } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (throttled(ip)) return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (!passwordOk(String(body.password ?? ""))) {
    noteFailure(ip);
    await new Promise((r) => setTimeout(r, 700));
    return NextResponse.json({ error: "That password isn't right." }, { status: 401 });
  }
  clearFailures(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(), cookieOptions);
  return res;
}

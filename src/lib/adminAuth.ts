import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "wa_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

const secret = () =>
  process.env.ADMIN_SECRET ||
  createHash("sha256").update(`wedding-archive:${process.env.ADMIN_PASSWORD ?? ""}`).digest("hex");

const sign = (exp: string) => createHmac("sha256", secret()).update(exp).digest("hex");

function safeEqual(a: string, b: string) {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

export const passwordOk = (given: string) =>
  adminConfigured() && safeEqual(given, process.env.ADMIN_PASSWORD!);

export function makeToken(now = Date.now()) {
  const exp = String(Math.floor(now / 1000) + MAX_AGE);
  return `${exp}.${sign(exp)}`;
}

export function tokenOk(token: string | undefined, now = Date.now()) {
  if (!token || !adminConfigured()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < now / 1000) return false;
  return safeEqual(sig, sign(exp));
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};

export async function isAdmin() {
  return tokenOk((await cookies()).get(COOKIE)?.value);
}

/** Failed-login throttle (per server instance; enough to make guessing impractical). */
const fails = new Map<string, { n: number; until: number }>();
export function throttled(ip: string, now = Date.now()) {
  const f = fails.get(ip);
  return Boolean(f && f.n >= 5 && f.until > now);
}
export function noteFailure(ip: string, now = Date.now()) {
  const f = fails.get(ip);
  fails.set(ip, { n: (f && f.until > now ? f.n : 0) + 1, until: now + 10 * 60 * 1000 });
}
export function clearFailures(ip: string) {
  fails.delete(ip);
}

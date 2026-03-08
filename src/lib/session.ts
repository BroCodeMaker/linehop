import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me";
const TTL = 60 * 60 * 24 * 7; // 7 days

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function signSession(payload: object): string {
  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + TTL })));
  const sig = b64url(createHmac("sha256", SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

export function verifySession(token: string): Record<string, unknown> | null {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;
    const expected = b64url(createHmac("sha256", SECRET).update(`${header}.${body}`).digest());
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64").toString()) as Record<string, unknown>;
    if (typeof payload.exp === "number" && Date.now() > payload.exp * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

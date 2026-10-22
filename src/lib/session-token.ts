import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "pdv_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

export type SessionPayload = {
  userId: string;
  role: "ADMIN" | "STAFF";
};

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET debe tener al menos 32 caracteres");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId, role: payload.role === "ADMIN" ? "ADMIN" : "STAFF" };
  } catch {
    return null;
  }
}

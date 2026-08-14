import { SignJWT, jwtVerify } from "jose";

export interface SessionPayload {
  userId: string;
  isAdmin: boolean;
}

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET ?? "fallback-dev-secret-change-in-production"
  );

export async function createSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

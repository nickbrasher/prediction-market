import { cookies } from "next/headers";
import { verifySession } from "./session";
import { prisma } from "./prisma";

export type { SessionPayload } from "./session";
export { createSession, verifySession } from "./session";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      email: true,
      pointBalance: true,
      isAdmin: true,
    },
  });
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (!user.isAdmin) throw new Error("Forbidden");
  return user;
}

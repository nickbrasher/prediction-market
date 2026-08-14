import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      pointBalance: true,
      isAdmin: true,
      createdAt: true,
      _count: { select: { bets: true } },
    },
    orderBy: { pointBalance: "desc" },
  });

  return NextResponse.json(users);
}

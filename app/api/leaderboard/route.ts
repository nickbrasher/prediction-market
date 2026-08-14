import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      pointBalance: true,
      _count: { select: { bets: true } },
    },
    orderBy: { pointBalance: "desc" },
    take: 50,
  });

  return NextResponse.json(users);
}

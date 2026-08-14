import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { isAdmin } = await req.json();

  const user = await prisma.user.update({
    where: { id },
    data: { isAdmin },
    select: { id: true, username: true, isAdmin: true },
  });

  return NextResponse.json(user);
}

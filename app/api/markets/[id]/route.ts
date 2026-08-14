import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      outcomes: true,
      bets: {
        include: { user: { select: { username: true } }, outcome: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!market) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(market);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const data = await req.json();

  const market = await prisma.market.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.closesAt !== undefined ? { closesAt: data.closesAt ? new Date(data.closesAt) : null } : {}),
    },
    include: { outcomes: true },
  });

  return NextResponse.json(market);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.market.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

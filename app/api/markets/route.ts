import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { MarketStatus, MarketType } from "@/app/generated/prisma/enums";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const type = searchParams.get("type") ?? undefined;

  const markets = await prisma.market.findMany({
    where: {
      ...(status ? { status: status as MarketStatus } : {}),
      ...(type ? { type: type as MarketType } : {}),
    },
    include: { outcomes: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(markets);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description, type, line, closesAt, outcomes } = await req.json();

  if (!title || !description || !type || !outcomes?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const market = await prisma.market.create({
    data: {
      title,
      description,
      type: type as MarketType,
      line: line ?? null,
      closesAt: closesAt ? new Date(closesAt) : null,
      createdById: session.userId,
      outcomes: {
        create: outcomes.map((label: string) => ({ label, poolTotal: 0 })),
      },
    },
    include: { outcomes: true },
  });

  return NextResponse.json(market, { status: 201 });
}

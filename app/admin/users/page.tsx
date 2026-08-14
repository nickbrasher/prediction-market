import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminUsersClient from "./AdminUsersClient";

export default async function AdminUsersPage() {
  await requireAdmin().catch(() => redirect("/"));

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
    orderBy: { createdAt: "desc" },
  });

  return <AdminUsersClient users={users} />;
}

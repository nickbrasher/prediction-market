import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "PredictPoint",
  description: "Points-based prediction markets",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f1117] text-slate-100 antialiased">
        <Nav initialUser={user} />
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}

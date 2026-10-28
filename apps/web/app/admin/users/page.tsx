"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminUsersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/operations");
  }, [router]);

  return (
    <main className="portal" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <p className="muted">Opening Admin User Management Workspace…</p>
    </main>
  );
}

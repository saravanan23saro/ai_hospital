"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminStaffPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/operations");
  }, [router]);

  return (
    <main className="portal" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <p className="muted">Opening Admin Staff Management Workspace…</p>
    </main>
  );
}

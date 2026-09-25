"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterRedirect() {
  const router = useRouter();
  useEffect(() => router.replace("/"), [router]);
  return (
    <main className="portal">
      <section>
        <p>Opening the unified sign-in page…</p>
      </section>
    </main>
  );
}

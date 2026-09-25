"use client";

import { useRouter } from "next/navigation";

export default function BackButton({
  label = "← Back",
  fallbackHref = "/staff",
  style,
}: {
  label?: string;
  fallbackHref?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();

  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      className="back-button-ui"
      onClick={handleClick}
      aria-label={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        background: "var(--surface)",
        color: "var(--brand-dark)",
        border: "1px solid var(--line)",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 650,
        cursor: "pointer",
        transition: "all 0.18s ease-in-out",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        ...style,
      }}
    >
      {label}
    </button>
  );
}

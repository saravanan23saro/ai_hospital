import type { Metadata } from "next";
import "./styles.css";
import "./workflow.css";
export const metadata: Metadata = {
  title: "CareFlow AI",
  description: "Safe, intelligent hospital scheduling",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

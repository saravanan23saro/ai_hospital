export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl && envUrl !== "https://careflow-api.onrender.com") {
    return envUrl.replace(/\/+$/, "");
  }
  // Auto-connect to active Render backend on Vercel deployments if not explicitly configured or set to placeholder
  if (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")) {
    return "https://careflow-api-mtzd.onrender.com";
  }
  if (envUrl === "https://careflow-api.onrender.com") {
    return "https://careflow-api-mtzd.onrender.com";
  }
  return "http://localhost:8180";
}

export const API = getApiBaseUrl();

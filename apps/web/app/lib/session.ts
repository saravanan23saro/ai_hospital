export type CareFlowSession = { accessToken: string; refreshToken: string };
const KEY = "careflowSession";

export function loadSession(): CareFlowSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CareFlowSession) : null;
  } catch {
    sessionStorage.removeItem(KEY);
    return null;
  }
}

export function saveSession(session: CareFlowSession) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

function decodeJwtExpiry(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof atob === "function"
        ? decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          )
        : typeof Buffer !== "undefined"
        ? Buffer.from(base64, "base64").toString("utf-8")
        : null;
    if (!json) return null;
    const payload = JSON.parse(json);
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

let activeRefreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(apiUrl: string): Promise<string | null> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    const session = loadSession();
    if (!session || !session.refreshToken) {
      clearStoredSession();
      return null;
    }

    try {
      const res = await fetch(`${apiUrl}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });

      if (!res.ok) {
        clearStoredSession();
        return null;
      }

      const tokens = await res.json();
      if (!tokens?.accessToken || !tokens?.refreshToken) {
        clearStoredSession();
        return null;
      }

      const newSession: CareFlowSession = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
      saveSession(newSession);
      return newSession.accessToken;
    } catch {
      clearStoredSession();
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

export async function sessionFetch(
  apiUrl: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  let session = loadSession();
  if (!session) {
    throw new Error("Please sign in to continue.");
  }

  // 1. Proactive refresh if access token is expired or about to expire in <= 15s
  const exp = decodeJwtExpiry(session.accessToken);
  if (exp && Date.now() >= (exp - 15) * 1000) {
    const refreshedToken = await refreshAccessToken(apiUrl);
    if (refreshedToken) {
      session = loadSession() || { accessToken: refreshedToken, refreshToken: session.refreshToken };
    }
  }

  const send = (token: string) =>
    fetch(apiUrl + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

  let response = await send(session.accessToken);
  if (response.status !== 401) {
    return response;
  }

  // 2. Reactive refresh with shared promise if server rejected the token
  const newToken = await refreshAccessToken(apiUrl);
  if (!newToken) {
    clearStoredSession();
    return response;
  }

  return send(newToken);
}

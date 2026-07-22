"use client";

import { useCallback, useEffect, useState } from "react";

/** The view encoded in the URL path. Every fixed tab has a real exported page
 *  (`/`, `/activity/`, `/chat/`, `/profile/`, `/post/`), so a reload or a
 *  shared link resolves without a server. Dynamic arguments travel as query
 *  params (`/profile/?u=<id>`, `/post/?id=<id>`) because per-id pages can't
 *  exist in a static export. */
export type NokorRoute =
  | { name: "home" }
  | { name: "activity" }
  | { name: "chat" }
  | { name: "profile"; userId: string | null } // null = own profile
  | { name: "post"; postId: string };

/** The Nokor deployment serves the app at the site root; the portfolio build
 *  serves it under /nokor. Keep in sync with (portfolio)/page.tsx. */
const BASE = process.env.NEXT_PUBLIC_APP === "nokor" ? "" : "/nokor";

/** Legacy `#/...` and `#post-<id>` links (pre path-routing). Parsed once on
 *  mount so old shared links still open, then rewritten to the new URL. */
function parseHash(raw: string): NokorRoute {
  let h = raw.startsWith("#") ? raw.slice(1) : raw;
  if (h.startsWith("post-")) return { name: "post", postId: h.slice(5) };
  if (h.startsWith("/")) h = h.slice(1);
  const [seg, arg] = h.split("/");
  switch (seg) {
    case "activity":
      return { name: "activity" };
    case "chat":
      return { name: "chat" };
    case "profile":
      return { name: "profile", userId: arg ? decodeURIComponent(arg) : null };
    case "post":
      return arg ? { name: "post", postId: decodeURIComponent(arg) } : { name: "home" };
    default:
      return { name: "home" };
  }
}

function parseLocation(pathname: string, search: string): NokorRoute {
  let p = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  p = p.replace(/^\/+|\/+$/g, "");
  const params = new URLSearchParams(search);
  switch (p) {
    case "activity":
      return { name: "activity" };
    case "chat":
      return { name: "chat" };
    case "profile":
      return { name: "profile", userId: params.get("u") };
    case "post": {
      const id = params.get("id");
      return id ? { name: "post", postId: id } : { name: "home" };
    }
    default:
      return { name: "home" };
  }
}

export function routeToPath(r: NokorRoute): string {
  switch (r.name) {
    case "home":
      return `${BASE}/`;
    case "activity":
      return `${BASE}/activity/`;
    case "chat":
      return `${BASE}/chat/`;
    case "profile":
      return r.userId ? `${BASE}/profile/?u=${encodeURIComponent(r.userId)}` : `${BASE}/profile/`;
    case "post":
      return `${BASE}/post/?id=${encodeURIComponent(r.postId)}`;
  }
}

export function useNokorRoute() {
  const [route, setRoute] = useState<NokorRoute>(() => {
    if (typeof window === "undefined") return { name: "home" };
    const legacy = window.location.hash;
    if (legacy.startsWith("#/") || legacy.startsWith("#post-")) return parseHash(legacy);
    return parseLocation(window.location.pathname, window.location.search);
  });

  useEffect(() => {
    // The initializer already parsed a legacy hash link; here just rewrite the
    // URL bar to the new path form.
    const legacy = window.location.hash;
    if (legacy.startsWith("#/") || legacy.startsWith("#post-")) {
      window.history.replaceState({}, "", routeToPath(parseHash(legacy)));
    }
    const sync = () => setRoute(parseLocation(window.location.pathname, window.location.search));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const navigate = useCallback((r: NokorRoute) => {
    if (typeof window === "undefined") return;
    const path = routeToPath(r);
    if (window.location.pathname + window.location.search !== path) {
      window.history.pushState({}, "", path);
    }
    setRoute(r);
  }, []);

  return { route, navigate };
}

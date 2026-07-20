"use client";

import { useCallback, useEffect, useState } from "react";

/** The view encoded in the URL hash. The hash never reaches the server, so
 *  this is safe under the static export — a reload or a shared link restores
 *  the exact view instead of always landing on the home tab. */
export type NokorRoute =
  | { name: "home" }
  | { name: "activity" }
  | { name: "chat" }
  | { name: "profile"; userId: string | null } // null = own profile
  | { name: "post"; postId: string };

function parseHash(raw: string): NokorRoute {
  let h = raw.startsWith("#") ? raw.slice(1) : raw;
  // Legacy share anchor `#post-<id>` (kept working so old links still open).
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

export function routeToHash(r: NokorRoute): string {
  switch (r.name) {
    case "home":
      return "#/home";
    case "activity":
      return "#/activity";
    case "chat":
      return "#/chat";
    case "profile":
      return r.userId ? `#/profile/${encodeURIComponent(r.userId)}` : "#/profile";
    case "post":
      return `#/post/${encodeURIComponent(r.postId)}`;
  }
}

export function useNokorRoute() {
  const [route, setRoute] = useState<NokorRoute>(() =>
    typeof window === "undefined" ? { name: "home" } : parseHash(window.location.hash),
  );

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    // Sync once in case the hash was present before this effect ran.
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((r: NokorRoute) => {
    if (typeof window === "undefined") return;
    const hash = routeToHash(r);
    // Assigning the hash pushes a history entry and fires `hashchange`, which
    // updates state. Re-navigating to the same hash won't fire, so sync here.
    if (window.location.hash !== hash) window.location.hash = hash;
    else setRoute(r);
  }, []);

  return { route, navigate };
}

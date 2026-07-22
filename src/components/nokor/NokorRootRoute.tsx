"use client";

import { useEffect } from "react";
import NokorApp from "./NokorApp";

const isNokorRoot = process.env.NEXT_PUBLIC_APP === "nokor";

/** Root-level Nokor tab route (`/activity`, `/profile`, `/post`). On the Nokor
 *  deployment these serve the app directly; on the portfolio build the same
 *  paths exist only to bounce shared links to the `/nokor/...` equivalent. */
export default function NokorRootRoute() {
  useEffect(() => {
    if (!isNokorRoot) {
      window.location.replace(`/nokor${window.location.pathname}${window.location.search}`);
    }
  }, []);
  if (!isNokorRoot) return null;
  return <NokorApp />;
}

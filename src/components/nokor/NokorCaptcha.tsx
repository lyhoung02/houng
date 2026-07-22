"use client";

import { useEffect, useRef } from "react";

/** Cloudflare Turnstile widget for Supabase's captcha protection. Renders
 *  nothing unless NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so the auth forms
 *  work unchanged until captcha is actually configured. */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export const captchaEnabled = Boolean(SITE_KEY);

type Turnstile = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export default function NokorCaptcha({
  onToken,
  resetSignal,
}: {
  onToken: (token: string | null) => void;
  /** Increment to reset the widget (a token is single-use — reset after a
   *  failed submit so the user gets a fresh one). */
  resetSignal: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !ref.current || widgetId.current !== null || !window.turnstile) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(null),
        "error-callback": () => onTokenRef.current(null),
      });
    };
    if (window.turnstile) {
      render();
    } else {
      const id = "nokor-turnstile-script";
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = id;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }
    return () => {
      cancelled = true;
      if (widgetId.current !== null && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (resetSignal > 0 && widgetId.current !== null && window.turnstile) {
      window.turnstile.reset(widgetId.current);
      onTokenRef.current(null);
    }
  }, [resetSignal]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="flex justify-center" />;
}

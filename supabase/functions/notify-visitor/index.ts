// Emails the visitor when the admin replies.
//
// Wired up as a Database Webhook: Database -> Webhooks -> new hook on
// public.messages, event INSERT, type "Supabase Edge Functions", pointing at
// this function, with an `x-webhook-secret` header matching WEBHOOK_SECRET.
//
// Deploy:  supabase functions deploy notify-visitor
// Secrets: supabase secrets set RESEND_API_KEY=... MAIL_FROM=... SITE_URL=... WEBHOOK_SECRET=...

import { createClient } from "jsr:@supabase/supabase-js@2";

type MessageRow = {
  id: string;
  conversation_id: string;
  sender: "visitor" | "admin";
  body: string;
  emailed_at: string | null;
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const MAIL_FROM = Deno.env.get("MAIL_FROM")!; // e.g. "Pov Lyhoung <chat@yourdomain.com>"
const SITE_URL = Deno.env.get("SITE_URL")!; // e.g. "https://lyhoung.dev"
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEmail(name: string, body: string, link: string) {
  const safeBody = escapeHtml(body).replace(/\n/g, "<br>");
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#0b1020;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#121933;border-radius:16px;padding:28px;color:#e6ebff;">
      <p style="margin:0 0 4px;font-size:13px;color:#8ea0d0;">New reply from Pov Lyhoung</p>
      <p style="margin:0 0 20px;font-size:15px;">Hi ${escapeHtml(name)},</p>
      <div style="background:#1b2547;border-radius:12px;padding:16px;font-size:15px;line-height:1.6;">
        ${safeBody}
      </div>
      <a href="${link}"
         style="display:inline-block;margin-top:24px;background:linear-gradient(135deg,#6366f1,#22d3ee);color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:10px;">
        Continue the conversation →
      </a>
      <p style="margin:20px 0 0;font-size:12px;color:#6d7ba8;">
        Reply live on the site using the button above — this mailbox isn't monitored.
      </p>
    </div>
  </body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  const payload = await req.json();
  const msg = payload.record as MessageRow | undefined;

  // Only admin replies trigger mail, and only once per message.
  if (!msg || msg.sender !== "admin" || msg.emailed_at) {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "content-type": "application/json" },
    });
  }

  const { data: convo, error } = await admin
    .from("conversations")
    .select("visitor_name, visitor_email, access_token")
    .eq("id", msg.conversation_id)
    .single();

  if (error || !convo) {
    return new Response(JSON.stringify({ error: error?.message ?? "no conversation" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const link = `${SITE_URL.replace(/\/$/, "")}/chat/?t=${convo.access_token}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [convo.visitor_email],
      subject: "Pov Lyhoung replied to your message",
      html: renderEmail(convo.visitor_name, msg.body, link),
      text: `${msg.body}\n\nContinue the conversation: ${link}`,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return new Response(JSON.stringify({ error: "resend failed", detail }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  // Stamp it so a webhook retry can't double-send.
  await admin
    .from("messages")
    .update({ emailed_at: new Date().toISOString() })
    .eq("id", msg.id);

  return new Response(JSON.stringify({ sent: true }), {
    headers: { "content-type": "application/json" },
  });
});

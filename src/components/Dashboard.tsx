"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { useAdminSession } from "@/lib/supabase/useChat";
import { invalidatePortfolioContent } from "@/lib/supabase/usePortfolioContent";
import { useDashboardUnlocked } from "@/lib/dashboardGate";
import { useT } from "./providers/LanguageProvider";
import { SectionHeader } from "./About";

// ---------------------------------------------------------------- table map

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "lines"
  | "json"
  | "select"
  | "image";

type FieldDef = {
  name: string;
  type: FieldType;
  options?: readonly string[];
  nullable?: boolean;
};

type TableConfig = {
  table: string;
  label: string;
  /** column shown as the row title in the list */
  titleCol: string;
  /** single fixed row (site_profile) — edit only, no add/delete */
  singleton?: boolean;
  fields: FieldDef[];
};

const TABLES: TableConfig[] = [
  {
    table: "site_profile",
    label: "Profile",
    titleCol: "name",
    singleton: true,
    fields: [
      { name: "name", type: "text" },
      { name: "initials", type: "text" },
      { name: "age", type: "number", nullable: true },
      { name: "title", type: "text" },
      { name: "subtitle", type: "text" },
      { name: "location", type: "text" },
      { name: "email", type: "text" },
      { name: "work_email", type: "text" },
      { name: "phones", type: "lines" },
      { name: "address", type: "text" },
      { name: "pitch", type: "textarea" },
      { name: "long_pitch", type: "textarea" },
      { name: "stats", type: "json" },
    ],
  },
  {
    table: "services",
    label: "Services",
    titleCol: "title_en",
    fields: [
      { name: "sort_order", type: "number" },
      { name: "key", type: "text" },
      { name: "title_en", type: "text" },
      { name: "title_km", type: "text" },
      { name: "desc_en", type: "textarea" },
      { name: "desc_km", type: "textarea" },
    ],
  },
  {
    table: "experiences",
    label: "Experience",
    titleCol: "role",
    fields: [
      { name: "sort_order", type: "number" },
      { name: "role", type: "text" },
      { name: "company", type: "text" },
      { name: "period", type: "text" },
      { name: "location", type: "text" },
      { name: "logo", type: "image" },
      { name: "logo_mode", type: "select", options: ["image", "wordmark"] },
      { name: "bullets", type: "lines" },
    ],
  },
  {
    table: "education_items",
    label: "Education",
    titleCol: "title",
    fields: [
      { name: "sort_order", type: "number" },
      { name: "title", type: "text" },
      { name: "org", type: "text" },
      { name: "period", type: "text" },
      { name: "detail", type: "textarea" },
      { name: "logo", type: "image" },
      { name: "major", type: "text", nullable: true },
      { name: "result", type: "text", nullable: true },
      { name: "courses", type: "lines", nullable: true },
    ],
  },
  {
    table: "projects",
    label: "Projects",
    titleCol: "name",
    fields: [
      { name: "sort_order", type: "number" },
      { name: "slug", type: "text" },
      { name: "name", type: "text" },
      { name: "tagline", type: "text" },
      { name: "description", type: "textarea" },
      { name: "roles", type: "lines" },
      { name: "stack", type: "lines" },
      { name: "logo", type: "image" },
      { name: "accent", type: "text" },
      { name: "highlights", type: "lines" },
    ],
  },
  {
    table: "personal_projects",
    label: "Personal",
    titleCol: "name",
    fields: [
      { name: "sort_order", type: "number" },
      { name: "slug", type: "text" },
      { name: "name", type: "text" },
      { name: "tagline", type: "text" },
      { name: "description", type: "textarea" },
      { name: "stack", type: "lines" },
      { name: "logo", type: "image" },
      { name: "accent", type: "text" },
      { name: "status", type: "select", options: ["Research", "Active", "Shipped"] },
      { name: "highlights", type: "lines" },
    ],
  },
  {
    table: "internal_projects",
    label: "Internal",
    titleCol: "name",
    fields: [
      { name: "sort_order", type: "number" },
      { name: "slug", type: "text" },
      { name: "period", type: "text" },
      { name: "name", type: "text" },
      { name: "tagline", type: "text" },
      { name: "description", type: "textarea" },
      { name: "stack", type: "lines" },
      {
        name: "difficulty",
        type: "select",
        options: ["Challenging", "Hard", "Foundational"],
      },
      { name: "accent", type: "text" },
    ],
  },
  {
    table: "skill_groups",
    label: "Skills",
    titleCol: "title",
    fields: [
      { name: "sort_order", type: "number" },
      { name: "title", type: "text" },
      { name: "items", type: "lines" },
    ],
  },
  {
    table: "archive_items",
    label: "Archive",
    titleCol: "title",
    fields: [
      { name: "sort_order", type: "number" },
      { name: "slug", type: "text" },
      { name: "title", type: "text" },
      { name: "issuer", type: "text" },
      { name: "date", type: "text" },
      {
        name: "kind",
        type: "select",
        options: ["Transcript", "Degree", "Certificate"],
      },
      { name: "logo", type: "image" },
      { name: "image", type: "image", nullable: true },
      { name: "href", type: "text", nullable: true },
    ],
  },
];

type Row = Record<string, unknown> & { id: string | number };

// --------------------------------------------------------- form conversions

function toForm(cfg: TableConfig, row: Row | null): Record<string, string> {
  const form: Record<string, string> = {};
  for (const f of cfg.fields) {
    const v = row?.[f.name];
    if (v === null || v === undefined) {
      form[f.name] = f.type === "select" ? (f.options?.[0] ?? "") : "";
    } else if (f.type === "lines") {
      form[f.name] = (v as string[]).join("\n");
    } else if (f.type === "json") {
      form[f.name] = JSON.stringify(v, null, 2);
    } else {
      form[f.name] = String(v);
    }
  }
  return form;
}

function fromForm(
  cfg: TableConfig,
  form: Record<string, string>,
): { payload: Record<string, unknown>; error: string | null } {
  const payload: Record<string, unknown> = {};
  for (const f of cfg.fields) {
    const raw = form[f.name] ?? "";
    const empty = raw.trim() === "";
    if (empty && f.nullable) {
      payload[f.name] = null;
      continue;
    }
    switch (f.type) {
      case "number": {
        const n = Number(raw);
        if (Number.isNaN(n)) return { payload, error: `${f.name}: not a number` };
        payload[f.name] = n;
        break;
      }
      case "lines":
        payload[f.name] = raw
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case "json":
        try {
          payload[f.name] = JSON.parse(raw || "[]");
        } catch {
          return { payload, error: `${f.name}: invalid JSON` };
        }
        break;
      default:
        payload[f.name] = raw;
    }
  }
  return { payload, error: null };
}

// ------------------------------------------------------------------- pieces

const inputCls =
  "w-full rounded-xl border border-border bg-white/[0.04] px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-400";

function DashboardLogin({
  signIn,
  signedInEmail,
}: {
  signIn: (email: string, password: string) => Promise<string | null>;
  signedInEmail: string | null;
}) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  const error = signInError ?? (signedInEmail ? t.chat.admin.notAdmin : null);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setBusy(true);
    setSignInError(null);
    const err = await signIn(email.trim(), password);
    setBusy(false);
    if (err) setSignInError(err);
    else setPassword("");
  };

  return (
    <div className="glass mx-auto mt-10 max-w-sm rounded-2xl p-6 space-y-3">
      <p className="text-sm font-semibold text-foreground">{t.chat.admin.heading}</p>
      <div>
        <label className="text-[11px] text-foreground/60">{t.chat.admin.email}</label>
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <label className="text-[11px] text-foreground/60">{t.chat.admin.password}</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          className={inputCls}
        />
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-300">{error}</p>}
      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy || !email.trim() || !password}
        className="w-full rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 py-2 text-sm font-medium text-white disabled:opacity-40 hover:scale-[1.01] transition"
      >
        {busy ? t.chat.admin.signingIn : t.chat.admin.signIn}
      </button>
    </div>
  );
}

function RowEditor({
  cfg,
  row,
  onClose,
  onSaved,
}: {
  cfg: TableConfig;
  row: Row | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const [form, setForm] = useState<Record<string, string>>(() => toForm(cfg, row));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Uploads to the public `portfolio` bucket (admin-only writes, see
  // migration 0011) and drops the public URL into the field.
  const uploadImage = async (f: FieldDef, file: File) => {
    const supabase = getSupabase();
    if (!supabase) return;
    setUploading(f.name);
    setError(null);
    const key = `uploads/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const { error: upError } = await supabase.storage
      .from("portfolio")
      .upload(key, file, { contentType: file.type || undefined, upsert: true });
    setUploading(null);
    if (upError) {
      setError(`${f.name}: ${upError.message}`);
      return;
    }
    const url = supabase.storage.from("portfolio").getPublicUrl(key).data.publicUrl;
    setForm((prev) => ({ ...prev, [f.name]: url }));
  };

  const save = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { payload, error: convError } = fromForm(cfg, form);
    if (convError) {
      setError(convError);
      return;
    }
    setBusy(true);
    setError(null);
    // Table names are a closed set from TABLES; the generated Insert/Update
    // types for the portfolio tables are Record<string, unknown>.
    const tbl = supabase.from(cfg.table as "services");
    const { error: dbError } = row
      ? await tbl.update(payload).eq("id", row.id as string)
      : await tbl.insert(payload);
    setBusy(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    invalidatePortfolioContent();
    onSaved();
  };

  return (
    <div
      role="dialog"
      className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="drawer-in absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-background shadow-2xl shadow-slate-950/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <p className="text-sm font-semibold text-foreground">
            {cfg.label} — {row ? t.dashboard.edit : t.dashboard.add}
          </p>
          <button
            type="button"
            aria-label={t.dashboard.cancel}
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground/60 hover:bg-white/10 hover:text-foreground transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M6 18L18 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {cfg.fields.map((f) => (
            <div key={f.name}>
              <label className="text-[11px] text-foreground/60">
                {f.name}
                {f.type === "lines" && " (one per line)"}
                {f.nullable && " (optional)"}
              </label>
              {f.type === "textarea" || f.type === "lines" || f.type === "json" ? (
                <textarea
                  rows={f.type === "textarea" ? 3 : 4}
                  value={form[f.name]}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  className={`${inputCls} font-mono text-xs leading-relaxed`}
                />
              ) : f.type === "select" ? (
                <select
                  value={form[f.name]}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  className={inputCls}
                >
                  {f.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.type === "image" ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={form[f.name]}
                    placeholder="https://… or /assets/…"
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className={inputCls}
                  />
                  <div className="flex items-center gap-3">
                    <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-white/[0.04]">
                      {form[f.name] ? (
                        // Arbitrary user-pasted URLs — next/image adds nothing here.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form[f.name]}
                          alt=""
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm4 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-4 8l5-5 3 3 4-4 4 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="text-foreground/30"
                          />
                        </svg>
                      )}
                    </span>
                    <label className="cursor-pointer rounded-xl border border-border px-3.5 py-2 text-xs font-medium text-foreground/70 transition hover:bg-white/10 hover:text-foreground">
                      {uploading === f.name
                        ? t.dashboard.uploading
                        : t.dashboard.upload}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading !== null}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadImage(f, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <input
                  type={f.type === "number" ? "number" : "text"}
                  value={form[f.name]}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  className={inputCls}
                />
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-border px-5 py-4">
          {error && (
            <p className="mb-3 text-xs text-rose-600 dark:text-rose-300">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2 text-sm text-foreground/70 hover:text-foreground transition"
            >
              {t.dashboard.cancel}
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy}
              className="flex-1 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 py-2 text-sm font-medium text-white disabled:opacity-40 hover:scale-[1.01] transition"
            >
              {busy ? t.dashboard.saving : t.dashboard.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableManager({ cfg }: { cfg: TableConfig }) {
  const t = useT();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // undefined = closed, null = new row, Row = editing that row
  const [editing, setEditing] = useState<Row | null | undefined>(undefined);

  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const query = supabase.from(cfg.table as "services").select("*");
      const { data, error: dbError } = cfg.singleton
        ? await query
        : await query.order("sort_order" as "key");
      if (cancelled) return;
      setLoading(false);
      if (dbError) {
        setError(dbError.message);
        return;
      }
      setError(null);
      setRows((data ?? []) as unknown as Row[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [cfg, reloadKey]);

  const remove = async (row: Row) => {
    if (!window.confirm(t.dashboard.confirmDelete)) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const { error: dbError } = await supabase
      .from(cfg.table as "services")
      .delete()
      .eq("id", row.id as string);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    invalidatePortfolioContent();
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{cfg.label}</p>
        {!cfg.singleton && (
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-slate-950 hover:bg-white/90 transition"
          >
            + {t.dashboard.add}
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-white/50">…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-white/50">{t.dashboard.empty}</p>
        ) : (
          rows.map((row) => (
            <div
              key={String(row.id)}
              onClick={() => setEditing(row)}
              className="glass card-hover group flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 hover:bg-white/[0.05]"
            >
              {"sort_order" in row && (
                <span className="w-6 shrink-0 text-center text-xs text-white/40 transition group-hover:text-white/70">
                  {String(row.sort_order)}
                </span>
              )}
              <p className="flex-1 truncate text-sm text-white/85 transition group-hover:text-white">
                {String(row[cfg.titleCol] ?? "—")}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(row);
                }}
                className="rounded-lg border border-white/12 px-3 py-1 text-xs text-white/70 opacity-70 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
              >
                {t.dashboard.edit}
              </button>
              {!cfg.singleton && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void remove(row);
                  }}
                  className="rounded-lg border border-rose-400/30 px-3 py-1 text-xs text-rose-300 opacity-70 transition hover:bg-rose-500/15 group-hover:opacity-100"
                >
                  {t.dashboard.delete}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {editing !== undefined && (
        <RowEditor
          cfg={cfg}
          row={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            load();
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------------- page

export default function Dashboard() {
  const t = useT();
  const router = useRouter();
  const unlocked = useDashboardUnlocked();
  const admin = useAdminSession(true);
  const [tab, setTab] = useState(0);

  // The nav entry is hidden until the PIN unlock; deep-linking /dashboard
  // without it just bounces home. RLS is the real protection either way.
  useEffect(() => {
    if (admin.ready && !unlocked && !admin.isAdmin) router.replace("/");
  }, [admin.ready, admin.isAdmin, unlocked, router]);

  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          eyebrow={t.dashboard.eyebrow}
          title={t.dashboard.title}
          description={t.dashboard.description}
        />

        {!admin.ready ? (
          <p className="mt-10 text-sm text-white/50">…</p>
        ) : !admin.isAdmin ? (
          <DashboardLogin signIn={admin.signIn} signedInEmail={admin.email} />
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] items-start">
            {/* Side menu — horizontal scroller on mobile, sticky column on md+ */}
            <aside className="glass rounded-2xl p-2.5 md:sticky md:top-24">
              <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
                {TABLES.map((cfg, i) => (
                  <button
                    key={cfg.table}
                    type="button"
                    onClick={() => setTab(i)}
                    className={`group relative shrink-0 rounded-xl px-4 py-2 text-left text-sm transition md:w-full ${
                      tab === i
                        ? "bg-gradient-to-r from-indigo-500/25 via-violet-500/15 to-transparent font-semibold text-white ring-1 ring-inset ring-white/10"
                        : "font-medium text-white/60 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <span
                      className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-indigo-400 to-cyan-400 transition-opacity ${
                        tab === i ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                      }`}
                    />
                    {cfg.label}
                  </button>
                ))}
              </nav>
              <div className="mt-2 hidden border-t border-white/10 pt-2 md:block">
                <button
                  type="button"
                  onClick={() => void admin.signOut()}
                  className="w-full rounded-xl px-3.5 py-2 text-left text-xs text-white/50 hover:bg-white/10 hover:text-white transition"
                >
                  {t.dashboard.signOut}
                  <span className="mt-0.5 block truncate text-[10px] text-white/35">
                    {admin.email}
                  </span>
                </button>
              </div>
            </aside>

            {/* Content body */}
            <div className="min-w-0">
              <div className="mb-2 flex justify-end md:hidden">
                <button
                  type="button"
                  onClick={() => void admin.signOut()}
                  className="text-xs text-white/50 hover:text-white transition"
                >
                  {t.dashboard.signOut} · {admin.email}
                </button>
              </div>
              <TableManager key={TABLES[tab].table} cfg={TABLES[tab]} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

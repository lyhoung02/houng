"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "./client";
import {
  archive as staticArchive,
  education as staticEducation,
  experience as staticExperience,
  internalProjects as staticInternal,
  personalProjects as staticPersonal,
  profile as staticProfile,
  projects as staticProjects,
  skillGroups as staticSkillGroups,
  type ArchiveItem,
  type EducationItem,
  type ExperienceItem,
  type InternalProject,
  type PersonalProject,
  type Project,
} from "@/lib/portfolio-data";

export type ServiceRow = {
  key: string;
  title_en: string;
  title_km: string;
  desc_en: string;
  desc_km: string;
};

type Content = {
  /** null until (or unless) the DB rows arrive — callers fall back to i18n. */
  services: ServiceRow[] | null;
  profile: typeof staticProfile;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: Project[];
  personalProjects: PersonalProject[];
  internalProjects: InternalProject[];
  skillGroups: typeof staticSkillGroups;
  archive: ArchiveItem[];
};

const STATIC: Content = {
  services: null,
  profile: staticProfile,
  experience: staticExperience,
  education: staticEducation,
  projects: staticProjects,
  personalProjects: staticPersonal,
  internalProjects: staticInternal,
  skillGroups: staticSkillGroups,
  archive: staticArchive,
};

/** Non-empty DB rows win; otherwise the static bundle stands. */
function orStatic<T>(rows: T[] | null | undefined, fallback: T[]): T[] {
  return rows && rows.length > 0 ? rows : fallback;
}

// Every section component calls the hook, so the fetch is shared at module
// level: one round of queries per page load, cached for later mounts.
let cached: Content | null = null;
let inflight: Promise<Content> | null = null;

async function fetchContent(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
): Promise<Content> {
  const [svc, prof, exp, edu, proj, pers, internal, skills, arch] =
    await Promise.all([
      supabase.from("services").select("*").order("sort_order"),
      supabase.from("site_profile").select("*").eq("id", 1).maybeSingle(),
      supabase.from("experiences").select("*").order("sort_order"),
      supabase.from("education_items").select("*").order("sort_order"),
      supabase.from("projects").select("*").order("sort_order"),
      supabase.from("personal_projects").select("*").order("sort_order"),
      supabase.from("internal_projects").select("*").order("sort_order"),
      supabase.from("skill_groups").select("*").order("sort_order"),
      supabase.from("archive_items").select("*").order("sort_order"),
    ]);

  const p = prof.data;
  return {
        services: svc.data && svc.data.length > 0 ? svc.data : null,
        profile: p
          ? {
              name: p.name,
              initials: p.initials,
              age: p.age ?? staticProfile.age,
              title: p.title,
              subtitle: p.subtitle,
              location: p.location,
              email: p.email,
              workEmail: p.work_email,
              phones: p.phones,
              address: p.address,
              pitch: p.pitch,
              longPitch: p.long_pitch,
              stats: p.stats,
            }
          : staticProfile,
        experience: orStatic(
          exp.data?.map((r) => ({
            role: r.role,
            company: r.company,
            period: r.period,
            location: r.location,
            logo: r.logo,
            logoMode: r.logo_mode,
            bullets: r.bullets,
          })),
          staticExperience,
        ),
        education: orStatic(
          edu.data?.map((r) => ({
            title: r.title,
            org: r.org,
            period: r.period,
            detail: r.detail,
            logo: r.logo,
            major: r.major ?? undefined,
            result: r.result ?? undefined,
            courses: r.courses ?? undefined,
          })),
          staticEducation,
        ),
        projects: orStatic(
          proj.data?.map((r) => ({
            slug: r.slug,
            name: r.name,
            tagline: r.tagline,
            description: r.description,
            roles: r.roles,
            stack: r.stack,
            logo: r.logo,
            accent: r.accent,
            highlights: r.highlights,
          })),
          staticProjects,
        ),
        personalProjects: orStatic(
          pers.data?.map((r) => ({
            slug: r.slug,
            name: r.name,
            tagline: r.tagline,
            description: r.description,
            stack: r.stack,
            logo: r.logo,
            accent: r.accent,
            status: r.status,
            highlights: r.highlights,
          })),
          staticPersonal,
        ),
        internalProjects: orStatic(
          internal.data?.map((r) => ({
            slug: r.slug,
            period: r.period,
            name: r.name,
            tagline: r.tagline,
            description: r.description,
            stack: r.stack,
            difficulty: r.difficulty,
            accent: r.accent,
          })),
          staticInternal,
        ),
        skillGroups: orStatic(
          skills.data?.map((r) => ({ title: r.title, items: r.items })),
          staticSkillGroups,
        ),
        archive: orStatic(
          arch.data?.map((r) => ({
            slug: r.slug,
            title: r.title,
            issuer: r.issuer,
            date: r.date,
            kind: r.kind,
            logo: r.logo,
            image: r.image ?? undefined,
            href: r.href ?? undefined,
          })),
          staticArchive,
        ),
  };
}

/**
 * All portfolio content, served from Supabase so it can be edited in the
 * dashboard's Table Editor without a redeploy. The static arrays render
 * instantly and remain the fallback when Supabase is unreachable, a table is
 * empty, or the env isn't configured — the site never blanks or flickers.
 */
export function usePortfolioContent(): Content {
  const [content, setContent] = useState<Content>(cached ?? STATIC);

  useEffect(() => {
    if (cached) return;
    const supabase = getSupabase();
    if (!supabase) return;
    let cancelled = false;

    inflight ??= fetchContent(supabase).then((c) => {
      cached = c;
      return c;
    });
    inflight
      .then((c) => {
        if (!cancelled) setContent(c);
      })
      .catch(() => {
        inflight = null;
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return content;
}

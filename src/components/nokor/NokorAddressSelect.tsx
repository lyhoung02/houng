"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useLanguage } from "../providers/LanguageProvider";

export type AddressValue = {
  province_code: string | null;
  district_code: string | null;
  commune_code: string | null;
  village_code: string | null;
};

type Row = { code: string; name_km: string; name_en: string };

const field =
  "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-indigo-400/60 disabled:opacity-40";

function LevelSelect({
  label,
  placeholder,
  options,
  selected,
  lang,
  disabled,
  onPick,
}: {
  label: string;
  placeholder: string;
  options: Row[];
  selected: string | null;
  lang: "en" | "km";
  disabled?: boolean;
  onPick: (code: string | null) => void;
}) {
  return (
    <label className="block text-xs opacity-60">
      {label}
      <select
        value={selected ?? ""}
        disabled={disabled}
        onChange={(e) => onPick(e.target.value || null)}
        className={`${field} mt-1`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {lang === "km" ? o.name_km : o.name_en}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Cascading Cambodia address picker (province > district > commune > village).
 * Each level loads on demand from the kh_* gazetteer tables. Reports both the
 * selected codes and a human-readable display string (current UI language,
 * most-specific first) so callers can store it on current_city / hometown.
 */
export default function NokorAddressSelect({
  title,
  labels,
  value,
  onChange,
}: {
  title: string;
  labels: { province: string; district: string; commune: string; village: string; select: string };
  value: AddressValue;
  onChange: (next: AddressValue, display: string) => void;
}) {
  const { lang } = useLanguage();
  const [provinces, setProvinces] = useState<Row[]>([]);
  const [districts, setDistricts] = useState<Row[]>([]);
  const [communes, setCommunes] = useState<Row[]>([]);
  const [villages, setVillages] = useState<Row[]>([]);

  const nameOf = (r: Row | undefined) => (r ? (lang === "km" ? r.name_km : r.name_en) : "");

  useEffect(() => {
    const run = async (): Promise<Row[]> => {
      const sb = getSupabase();
      if (!sb) return [];
      const { data } = await sb.from("kh_provinces").select("code,name_km,name_en").order("name_en");
      return data ?? [];
    };
    run().then(setProvinces);
  }, []);
  useEffect(() => {
    const run = async (): Promise<Row[]> => {
      const sb = getSupabase();
      if (!sb || !value.province_code) return [];
      const { data } = await sb
        .from("kh_districts")
        .select("code,name_km,name_en")
        .eq("province_code", value.province_code)
        .order("name_en");
      return data ?? [];
    };
    run().then(setDistricts);
  }, [value.province_code]);
  useEffect(() => {
    const run = async (): Promise<Row[]> => {
      const sb = getSupabase();
      if (!sb || !value.district_code) return [];
      const { data } = await sb
        .from("kh_communes")
        .select("code,name_km,name_en")
        .eq("district_code", value.district_code)
        .order("name_en");
      return data ?? [];
    };
    run().then(setCommunes);
  }, [value.district_code]);
  useEffect(() => {
    const run = async (): Promise<Row[]> => {
      const sb = getSupabase();
      if (!sb || !value.commune_code) return [];
      const { data } = await sb
        .from("kh_villages")
        .select("code,name_km,name_en")
        .eq("commune_code", value.commune_code)
        .order("name_en");
      return data ?? [];
    };
    run().then(setVillages);
  }, [value.commune_code]);

  const emit = (next: AddressValue) => {
    const display = [
      villages.find((r) => r.code === next.village_code),
      communes.find((r) => r.code === next.commune_code),
      districts.find((r) => r.code === next.district_code),
      provinces.find((r) => r.code === next.province_code),
    ]
      .map(nameOf)
      .filter(Boolean)
      .join(", ");
    onChange(next, display);
  };

  return (
    <div className="rounded-xl border border-border p-3">
      <p className="mb-2 text-xs font-medium opacity-70">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        <LevelSelect
          label={labels.province}
          placeholder={labels.select}
          options={provinces}
          selected={value.province_code}
          lang={lang}
          onPick={(code) =>
            emit({ province_code: code, district_code: null, commune_code: null, village_code: null })
          }
        />
        <LevelSelect
          label={labels.district}
          placeholder={labels.select}
          options={districts}
          selected={value.district_code}
          lang={lang}
          disabled={!value.province_code}
          onPick={(code) => emit({ ...value, district_code: code, commune_code: null, village_code: null })}
        />
        <LevelSelect
          label={labels.commune}
          placeholder={labels.select}
          options={communes}
          selected={value.commune_code}
          lang={lang}
          disabled={!value.district_code}
          onPick={(code) => emit({ ...value, commune_code: code, village_code: null })}
        />
        <LevelSelect
          label={labels.village}
          placeholder={labels.select}
          options={villages}
          selected={value.village_code}
          lang={lang}
          disabled={!value.commune_code}
          onPick={(code) => emit({ ...value, village_code: code })}
        />
      </div>
    </div>
  );
}

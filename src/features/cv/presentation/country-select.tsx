"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  CONTINENTS,
  COUNTRY_CODES,
  type CountryCode,
  continentOf,
} from "../countries";

/** Nom d'un pays dans la langue de l'interface (fourni par le navigateur). */
export function useCountryName() {
  const locale = useLocale();
  return useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return (code: CountryCode) => names.of(code) ?? code;
  }, [locale]);
}

/** Pays visé (Inc-15) : liste groupée par continent, triée dans la langue de l'interface. */
export function CountrySelect({
  id,
  value,
  onChange,
  describedBy,
  className,
}: {
  id: string;
  value: CountryCode;
  onChange: (country: CountryCode) => void;
  describedBy?: string;
  className?: string;
}) {
  const t = useTranslations("cvTemplates.continents");
  const locale = useLocale();
  const nameOf = useCountryName();
  const groups = useMemo(
    () =>
      CONTINENTS.map((continent) => ({
        continent,
        countries: COUNTRY_CODES.filter(
          (code) => continentOf(code) === continent,
        ).sort((a, b) => nameOf(a).localeCompare(nameOf(b), locale)),
      })),
    [nameOf, locale],
  );

  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value as CountryCode)}
      aria-describedby={describedBy}
      className={cn(
        "h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-xs",
        className,
      )}
    >
      {groups.map((group) => (
        <optgroup key={group.continent} label={t(group.continent)}>
          {group.countries.map((code) => (
            <option key={code} value={code}>
              {nameOf(code)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

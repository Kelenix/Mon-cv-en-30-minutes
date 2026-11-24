"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDay, formatDollars, formatEuros, formatNumber } from "../format";

// Évolution jour par jour (aires), avec info-bulle au survol et tableau pour les lecteurs
// d'écran. Couleurs dans l'ordre fixe de la palette validée (bleu, orange, vert d'eau).
const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"] as const;

const FORMATS = {
  number: formatNumber,
  euros: formatEuros,
  dollars: formatDollars,
} as const;

export type ChartFormat = keyof typeof FORMATS;
type Row = { day: string } & Record<string, number | string>;

type TooltipProps = {
  active?: boolean;
  label?: unknown;
  payload?: ReadonlyArray<{
    dataKey?: unknown;
    value?: unknown;
    color?: string;
  }>;
  labels: Map<string, string>;
  formatValue: (value: number) => string;
};

function ChartTooltip({
  active,
  label,
  payload,
  labels,
  formatValue,
}: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{formatDay(String(label))}</p>
      {payload.map((entry) => (
        <p
          key={String(entry.dataKey)}
          className="mt-1 flex items-center gap-2 text-muted-foreground"
        >
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {labels.get(String(entry.dataKey))} :
          <span className="font-medium text-foreground tabular-nums">
            {formatValue(Number(entry.value))}
          </span>
        </p>
      ))}
    </div>
  );
}

export function TimeChart({
  data,
  series,
  format = "number",
  height = 240,
}: {
  data: Row[];
  series: { key: string; label: string }[];
  format?: ChartFormat;
  height?: number;
}) {
  const formatValue = FORMATS[format];
  const labels = new Map(series.map((item) => [item.key, item.label]));
  const gradient = useId().replace(/:/g, "");

  return (
    <figure>
      {series.length > 1 ? (
        <ul className="mb-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {series.map((item, index) => (
            <li key={item.key} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-0.5 w-4 rounded-full"
                style={{ backgroundColor: SERIES_COLORS[index] }}
              />
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}
      <div aria-hidden="true" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {/* Graphique réservé à la vue : les lecteurs d'écran ont le tableau ci-dessous. */}
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            accessibilityLayer={false}
            tabIndex={-1}
          >
            <defs>
              {series.map((item, index) => (
                <linearGradient
                  key={item.key}
                  id={`${gradient}-${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={SERIES_COLORS[index]}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="100%"
                    stopColor={SERIES_COLORS[index]}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="day"
              tickFormatter={formatDay}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(value: number) => formatValue(value)}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={format === "number" ? 40 : 72}
              allowDecimals={false}
            />
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  {...props}
                  labels={labels}
                  formatValue={formatValue}
                />
              )}
              cursor={{
                stroke: "var(--muted-foreground)",
                strokeDasharray: "4 4",
              }}
            />
            {series.map((item, index) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                stroke={SERIES_COLORS[index]}
                strokeWidth={2}
                fill={`url(#${gradient}-${index})`}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>
          {series.map((item) => item.label).join(", ")} par jour
        </caption>
        <thead>
          <tr>
            <th scope="col">Jour</th>
            {series.map((item) => (
              <th key={item.key} scope="col">
                {item.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.day}>
              <th scope="row">{formatDay(row.day)}</th>
              {series.map((item) => (
                <td key={item.key}>{formatValue(Number(row[item.key]))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

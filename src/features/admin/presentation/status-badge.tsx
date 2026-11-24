import {
  CircleCheckIcon,
  CircleMinusIcon,
  CircleXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckState } from "../system";

// États du système : toujours une icône et un libellé, jamais la couleur seule.
const STATES: Record<
  CheckState,
  { label: string; Icon: typeof CircleCheckIcon; className: string }
> = {
  ok: {
    label: "Opérationnel",
    Icon: CircleCheckIcon,
    className: "bg-[#0ca30c]/10 text-[#0a6e0a]",
  },
  warning: {
    label: "À surveiller",
    Icon: TriangleAlertIcon,
    className: "bg-[#fab219]/20 text-[#7a4f00]",
  },
  error: {
    label: "En panne",
    Icon: CircleXIcon,
    className: "bg-[#d03b3b]/10 text-[#a32626]",
  },
  off: {
    label: "Désactivé",
    Icon: CircleMinusIcon,
    className: "bg-muted text-muted-foreground",
  },
};

export function StatusBadge({
  state,
  label,
}: {
  state: CheckState;
  label?: string;
}) {
  const { label: defaultLabel, Icon, className } = STATES[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium whitespace-nowrap",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {label ?? defaultLabel}
    </span>
  );
}

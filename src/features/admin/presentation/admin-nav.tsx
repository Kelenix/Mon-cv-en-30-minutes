"use client";

import {
  ActivityIcon,
  ArrowLeftIcon,
  BadgeEuroIcon,
  GlobeIcon,
  LayoutDashboardIcon,
  ScrollTextIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Vue d'ensemble", Icon: LayoutDashboardIcon },
  { href: "/admin/utilisateurs", label: "Utilisateurs", Icon: UsersIcon },
  {
    href: "/admin/revenus",
    label: "Revenus et paiements",
    Icon: BadgeEuroIcon,
  },
  { href: "/admin/ia", label: "Intelligence artificielle", Icon: SparklesIcon },
  { href: "/admin/provenance", label: "Provenance", Icon: GlobeIcon },
  { href: "/admin/systeme", label: "État du système", Icon: ActivityIcon },
  { href: "/admin/journal", label: "Journal", Icon: ScrollTextIcon },
] as const;

/** Navigation de l'administration, page en cours mise en évidence. */
export function AdminNav() {
  return <AdminNavLinks pathname={usePathname()} />;
}

/**
 * Liens de l'administration : colonne sur ordinateur, bande défilante sur mobile. Sans
 * `pathname` (chargement), aucun lien n'est mis en évidence.
 */
export function AdminNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Administration" className="min-w-0">
      <ul className="flex gap-1 overflow-x-auto px-4 pb-3 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0">
        {ITEMS.map(({ href, label, Icon }) => {
          const active =
            pathname !== null &&
            (href === "/admin" ? pathname === href : pathname.startsWith(href));
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary/10 text-primary-strong"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-4 lg:border-t lg:border-border lg:pt-4">
          <Link
            href="/fr"
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-5 shrink-0" />
            Retour au site
          </Link>
        </li>
      </ul>
    </nav>
  );
}

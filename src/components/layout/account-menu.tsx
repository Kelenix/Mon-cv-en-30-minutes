"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import {
  FileTextIcon,
  MenuIcon,
  PlusIcon,
  TagIcon,
  UserRoundIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";

const ITEMS = [
  { href: "/cv", label: "myCvs", Icon: FileTextIcon },
  { href: "/compte", label: "account", Icon: UserRoundIcon },
  { href: "/creer", label: "createCv", Icon: PlusIcon },
  { href: "/tarifs", label: "pricing", Icon: TagIcon },
] as const;

type Labels = Record<(typeof ITEMS)[number]["label"] | "menu", string>;

/**
 * Menu de l'en-tête sur mobile pour un compte connecté (docs/design/flows.md §2) : seuls le logo,
 * la langue, le solde et ce bouton tiennent sur un écran de 360 px.
 */
export function AccountMenu({ labels }: { labels: Labels }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={labels.menu}
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <MenuIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-52">
        {ITEMS.map(({ href, label, Icon }) => (
          <MenuPrimitive.LinkItem
            key={href}
            closeOnClick
            render={<Link href={href} />}
            className="flex min-h-11 items-center gap-3 rounded-md px-3 text-base outline-hidden select-none focus:bg-accent"
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            {labels[label]}
          </MenuPrimitive.LinkItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

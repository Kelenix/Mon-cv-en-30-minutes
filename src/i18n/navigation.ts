import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Liens et navigation qui conservent la langue et traduisent les chemins.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

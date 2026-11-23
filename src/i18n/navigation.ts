import { createNavigation } from "next-intl/navigation";
import { type ComponentProps, createElement } from "react";
import { routing } from "./routing";

// Liens et navigation qui conservent la langue et traduisent les chemins.
const navigation = createNavigation(routing);
export const { redirect, usePathname, useRouter, getPathname } = navigation;

/** Type de transition des navigations : seul lui déclenche le fondu entre les pages. */
export const NAV_TRANSITION = "nav";

/**
 * Lien interne : la navigation est marquée `nav`, ce qui déclenche le fondu entre les pages
 * (docs/design/design-system.md §5) sans animer les actions faites dans une page.
 */
export function Link(props: ComponentProps<typeof navigation.Link>) {
  return createElement(navigation.Link, {
    transitionTypes: [NAV_TRANSITION],
    ...props,
  });
}

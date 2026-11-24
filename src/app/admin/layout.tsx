import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ShieldCheckIcon } from "lucide-react";
import { type ReactNode, Suspense } from "react";
import {
  AdminNav,
  AdminNavLinks,
} from "@/features/admin/presentation/admin-nav";
import "../globals.css";

// Espace d'administration (ADR-040) : en français, hors du routage par langue, réservé aux
// adresses de `ADMIN_EMAILS` (proxy, puis chaque page et chaque action).

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Administration" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={poppins.variable}>
      <body className="min-h-dvh bg-muted antialiased">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Aller au contenu
        </a>
        <div className="lg:grid lg:min-h-dvh lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="border-b border-border bg-background lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
            <p className="flex items-center gap-2 px-6 py-5 text-lg font-bold">
              <ShieldCheckIcon
                aria-hidden="true"
                className="size-6 text-primary"
              />
              Administration
            </p>
            <Suspense fallback={<AdminNavLinks pathname={null} />}>
              <AdminNav />
            </Suspense>
          </aside>
          <main id="contenu" className="min-w-0 px-4 py-8 md:px-8 lg:px-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

import { LogOutIcon } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SubmitButton } from "@/components/form/submit-button";
import { Appear } from "@/components/layout/appear";
import { requireAdmin } from "@/features/admin/access";
import { getUserDetail } from "@/features/admin/data";
import { formatDateTime } from "@/features/admin/format";
import { AdminProfileForm } from "@/features/admin/presentation/profile-form";
import { DashboardSkeleton } from "@/features/admin/presentation/skeleton";
import { PageHeader, Panel } from "@/features/admin/presentation/ui";
import { signOut } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Profil" };

export default function AdminProfilePage() {
  return (
    <>
      <PageHeader
        title="Profil"
        description="Votre identité d'administrateur et votre session."
      />
      <Suspense fallback={<DashboardSkeleton tiles={0} />}>
        <Appear>
          <Profile />
        </Appear>
      </Suspense>
    </>
  );
}

async function Profile() {
  const admin = await requireAdmin();
  const detail = await getUserDetail(admin.id);

  return (
    <div className="mt-6 grid gap-6">
      <Panel title="Informations">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <AdminProfileForm
            firstName={detail?.firstName ?? ""}
            lastName={detail?.lastName ?? ""}
            phone={detail?.phone ?? ""}
            city={detail?.city ?? ""}
          />
          <dl className="grid content-start gap-4 lg:border-l lg:border-border lg:pl-8">
            <div>
              <dt className="text-sm text-muted-foreground">
                E-mail de connexion
              </dt>
              <dd className="font-medium break-all">{admin.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Rôle</dt>
              <dd className="font-medium">
                Administrateur (adresse déclarée dans la configuration du
                serveur)
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Dernière connexion
              </dt>
              <dd className="font-medium">
                {formatDateTime(detail?.lastSignInAt)}
              </dd>
            </div>
          </dl>
        </div>
      </Panel>
      <Panel title="Session">
        <form
          action={signOut}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <input type="hidden" name="locale" value="fr" />
          <p className="text-muted-foreground">
            Fermez votre session sur cet appareil, surtout sur un ordinateur
            partagé.
          </p>
          <SubmitButton variant="outline">
            <LogOutIcon aria-hidden="true" />
            Se déconnecter
          </SubmitButton>
        </form>
      </Panel>
    </div>
  );
}

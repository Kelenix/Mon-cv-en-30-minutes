import "server-only";
import { PLANS, type PlanTier } from "@/features/plans/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

// Lectures de l'administration (ADR-040) : fonctions SQL réservées au serveur, appelées après
// `requireAdmin()` par chaque page.

export const PERIODS = [7, 30, 90, 365] as const;
export type Period = (typeof PERIODS)[number];

/** Période choisie (`?jours=`), 30 jours par défaut. */
export function parsePeriod(value: unknown): Period {
  const days = Number(value);
  return (PERIODS as readonly number[]).includes(days) ? (days as Period) : 30;
}

export type Share = {
  key: string;
  count: number;
  amount?: number;
  channel?: string;
};

export type AiKindStats = {
  key: string;
  count: number;
  failed: number;
  free: number;
  avgMs: number | null;
  costMicros: number;
  inputTokens: number;
  outputTokens: number;
};

export type Summary = {
  users: {
    total: number;
    new: number;
    active7: number;
    active30: number;
    banned: number;
    adsRemoved: number;
  };
  subscriptions: {
    byPlan: {
      plan: PlanTier;
      interval: "month" | "year";
      status: string;
      count: number;
    }[];
    canceled: number;
  };
  revenue: {
    period: number;
    month: number;
    total: number;
    payments: number;
    byItem: Share[];
    byMethod: Share[];
  };
  credits: {
    included: number;
    purchased: number;
    byReason: { key: string; credits: number; count: number }[];
  };
  content: { cvs: number; cvsPeriod: number; generationsByKind: Share[] };
  ai: { byKind: AiKindStats[]; errors: Share[] };
  audience: {
    signupCountries: Share[];
    signupLocales: Share[];
    signupMethods: { google: number; email: number };
    visitChannels: Share[];
    visitSources: Share[];
    visitCountries: Share[];
  };
};

export type DailyPoint =
  Database["public"]["Functions"]["admin_daily"]["Returns"][number];

function unwrap<T>({
  data,
  error,
}: {
  data: unknown;
  error: { message: string } | null;
}) {
  if (error) throw new Error(`Administration : ${error.message}`);
  return data as T;
}

export async function getSummary(days: Period) {
  return unwrap<Summary>(
    await createAdminClient().rpc("admin_summary", { p_days: days }),
  );
}

export async function getDaily(days: Period) {
  return unwrap<DailyPoint[]>(
    await createAdminClient().rpc("admin_daily", { p_days: days }),
  );
}

export type AcquisitionRow =
  Database["public"]["Functions"]["admin_acquisition"]["Returns"][number];

/** Visites, comptes, CV, essais et achats par source (ADR-052). */
export async function getAcquisition(days: Period) {
  return unwrap<AcquisitionRow[]>(
    await createAdminClient().rpc("admin_acquisition", { p_days: days }),
  );
}

/** Revenu mensuel récurrent des abonnements payants (annuels ramenés au mois), en centimes. */
export function monthlyRecurringRevenue(summary: Summary) {
  return summary.subscriptions.byPlan
    .filter((row) => row.status === "active" || row.status === "past_due")
    .reduce((total, row) => {
      const plan = PLANS[row.plan];
      const monthly =
        row.interval === "year"
          ? plan.yearlyPriceCents / 12
          : plan.monthlyPriceCents;
      return total + monthly * row.count;
    }, 0);
}

/** Abonnés par état : essai, payants, paiement en retard. */
export function subscriberCounts(summary: Summary) {
  const count = (status: string) =>
    summary.subscriptions.byPlan
      .filter((row) => row.status === status)
      .reduce((total, row) => total + row.count, 0);
  return {
    trialing: count("trialing"),
    active: count("active"),
    pastDue: count("past_due"),
  };
}

export const USERS_PAGE_SIZE = 25;

export type UserRow =
  Database["public"]["Functions"]["admin_users"]["Returns"][number];

export async function getUsers({
  search,
  plan,
  page,
}: {
  search: string;
  plan: string;
  page: number;
}) {
  const rows = unwrap<UserRow[]>(
    await createAdminClient().rpc("admin_users", {
      p_search: search,
      p_plan: plan,
      p_limit: USERS_PAGE_SIZE,
      p_offset: (page - 1) * USERS_PAGE_SIZE,
    }),
  );
  return { rows, total: rows[0]?.total ?? 0 };
}

export type UserDetail = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  city: string | null;
  locale: string;
  country: string | null;
  createdAt: string;
  lastSeenAt: string;
  lastSignInAt: string | null;
  bannedUntil: string | null;
  providers: string[];
  freeGenerationUsedAt: string | null;
  trialUsedAt: string | null;
  adsRemovedAt: string | null;
  retentionWarningSentAt: string | null;
  stripeCustomer: boolean;
  wallet: { included: number; purchased: number } | null;
  subscription: {
    plan: PlanTier;
    interval: "month" | "year";
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    trialEndsAt: string | null;
    paymentMethod: string | null;
    since: string;
  } | null;
  payments: {
    at: string;
    item: string;
    amount: number;
    method: string | null;
  }[];
  ledger: { at: string; bucket: string; delta: number; reason: string }[];
  cvs: { title: string; language: string; createdAt: string; pro: boolean }[];
  aiOperations: {
    at: string;
    kind: string;
    status: string;
    credits: number;
    free: boolean;
    costMicros: number | null;
    error: string | null;
  }[];
};

export async function getUserDetail(id: string) {
  return unwrap<UserDetail | null>(
    await createAdminClient().rpc("admin_user_detail", { p_user_id: id }),
  );
}

export type SystemData = {
  databaseBytes: number;
  postgresVersion: string;
  tables: { name: string; rows: number; bytes: number }[];
  migration: string | null;
  cronJobs: {
    name: string;
    schedule: string;
    active: boolean;
    lastStatus: string | null;
    lastStart: string | null;
    lastEnd: string | null;
    lastMessage: string | null;
  }[];
  jobRuns: {
    job: string;
    ok: boolean;
    details: Record<string, unknown>;
    at: string;
  }[];
  lastStripeEvent: string | null;
  aiFailed24h: number;
  aiPending: number;
  aiLast24h: number;
};

export async function getSystemData() {
  return unwrap<SystemData>(await createAdminClient().rpc("admin_system"));
}

export type AuditEntry = {
  id: number;
  admin_email: string;
  action: string;
  target_user_id: string | null;
  target_email: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export async function getAuditLog(limit = 200) {
  return unwrap<AuditEntry[]>(
    await createAdminClient()
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}

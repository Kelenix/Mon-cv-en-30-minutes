"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  type ActionResult,
  fail,
  ok,
  validationError,
} from "@/core/action-result";
import { eraseAccount } from "@/features/profile/erase-account";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentAdmin } from "./access";

// Actions de l'administration sur un compte (ADR-040) : chaque action revérifie
// l'administrateur, valide ses entrées et laisse une trace dans le journal d'administration.

const userIdSchema = z.uuid();

const grantSchema = z.object({
  userId: userIdSchema,
  amount: z.coerce.number().int().min(1).max(500),
  note: z.string().trim().max(200).optional(),
});

const banSchema = z.object({
  userId: userIdSchema,
  banned: z.enum(["true", "false"]),
});

const deleteSchema = z.object({
  userId: userIdSchema,
  confirmation: z.string().trim().toLowerCase(),
});

async function audit(
  adminEmail: string,
  action: "grant_credits" | "ban" | "unban" | "delete",
  target: { id: string; email: string | null },
  details: Record<string, unknown> = {},
) {
  const { error } = await createAdminClient()
    .from("admin_audit_log")
    .insert({
      admin_email: adminEmail,
      action,
      target_user_id: target.id,
      target_email: target.email,
      details: details as never,
    });
  if (error)
    console.error("Action d'administration non journalisée", error.code);
}

async function emailOf(userId: string) {
  const { data } = await createAdminClient().auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

/** Offre des crédits (achetés : ils n'expirent pas), par exemple en dédommagement. */
export async function grantCredits(
  formData: FormData,
): Promise<ActionResult<number>> {
  const admin = await currentAdmin();
  if (!admin) return fail("FORBIDDEN");
  const parsed = grantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const { userId, amount, note } = parsed.data;

  const { error } = await createAdminClient().rpc("grant_credits", {
    p_user_id: userId,
    p_bucket: "purchased",
    p_amount: amount,
    p_reason: "admin_grant",
  });
  if (error) {
    return fail(
      error.message === "WALLET_NOT_FOUND" ? "NOT_FOUND" : "INTERNAL",
    );
  }
  await audit(
    admin.email,
    "grant_credits",
    { id: userId, email: await emailOf(userId) },
    {
      amount,
      note: note || null,
    },
  );
  refresh();
  return ok(amount);
}

/** Suspend (connexion impossible) ou réactive un compte ; jamais le sien. */
export async function setBanned(
  formData: FormData,
): Promise<ActionResult<null>> {
  const admin = await currentAdmin();
  if (!admin) return fail("FORBIDDEN");
  const parsed = banSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const { userId } = parsed.data;
  const banned = parsed.data.banned === "true";
  if (userId === admin.id) return fail("CONFLICT", { reason: "self" });

  const { error } = await createAdminClient().auth.admin.updateUserById(
    userId,
    {
      ban_duration: banned ? "876000h" : "none",
    },
  );
  if (error) return fail(error.status === 404 ? "NOT_FOUND" : "INTERNAL");
  await audit(admin.email, banned ? "ban" : "unban", {
    id: userId,
    email: await emailOf(userId),
  });
  refresh();
  return ok(null);
}

/**
 * Supprime définitivement un compte, comme à la demande de l'utilisateur (US-06) : abonnement
 * résilié, données effacées. L'e-mail du compte doit être saisi pour confirmer.
 */
export async function deleteUser(
  formData: FormData,
): Promise<ActionResult<never>> {
  const admin = await currentAdmin();
  if (!admin) return fail("FORBIDDEN");
  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const { userId, confirmation } = parsed.data;
  if (userId === admin.id) return fail("CONFLICT", { reason: "self" });

  const email = await emailOf(userId);
  if (!email) return fail("NOT_FOUND");
  if (confirmation !== email.toLowerCase()) {
    return fail("VALIDATION_ERROR", { confirmation: "invalidConfirmation" });
  }
  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  const result = await eraseAccount(
    userId,
    profile?.stripe_customer_id ?? null,
  );
  if (result !== "ok") return fail(result);

  await audit(admin.email, "delete", { id: userId, email });
  redirect("/admin/utilisateurs?supprime=1");
}

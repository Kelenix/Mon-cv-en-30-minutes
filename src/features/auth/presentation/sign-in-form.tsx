"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useActionState, useEffect, useState } from "react";
import { FormAlert } from "@/components/form/form-alert";
import { TextField } from "@/components/form/text-field";
import { useFormErrors } from "@/components/form/use-form-errors";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/core/action-result";
import {
  requestEmailCode,
  signInWithGoogle,
  verifyEmailCode,
} from "../actions";
import { localizedPath, safeNextPath } from "../paths";

const RESEND_DELAY_SECONDS = 60;

/**
 * Connexion sans mot de passe (US-04, docs/design/flows.md §3.4) : Google, ou e-mail puis code
 * à 6 chiffres reçu par e-mail. La page à ouvrir ensuite (`next`) est conservée à chaque étape.
 */
export function SignInForm({ googleEnabled }: { googleEnabled: boolean }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next")) ?? "";
  const linkError = searchParams.get("erreur");
  const [sentTo, setSentTo] = useState<string | null>(null);

  const hiddenFields = (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next} />
    </>
  );

  return (
    <div className="grid gap-6">
      {linkError ? (
        <FormAlert
          message={
            linkError === "google" ? t("googleFailed") : t("linkInvalid")
          }
        />
      ) : null}

      {googleEnabled ? (
        <>
          <form action={signInWithGoogle}>
            {hiddenFields}
            <Button type="submit" variant="outline" className="w-full">
              <GoogleMark />
              {t("google")}
            </Button>
          </form>
          <p className="flex items-center gap-3 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
            {t("or")}
          </p>
        </>
      ) : null}

      {sentTo ? (
        <CodeStep
          email={sentTo}
          hiddenFields={hiddenFields}
          onChangeEmail={() => setSentTo(null)}
        />
      ) : (
        <EmailStep hiddenFields={hiddenFields} onSent={setSentTo} />
      )}

      {next.startsWith(localizedPath(locale, "/creer")) ? (
        <p className="text-center text-muted-foreground">{t("answersKept")}</p>
      ) : null}
    </div>
  );
}

type StepProps = { hiddenFields: ReactNode };

function EmailStep({
  hiddenFields,
  onSent,
}: StepProps & { onSent: (email: string) => void }) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [result, action, pending] = useActionState(
    async (
      _previous: ActionResult<{ email: string }> | null,
      formData: FormData,
    ) => {
      const response = await requestEmailCode(formData);
      if (response.ok) onSent(response.data.email);
      return response;
    },
    null,
  );
  const errors = useFormErrors(result);

  return (
    <form action={action} className="grid gap-4" noValidate>
      {hiddenFields}
      <TextField
        name="email"
        type="email"
        label={t("emailLabel")}
        placeholder={t("emailPlaceholder")}
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.field("email")}
      />
      {result && !result.ok && result.error.code !== "VALIDATION_ERROR" ? (
        <FormAlert message={errors.message} />
      ) : null}
      <Button
        type="submit"
        disabled={pending || !email.trim()}
        aria-busy={pending}
      >
        {t("sendCode")}
      </Button>
    </form>
  );
}

function CodeStep({
  email,
  hiddenFields,
  onChangeEmail,
}: StepProps & { email: string; onChangeEmail: () => void }) {
  const t = useTranslations("auth");
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_DELAY_SECONDS);

  const [result, verifyAction, verifying] = useActionState(
    (_previous: ActionResult<never> | null, formData: FormData) =>
      verifyEmailCode(formData),
    null,
  );
  const [resendResult, resendAction, resending] = useActionState(
    async (
      _previous: ActionResult<{ email: string }> | null,
      formData: FormData,
    ) => {
      const response = await requestEmailCode(formData);
      if (response.ok) setSecondsLeft(RESEND_DELAY_SECONDS);
      return response;
    },
    null,
  );
  const errors = useFormErrors(result);
  const resendErrors = useFormErrors(resendResult);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return (
    <div className="grid gap-4">
      <p role="status" className="text-base">
        {t("codeSent", { email })}
      </p>
      <form action={verifyAction} className="grid gap-4" noValidate>
        {hiddenFields}
        <input type="hidden" name="email" value={email} />
        <TextField
          name="code"
          label={t("codeLabel")}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          className="text-xl tracking-[0.5em]"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          error={errors.field("code")}
        />
        {result && !result.ok && result.error.code !== "VALIDATION_ERROR" ? (
          <FormAlert message={errors.message} />
        ) : null}
        <Button
          type="submit"
          disabled={verifying || code.length !== 6}
          aria-busy={verifying}
        >
          {t("verify")}
        </Button>
      </form>
      <form
        action={resendAction}
        className="flex flex-wrap justify-between gap-2"
      >
        {hiddenFields}
        <input type="hidden" name="email" value={email} />
        <Button
          type="submit"
          variant="link"
          className="px-0"
          disabled={resending || secondsLeft > 0}
        >
          {secondsLeft > 0
            ? t("resendIn", { seconds: secondsLeft })
            : t("resend")}
        </Button>
        <Button
          type="button"
          variant="link"
          className="px-0"
          onClick={onChangeEmail}
        >
          {t("changeEmail")}
        </Button>
      </form>
      <FormAlert message={resendErrors.message} />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

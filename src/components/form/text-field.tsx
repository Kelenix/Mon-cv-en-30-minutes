import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TextFieldProps = ComponentProps<typeof Input> & {
  name: string;
  label: string;
  /** Mention « facultatif » ajoutée au libellé. */
  optionalLabel?: string;
  hint?: string;
  error?: string;
};

/** Champ libellé avec aide et message d'erreur reliés pour les lecteurs d'écran. */
export function TextField({
  name,
  label,
  optionalLabel,
  hint,
  error,
  id = name,
  ...inputProps
}: TextFieldProps) {
  const hintId = hint ? `${id}-aide` : undefined;
  const errorId = error ? `${id}-erreur` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-base">
        {label}
        {optionalLabel ? (
          <span className="font-normal text-muted-foreground">
            ({optionalLabel})
          </span>
        ) : null}
      </Label>
      <Input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

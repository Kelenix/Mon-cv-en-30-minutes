import { cn } from "@/lib/utils";

/** Message de résultat d'un formulaire, annoncé par les lecteurs d'écran. */
export function FormAlert({
  message,
  tone = "error",
}: {
  message?: string;
  tone?: "error" | "success";
}) {
  if (!message) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg px-4 py-3 text-base font-medium",
        tone === "error"
          ? "bg-destructive/10 text-destructive"
          : "bg-surface text-foreground",
      )}
    >
      {message}
    </p>
  );
}

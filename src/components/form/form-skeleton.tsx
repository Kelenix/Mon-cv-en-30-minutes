/** Squelette affiché pendant le chargement d'un formulaire (US-37). */
export function FormSkeleton({ fields }: { fields: number }) {
  return (
    <div aria-hidden="true" className="grid gap-5">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="grid gap-2">
          <div className="h-4 w-24 rounded bg-surface motion-safe:animate-pulse" />
          <div className="h-11 rounded-lg bg-surface motion-safe:animate-pulse" />
        </div>
      ))}
      <div className="h-11 w-40 rounded-full bg-surface motion-safe:animate-pulse" />
    </div>
  );
}

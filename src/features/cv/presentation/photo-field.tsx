"use client";

import { ImagePlusIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { removeCvPhoto, setCvPhoto } from "../actions";
import { CV_PHOTO } from "../templates";

/** Image choisie → JPEG portrait recadré au centre, réduit sous la taille maximale (base64). */
async function toPortraitJpeg(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  const { width, height, maxBytes } = CV_PHOTO;
  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas
    .getContext("2d")
    ?.drawImage(
      bitmap,
      (width - bitmap.width * scale) / 2,
      (height - bitmap.height * scale) / 2,
      bitmap.width * scale,
      bitmap.height * scale,
    );
  bitmap.close();
  for (const quality of [0.86, 0.72, 0.58]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (blob && blob.size <= maxBytes) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(blob);
      });
      return dataUrl.slice(dataUrl.indexOf(",") + 1);
    }
  }
  return null;
}

/**
 * Photo facultative du CV (US-45), pour les modèles qui en prévoient une : recadrée dans le
 * navigateur (rien d'autre que l'image finale n'est envoyé), visible seulement par son
 * propriétaire et dans ses exports.
 */
export function PhotoField({
  cvId,
  initialHasPhoto,
}: {
  cvId: string;
  initialHasPhoto: boolean;
}) {
  const t = useTranslations("cvTemplates.photo");
  const inputId = useId();
  // Version de l'image affichée : change à chaque envoi (pas de cache).
  const [version, setVersion] = useState(initialHasPhoto ? 1 : 0);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function upload(file: File) {
    setError(false);
    startTransition(async () => {
      const image = await toPortraitJpeg(file).catch(() => null);
      const result = image ? await setCvPhoto({ cvId, image }) : null;
      if (result?.ok) setVersion(Date.now());
      else setError(true);
    });
  }

  function remove() {
    setError(false);
    startTransition(async () => {
      const result = await removeCvPhoto({ cvId });
      if (result.ok) setVersion(0);
      else setError(true);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {version ? (
        <Image
          src={`/api/cv/${cvId}/photo?v=${version}`}
          alt={t("alt")}
          width={CV_PHOTO.width}
          height={CV_PHOTO.height}
          unoptimized
          className="h-15 w-12 rounded-sm object-cover ring-1 ring-border"
        />
      ) : null}
      <div className="grid gap-1">
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor={inputId}
            aria-disabled={pending || undefined}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold transition-colors outline-none hover:bg-surface has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40 aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <ImagePlusIcon aria-hidden="true" className="size-4" />
            {version ? t("change") : t("add")}
            <input
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-describedby={`${inputId}-aide`}
              disabled={pending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) upload(file);
              }}
            />
          </label>
          {version ? (
            <Button variant="ghost" disabled={pending} onClick={remove}>
              <Trash2Icon aria-hidden="true" />
              {t("remove")}
            </Button>
          ) : null}
        </div>
        <p id={`${inputId}-aide`} className="text-sm text-muted-foreground">
          {t("hint")}
        </p>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {t("error")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

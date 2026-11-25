-- Inc-15 — Modèle de mise en page et pays visé de chaque CV (ADR-050, US-43 à US-46).
-- Le modèle se choisit librement (essai) ; le droit de télécharger un modèle payant est vérifié
-- par la route d'export, comme le filigrane.

alter table public.cvs
  add column template text not null default 'ats-classique'
    check (
      template in (
        'ats-classique',
        'europeen',
        'ats-moderne',
        'lebenslauf',
        'moderne',
        'elegant'
      )
    ),
  -- Pays visé (ISO 3166-1 alpha-2) : sert aux recommandations de modèle.
  add column target_country text check (target_country ~ '^[A-Z]{2}$');

-- Chacun change le modèle et le pays de ses propres CV (politique cvs_update_own).
grant update (template, target_country) on table public.cvs to authenticated;

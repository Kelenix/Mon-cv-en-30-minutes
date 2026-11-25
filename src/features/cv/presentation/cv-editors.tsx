"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { joinFilled, titleLine } from "../content";
import { CV_LIMITS, type CvContent } from "../schemas";

// Modification sur place de chaque rubrique (US-14) : longueurs maximales imposées à la saisie,
// ajout, suppression et réordonnancement des expériences, formations et langues.

type Change<T> = (value: T) => void;

function replaceAt<T>(list: T[], index: number, item: T) {
  return list.map((current, position) => (position === index ? item : current));
}

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function Field({
  label,
  value,
  onChange,
  max,
  rows,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: Change<string>;
  max: number;
  /** Zone de texte sur plusieurs lignes (avec compteur) plutôt qu'un champ simple. */
  rows?: number;
  hint?: string;
  error?: string;
}) {
  const t = useTranslations("cvEditor");
  const id = useId();
  const describedBy =
    joinFilled([hint && `${id}-aide`, error && `${id}-erreur`], " ") ||
    undefined;
  const props = {
    id,
    value,
    maxLength: max,
    onChange: (event: { target: { value: string } }) =>
      onChange(event.target.value),
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
  };

  return (
    <div className="grid gap-1.5 font-sans">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      {rows ? <Textarea rows={rows} {...props} /> : <Input {...props} />}
      {hint ? (
        <p id={`${id}-aide`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-erreur`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      {rows && !error ? (
        <p className="justify-self-end text-xs text-muted-foreground tabular-nums">
          {t("counter", { count: value.length, max })}
        </p>
      ) : null}
    </div>
  );
}

/** Élément d'une liste : champs, puis monter, descendre, supprimer. */
function ListItem({
  name,
  index,
  count,
  onMove,
  onRemove,
  children,
}: {
  name: string;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("cvEditor");
  return (
    <div className="grid gap-3 rounded-lg border border-border p-3 font-sans">
      {children}
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("moveUp", { item: name })}
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
        >
          <ArrowUpIcon aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("moveDown", { item: name })}
          disabled={index === count - 1}
          onClick={() => onMove(index, index + 1)}
        >
          <ArrowDownIcon aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("remove", { item: name })}
          onClick={onRemove}
        >
          <Trash2Icon aria-hidden="true" className="text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function AddButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      variant="outline"
      className="justify-self-start font-sans"
      onClick={onClick}
      disabled={disabled}
    >
      <PlusIcon aria-hidden="true" />
      {label}
    </Button>
  );
}

export function HeaderEditor({
  header,
  onChange,
}: {
  header: CvContent["header"];
  onChange: Change<CvContent["header"]>;
}) {
  const t = useTranslations("cvEditor.fields");
  const set = (key: keyof CvContent["header"]) => (value: string) =>
    onChange({ ...header, [key]: value });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field
        label={t("fullName")}
        value={header.fullName}
        onChange={set("fullName")}
        max={CV_LIMITS.name}
      />
      <Field
        label={t("title")}
        value={header.title}
        onChange={set("title")}
        max={CV_LIMITS.title}
      />
      <Field
        label={t("email")}
        value={header.email ?? ""}
        onChange={set("email")}
        max={CV_LIMITS.email}
      />
      <Field
        label={t("phone")}
        value={header.phone ?? ""}
        onChange={set("phone")}
        max={CV_LIMITS.phone}
      />
      <Field
        label={t("city")}
        value={header.city ?? ""}
        onChange={set("city")}
        max={CV_LIMITS.city}
      />
    </div>
  );
}

export function SummaryEditor({
  summary,
  onChange,
}: {
  summary: string;
  onChange: Change<string>;
}) {
  const t = useTranslations("cvEditor.fields");
  return (
    <Field
      label={t("summary")}
      value={summary}
      onChange={onChange}
      max={CV_LIMITS.summary}
      rows={5}
    />
  );
}

export function ExperiencesEditor({
  items,
  onChange,
}: {
  items: CvContent["experiences"];
  onChange: Change<CvContent["experiences"]>;
}) {
  const t = useTranslations("cvEditor");
  return (
    <div className="grid gap-3">
      {items.map((item, index) => {
        const set = (patch: Partial<typeof item>) =>
          onChange(replaceAt(items, index, { ...item, ...patch }));
        return (
          <ListItem
            key={item.id}
            name={titleLine(item.role, item.company) || t("untitled")}
            index={index}
            count={items.length}
            onMove={(from, to) => onChange(move(items, from, to))}
            onRemove={() =>
              onChange(items.filter((_, position) => position !== index))
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={t("fields.role")}
                value={item.role}
                onChange={(role) => set({ role })}
                max={CV_LIMITS.role}
              />
              <Field
                label={t("fields.company")}
                value={item.company}
                onChange={(company) => set({ company })}
                max={CV_LIMITS.company}
              />
              <Field
                label={t("fields.location")}
                value={item.location ?? ""}
                onChange={(location) => set({ location })}
                max={CV_LIMITS.location}
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label={t("fields.startDate")}
                  value={item.startDate ?? ""}
                  onChange={(startDate) => set({ startDate })}
                  max={CV_LIMITS.date}
                />
                <Field
                  label={t("fields.endDate")}
                  value={item.endDate ?? ""}
                  onChange={(endDate) => set({ endDate })}
                  max={CV_LIMITS.date}
                />
              </div>
            </div>
            {item.bullets.map((bullet, position) => (
              <div key={position} className="flex items-start gap-2">
                <div className="flex-1">
                  <Field
                    label={t("fields.bullet", { number: position + 1 })}
                    value={bullet}
                    onChange={(value) =>
                      set({ bullets: replaceAt(item.bullets, position, value) })
                    }
                    max={CV_LIMITS.bullet}
                    rows={2}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-6"
                  aria-label={t("removeBullet", { number: position + 1 })}
                  onClick={() =>
                    set({
                      bullets: item.bullets.filter(
                        (_, current) => current !== position,
                      ),
                    })
                  }
                >
                  <Trash2Icon aria-hidden="true" className="text-destructive" />
                </Button>
              </div>
            ))}
            <AddButton
              label={t("addBullet")}
              disabled={item.bullets.length >= CV_LIMITS.bullets}
              onClick={() => set({ bullets: [...item.bullets, ""] })}
            />
          </ListItem>
        );
      })}
      <AddButton
        label={t("addExperience")}
        disabled={items.length >= CV_LIMITS.experiences}
        onClick={() =>
          onChange([
            ...items,
            { id: crypto.randomUUID(), role: "", company: "", bullets: [] },
          ])
        }
      />
    </div>
  );
}

export function SkillsEditor({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: Change<string[]>;
}) {
  const t = useTranslations("cvEditor");
  // Texte saisi gardé tel quel (lignes vides en cours de frappe), liste dérivée à chaque frappe.
  const [text, setText] = useState(skills.join("\n"));
  const list = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const invalid =
    list.length > CV_LIMITS.skills ||
    list.some((skill) => skill.length > CV_LIMITS.skill);

  return (
    <Field
      label={t("fields.skills")}
      hint={t("skillsHint")}
      error={
        invalid
          ? t("skillsLimit", { count: CV_LIMITS.skills, max: CV_LIMITS.skill })
          : undefined
      }
      value={text}
      onChange={(value) => {
        setText(value);
        onChange(
          value
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        );
      }}
      max={CV_LIMITS.skills * (CV_LIMITS.skill + 1)}
      rows={6}
    />
  );
}

export function EducationEditor({
  items,
  onChange,
}: {
  items: CvContent["education"];
  onChange: Change<CvContent["education"]>;
}) {
  const t = useTranslations("cvEditor");
  return (
    <div className="grid gap-3">
      {items.map((item, index) => {
        const set = (patch: Partial<typeof item>) =>
          onChange(replaceAt(items, index, { ...item, ...patch }));
        return (
          <ListItem
            key={item.id}
            name={titleLine(item.degree, item.school) || t("untitled")}
            index={index}
            count={items.length}
            onMove={(from, to) => onChange(move(items, from, to))}
            onRemove={() =>
              onChange(items.filter((_, position) => position !== index))
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={t("fields.degree")}
                value={item.degree}
                onChange={(degree) => set({ degree })}
                max={CV_LIMITS.degree}
              />
              <Field
                label={t("fields.school")}
                value={item.school}
                onChange={(school) => set({ school })}
                max={CV_LIMITS.school}
              />
              <Field
                label={t("fields.year")}
                value={item.year ?? ""}
                onChange={(year) => set({ year })}
                max={CV_LIMITS.date}
              />
            </div>
            <Field
              label={t("fields.details")}
              value={item.details ?? ""}
              onChange={(details) => set({ details })}
              max={CV_LIMITS.details}
              rows={2}
            />
          </ListItem>
        );
      })}
      <AddButton
        label={t("addEducation")}
        disabled={items.length >= CV_LIMITS.education}
        onClick={() =>
          onChange([
            ...items,
            { id: crypto.randomUUID(), degree: "", school: "" },
          ])
        }
      />
    </div>
  );
}

export function LanguagesEditor({
  items,
  onChange,
}: {
  items: CvContent["languages"];
  onChange: Change<CvContent["languages"]>;
}) {
  const t = useTranslations("cvEditor");
  return (
    <div className="grid gap-3">
      {items.map((item, index) => {
        const set = (patch: Partial<typeof item>) =>
          onChange(replaceAt(items, index, { ...item, ...patch }));
        return (
          <ListItem
            key={item.id}
            name={item.name || t("untitled")}
            index={index}
            count={items.length}
            onMove={(from, to) => onChange(move(items, from, to))}
            onRemove={() =>
              onChange(items.filter((_, position) => position !== index))
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={t("fields.language")}
                value={item.name}
                onChange={(name) => set({ name })}
                max={CV_LIMITS.language}
              />
              <Field
                label={t("fields.level")}
                value={item.level ?? ""}
                onChange={(level) => set({ level })}
                max={CV_LIMITS.level}
              />
            </div>
          </ListItem>
        );
      })}
      <AddButton
        label={t("addLanguage")}
        disabled={items.length >= CV_LIMITS.languages}
        onClick={() =>
          onChange([...items, { id: crypto.randomUUID(), name: "" }])
        }
      />
    </div>
  );
}
